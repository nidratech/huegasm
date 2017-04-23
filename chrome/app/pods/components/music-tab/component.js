import Ember from 'ember';

const {
  A,
  Component,
  observer,
  isEmpty,
  isNone,
  $,
  inject: { service },
  run: { later, once, next }
} = Ember;

export default Component.extend({
  classNames: ['col-sm-10', 'col-sm-offset-1', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'music-tab',

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
              value = 'High';
            } else if (value === 0.25) {
              value = '';
            } else {
              value = 'Low';
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
        values: [1, 63, 127, 190, 254],
        density: 10,
        format: {
          to: function (value) {
            if (value === 63) {
              value = 25;
            } else if (value === 127) {
              value = 50;
            } else if (value === 190) {
              value = 75;
            } else if (value === 254) {
              value = 100;
            }

            return value;
          },
          from: function (value) { return value; }
        }
      }
    }
  },

  threshold: 0.2,
  hueRange: [0, 65535],
  brightnessRange: [1, 254],

  lastLightBopIndex: 0,

  songBeatPreferences: {},
  usingBeatPreferences: false,
  oldBeatPrefCache: null,
  isListenining: false,
  firstVisit: true,

  // noUiSlider connection specification
  filledConnect: [true, false],
  hueRangeConnect: [false, true, false],

  onActive: observer('active', function () {
    if (this.get('active') && this.get('firstVisit')) {
      chrome.storage.local.set({ firstVisit: false });
      this.set('firstVisit', false);

      next(this, () => {
        $('#fancy-button-wrapper a').popover('show');

        later(this, () => {
          $('#fancy-button-wrapper a').popover('hide');
        }, 5000);
      });
    }
  }),

  onConfigItemChanged: observer('threshold', 'hueRange', 'brightnessRange', 'isListenining', function (_class, name) {
    once(this, () => {
      let value = this.get(name);

      this.set(name, value);

      if (name === 'isListenining') {
        if (value) {
          chrome.storage.local.get('currentlyListenining', ({currentlyListenining}) => {
            if (!currentlyListenining) {
              chrome.runtime.sendMessage({ action: 'start-listening' }, (response) => {
                if (response && response.error) {
                  let message = response.error;

                  if (message === 'Extension has not been invoked for the current page (see activeTab permission). Chrome pages cannot be captured.') {
                    message = 'Please click inside the tab you want to listen to.'
                  }
        
                  this.get('notify').warning({ html: '<div class="alert alert-warning" role="alert">' + message + '</div>' });

                  this.set('isListenining', false);
                  chrome.storage.local.set({ isListenining: false });
                }
              });
            }
          });
        } else {
          chrome.runtime.sendMessage({ action: 'stop-listening' });
        }

        this.set('pauseLightUpdates', value);
      }

      let toSave = {};
      toSave[name] = value;
      chrome.storage.local.set(toSave);
    });
  }),

  simulateKick() {
    this.buttonBump();

    let activeLights = this.get('activeLights'),
      lightsData = this.get('lightsData'),
      color = null,
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
        hueRange = this.get('hueRange'),
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

      color = Math.floor(Math.random() * (hueRange[1] - hueRange[0] + 1) + hueRange[0]);

      stimulateLight(light, brightnessRange[1], color);
      later(this, stimulateLight, light, brightnessRange[0], timeToBriOff);
    }

    this.set('paused', true);
    later(this, function () {
      this.set('paused', false);
    }, 200);
  },

  buttonBump() {
    $('.fancy-button').velocity({ scale: 1.05 }, 100).velocity({ scale: 1 }, 100);
  },

  init() {
    this._super(...arguments);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'button-bump') {
        this.buttonBump();
      }
    });

    chrome.storage.local.get('threshold', ({threshold}) => {
      if (!isNone(threshold)) {
        this.set('threshold', threshold);
      }
    });

    chrome.storage.local.get('hueRange', ({hueRange}) => {
      if (!isNone(hueRange)) {
        this.set('hueRange', hueRange);
      }
    });

    chrome.storage.local.get('brightnessRange', ({brightnessRange}) => {
      if (!isNone(brightnessRange)) {
        this.set('brightnessRange', brightnessRange);
      }
    });

    chrome.storage.local.get('isListenining', ({isListenining}) => {
      if (!isNone(isListenining)) {
        this.set('isListenining', isListenining);
      }
    });

    chrome.storage.local.get('firstVisit', ({firstVisit}) => {
      if (!isNone(firstVisit)) {
        this.set('firstVisit', firstVisit);
      }
    });
  },

  didInsertElement() {
    // prevent space/text selection when the user repeatedly clicks on the center
    $('#beat-container').on('mousedown', '#beat-speaker-center-inner', function (event) {
      event.preventDefault();
    });
  },

  actions: {
    toggleListening() {
      this.toggleProperty('isListenining');
    },
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    }
  }
});
