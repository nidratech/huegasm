import Ember from 'ember';

const {
  A,
  Component,
  observer,
  isEmpty,
  isNone,
  $,
  inject: { service },
  run: { later, next }
} = Ember;

export default Component.extend({
  classNames: ['col-sm-10', 'col-sm-offset-1', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'music-tab',

  dancer: null,

  notify: service(),

  beatOptions: {
    threshold: {
      range: { min: 0, max: 0.5 },
      step: 0.01,
      defaultValue: 0.3,
      pips: {
        mode: 'values',
        values: [0, 0.25, 0.5],
        density: 10,
        format: {
          to: function (value) {
            if (value === 0) {
              value = 'More';
            } else if (value === 0.25) {
              value = '';
            } else {
              value = 'Less';
            }

            return value;
          },
          from: function (value) { return value; }
        }
      }
    },
    hueRange: {
      range: { min: 0, max: 65535 },
      step: 1,
      defaultValue: 0.3,
      pips: {
        mode: 'values',
        values: [0, 25500, 46920, 65535],
        density: 10,
        format: {
          to: function (value) {
            if (value === 0 || value === 65535) {
              value = 'Red';
            } else if (value === 25500) {
              value = 'Green';
            } else {
              value = 'Blue';
            }

            return value;
          },
          from: function (value) { return value; }
        }
      }
    },
    brightnessRange: {
      range: { min: 1, max: 254 },
      step: 1,
      defaultValue: 0,
      pips: {
        mode: 'values',
        values: [1, 50, 100, 150, 200, 254],
        density: 10,
        format: {
          to: function (value) { return value; },
          from: function (value) { return value; }
        }
      }
    }
  },

  threshold: 0.3,
  hueRange: [0, 65535],
  brightnessRange: [1, 254],
  oldThreshold: null,

  lastLightBopIndex: 0,

  playerBottomDisplayed: true,
  audioStream: null,
  dimmerOn: false,

  colorloopMode: false,
  flashingTransitions: false,

  // 0 - no repeat, 1 - repeat all, 2 - repeat one
  repeat: 0,
  shuffle: false,
  volumeMuted: false,
  volume: 100,
  // beat detection related pausing
  paused: false,
  songBeatPreferences: {},
  usingBeatPreferences: false,
  oldBeatPrefCache: null,
  firstVisit: true,

  // noUiSlider connection specification
  filledConnect: [true, false],
  hueRangeConnect: [false, true, false],

  changePlayerControl(name, value) {
    this.set(name, value);

    if (name === 'threshold') {
      this.get('kick').set({ threshold: value });
    }

    chrome.storage.local.set('huegasm.' + name, value);
  },

  simulateKick(/*mag, ratioKickMag*/) {
    let activeLights = this.get('activeLights'),
      lightsData = this.get('lightsData'),
      color = null,

      transitiontime = this.get('flashingTransitions'),
      stimulateLight = (light, brightness, hue) => {
        let options = { 'bri': brightness };

        if (transitiontime) {
          options['transitiontime'] = 0;
        } else {
          options['transitiontime'] = 1;
        }

        if (!isNone(hue)) {
          options.hue = hue;
        }

        if (lightsData[light].state.on === false) {
          options.on = true;
        }

        $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify(options),
          contentType: 'application/json',
          type: 'PUT'
        });
      },
      timeToBriOff = 100;

    if (activeLights.length > 0) {
      let lastLightBopIndex = this.get('lastLightBopIndex'),
        lightBopIndex,
        brightnessRange = this.get('brightnessRange'),
        light;

      lightBopIndex = Math.floor(Math.random() * activeLights.length);

      // let's try not to select the same light twice in a row
      if (activeLights.length > 1) {
        while (lightBopIndex === lastLightBopIndex) {
          lightBopIndex = Math.floor(Math.random() * activeLights.length);
        }
      }

      light = activeLights[lightBopIndex];
      this.set('lastLightBopIndex', lightBopIndex);

      if (!this.get('colorloopMode')) {
        let hueRange = this.get('hueRange');

        color = Math.floor(Math.random() * (hueRange[1] - hueRange[0] + 1) + hueRange[0]);
      }

      if (transitiontime) {
        timeToBriOff = 80;
      }

      stimulateLight(light, brightnessRange[1], color);
      later(this, stimulateLight, light, brightnessRange[0], timeToBriOff);
    }

    this.set('paused', true);
    later(this, function () {
      this.set('paused', false);
    }, 150);

    //work the music beat area - simulate the speaker vibration by running a CSS animation on it
    $('#beat-speaker-center-outer').velocity({ blur: 3 }, 100).velocity({ blur: 0 }, 100);
    $('#beat-speaker-center-inner').velocity({ scale: 1.05 }, 100).velocity({ scale: 1 }, 100);
  },

  init() {
    this._super(...arguments);

    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    let dancer = new Dancer(),
      kick = dancer.createKick({
        threshold: this.get('threshold'),
        onKick: (mag, ratioKickMag) => {
          if (this.get('paused') === false) {
            this.simulateKick(mag, ratioKickMag);
          }
        }
      });

    kick.on();

    this.setProperties({
      dancer: dancer,
      kick: kick
    });

    ['threshold', 'playerBottomDisplayed', 'flashingTransitions', 'colorloopMode', 'hueRange', 'brightnessRange'].forEach((item) => {
      if (!isNone(chrome.storage.local.get('huegasm.' + item))) {
        let itemVal = chrome.storage.local.get('huegasm.' + item);

        if (isNone(this.actions[item + 'Changed'])) {
          this.set(item, itemVal);
        } else {
          this.send(item + 'Changed', itemVal);
        }
      }
    });
  },

  didInsertElement() {
    this._super();

    let self = this;

    // prevent space/text selection when the user repeatedly clicks on the center
    $('#beat-container').on('mousedown', '#beat-speaker-center-inner', function (event) {
      event.preventDefault();
    });

    if (!this.get('playerBottomDisplayed')) {
      $('#player-bottom').hide();
    }
  },

  actions: {
    slideTogglePlayerBottom() {
      let elem = this.$('#player-bottom');

      elem.velocity(elem.is(':visible') ? 'slideUp' : 'slideDown', { duration: 300 });
      this.changePlayerControl('playerBottomDisplayed', !this.get('playerBottomDisplayed'));
    },
    playerBottomDisplayedChanged(value) {
      this.changePlayerControl('playerBottomDisplayed', value);
    },
    thresholdChanged(value) {
      this.changePlayerControl('threshold', value, true);
    },
    brightnessRangeChanged(value) {
      this.changePlayerControl('brightnessRange', value);
    },
    hueRangeChanged(value) {
      this.changePlayerControl('hueRange', value);
    },
    clickSpeaker() {
      this.simulateKick(1);
    },
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    }
  }
});
