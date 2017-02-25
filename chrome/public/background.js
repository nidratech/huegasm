'use strict';

// utility functions
let isNone = function (obj) {
    return obj === null || obj === undefined;
};

// drive the application state by listening its on its change in the storage
// the main ember app controls may change these
let state = {
    activeLights: [],
    threshold: 0.3,
    hueRange: [0, 65535],
    brightnessRange: [1, 254],
    bridgeIp: null,
    bridgeUsername: null,
    lightsData: null,
    lastLightBopIndex: 0, // background only properties below here
    paused: false,
    preMusicLightsDataCache: null
};

let dancer = new window.Dancer(),
    stream = null,
    kick;

// initialze the state
chrome.storage.local.get('activeLights', ({activeLights}) => {
    if (!isNone(activeLights)) {
        state.activeLights = activeLights;
    }
});

chrome.storage.local.get('threshold', ({threshold}) => {
    if (!isNone(threshold)) {
        state.threshold = threshold;
    }

    kick = dancer.createKick({
        threshold: state.threshold,
        onKick: function (mag, ratioKickMag) {
            if (state.paused === false) {
                simulateKick(mag, ratioKickMag);
            }
        }
    });

    kick.on();
});

chrome.storage.local.get('hueRange', ({hueRange}) => {
    if (!isNone(hueRange)) {
        state.hueRange = hueRange;
    }
});

chrome.storage.local.get('brightnessRange', ({brightnessRange}) => {
    if (!isNone(brightnessRange)) {
        state.brightnessRange = brightnessRange;
    }
});

chrome.storage.local.get('bridgeIp', ({bridgeIp}) => {
    if (!isNone(bridgeIp)) {
        state.bridgeIp = bridgeIp;
    }
});

chrome.storage.local.get('bridgeUsername', ({bridgeUsername}) => {
    if (!isNone(bridgeUsername)) {
        state.bridgeUsername = bridgeUsername;
    }
});

chrome.storage.local.get('lightsData', ({lightsData}) => {
    if (!isNone(lightsData)) {
        state.lightsData = lightsData;
    }
});

// add listeners for appliation state change
chrome.storage.onChanged.addListener(function ({activeLights, threshold, hueRange, brightnessRange, bridgeIp, bridgeUsername, lightsData}) {
    if (activeLights) {
        state.activeLights = activeLights.newValue;
    }

    if (threshold) {
        state.threshold = threshold.newValue;
        kick.set({ threshold: state.threshold });
    }

    if (hueRange) {
        state.hueRange = hueRange.newValue;
    }

    if (brightnessRange) {
        state.brightnessRange = brightnessRange.newValue;
    }

    if (bridgeIp) {
        state.bridgeIp = bridgeIp.newValue;
    }

    if (bridgeUsername) {
        state.bridgeUsername = bridgeUsername.newValue;
    }

    if (lightsData) {
        state.lightsData = lightsData.newValue;
    }
})

chrome.storage.local.set({ currentlyListenining: false });
chrome.browserAction.setBadgeBackgroundColor({ color: [80, 80, 80, 255] });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'start-listening') {
        chrome.tabCapture.capture({
            audio: true,
            video: false
        }, function (_stream) {
            let error = null;

            if (!_stream) {
                error = chrome.runtime.lastError.message;
            } else {
                stream = _stream;
                dancer.load(_stream, 2);
                chrome.storage.local.set({ currentlyListenining: true });
                chrome.browserAction.setBadgeText({ text: "♪" });
                state.preMusicLightsDataCache = state.lightsData;
            }

            sendResponse({ error });

            return true;
        });
    } else if (request.action === 'stop-listening' && stream !== null) {
        stream.getTracks()[0].stop();
        stream = null;
        chrome.browserAction.setBadgeText({ text: "" });
        chrome.storage.local.set({ currentlyListenining: false });

        let updateLight = function (lightIndex) {
            $.ajax('http://' + state.bridgeIp + '/api/' + state.bridgeUsername + '/lights/' + lightIndex + '/state', {
                data: JSON.stringify({
                    'on': state.preMusicLightsDataCache[lightIndex].state.on,
                    'hue': state.preMusicLightsDataCache[lightIndex].state.hue,
                    'bri': state.preMusicLightsDataCache[lightIndex].state.bri
                }),
                contentType: 'application/json',
                type: 'PUT'
            });
        };

        for (let key in state.lightsData) {
            if (state.lightsData.hasOwnProperty(key)) {
                setTimeout(function () {
                    updateLight(key);
                }, 1000);
            }
        }
    }

    return true;
});

// core function that simulates a random light on kick ( beat )
let simulateKick = (/*mag, ratioKickMag*/) => {
    chrome.runtime.sendMessage({ action: 'button-bump' });

    let color = null,
        _stimulateLight = (light, brightness, hue) => {
            let options = { bri: brightness, transitiontime: 1 },
                xhr = new XMLHttpRequest();

            if (!isNone(hue)) {
                options.hue = hue;
            }

            if (state.lightsData[light].state.on === false) {
                options.on = true;
            }

            $.ajax('http://' + state.bridgeIp + '/api/' + state.bridgeUsername + '/lights/' + light + '/state', {
                data: JSON.stringify(options),
                contentType: 'application/json',
                type: 'PUT'
            });
        },
        timeToBriOff = 100;

    if (state.activeLights.length > 0) {
        let lightBopIndex = Math.floor(Math.random() * state.activeLights.length);

        // let's try not to select the same light twice in a row
        if (state.activeLights.length > 1) {
            while (lightBopIndex === state.lastLightBopIndex) {
                lightBopIndex = Math.floor(Math.random() * state.activeLights.length);
            }
        }

        let light = state.activeLights[lightBopIndex];
        state.lastLightBopIndex = lightBopIndex;

        color = Math.floor(Math.random() * (state.hueRange[1] - state.hueRange[0] + 1) + state.hueRange[0]);

        _stimulateLight(light, state.brightnessRange[1], color);
        setTimeout(function () {
            _stimulateLight(light, state.brightnessRange[0])
        }, timeToBriOff);
    }

    state.paused = true;
    setTimeout(function () {
        state.paused = false;
    }, 200);
};