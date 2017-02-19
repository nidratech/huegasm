import Ember from 'ember';

const {
  A,
  Component,
  observer,
  isEmpty,
  isNone,
  $,
  inject: { service },
  run: { later, next, once }
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

  threshold: 0.3,
  hueRange: [0, 65535],
  brightnessRange: [1, 254],

  lastLightBopIndex: 0,

  colorloopMode: false,
  flashingTransitions: false,

  songBeatPreferences: {},
  usingBeatPreferences: false,
  oldBeatPrefCache: null,
  isListenining: false,

  // noUiSlider connection specification
  filledConnect: [true, false],
  hueRangeConnect: [false, true, false],

  onConfigItemChanged: observer('threshold', 'flashingTransitions', 'colorloopMode', 'hueRange', 'brightnessRange', 'isListenining', function (wtf, name) {
    once(this, () => {
      let value = this.get(name),
        self = this;

      this.set(name, value);

      if (name === 'isListenining' && value) {
        chrome.runtime.sendMessage({ action: 'start-listening' }, function (response) {
          if (response && response.error) {
            self.get('notify').warning({ html: '<div class="alert alert-warning" role="alert">' + response.error + '</div>' });

            self.set('isListenining', false);
            chrome.storage.local.set({ isListenining: false });
          }
        });
      }

      let toSave = {};
      toSave[name] = value;
      chrome.storage.local.set(toSave);
    });
  }),

  simulateKick() {
    this.speakerBump();

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
  },

  speakerBump() {
    $('#beat-speaker-center-outer').velocity({ blur: 3 }, 100).velocity({ blur: 0 }, 100);
    $('#beat-speaker-center-inner').velocity({ scale: 1.05 }, 100).velocity({ scale: 1 }, 100);
  },

  init() {
    this._super(...arguments);

    chrome.storage.local.get('threshold', ({threshold}) => {
      if (!isNone(threshold)) {
        this.set('threshold', threshold);
      }
    });

    chrome.storage.local.get('flashingTransitions', ({flashingTransitions}) => {
      if (!isNone(flashingTransitions)) {
        this.set('flashingTransitions', flashingTransitions);
      }
    });

    chrome.storage.local.get('colorloopMode', ({colorloopMode}) => {
      if (!isNone(colorloopMode)) {
        this.set('colorloopMode', colorloopMode);
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
    clickSpeaker() {
      this.simulateKick();
    },
    hideTooltip() {
      $('.bootstrap-tooltip').tooltip('hide');
    },
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    }
  }
});
