import Ember from 'ember';

const { Component, observer, computed, on, run: { later, once }, $ } = Ember;

export default Component.extend({
  classNames: ['col-sm-10', 'col-sm-offset-1', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'lights-tab',

  rgb: [255, 255, 255],

  lightsOn: false,

  // COLOR LOOP related stuff
  colorLoopOn: false,

  lightsOnTxt: computed('lightsOn', function () {
    return this.get('lightsOn') ? 'On' : 'Off';
  }),

  colorloopOnTxt: computed('colorLoopOn', function () {
    return this.get('colorLoopOn') ? 'On' : 'Off';
  }),

  // determines the average brightness of the hue system for the brightness slider
  lightsBrightness: computed('lightsData', 'activeLights.[]', function () {
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      lightsBrightness = 0;

    activeLights.forEach(function (light) {
      lightsBrightness += lightsData[light].state.bri;
    });

    return lightsBrightness / activeLights.length;
  }),

  brightnessControlDisabled: computed.not('lightsOn'),

  onColorLoopOnChange: observer('colorLoopOn', function () {
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      colorLoopsOn = this.get('colorLoopOn'),
      effect = colorLoopsOn ? 'colorloop' : 'none';

    let colorLoopsOnSystem = activeLights.some(function (light) {
      return lightsData[light].state.effect === 'colorloop';
    });

    // if the internal lights state is different than the one from lightsData (user manually toggled the switch), send the request to change the bulbs state
    if (colorLoopsOn !== colorLoopsOnSystem) {
      activeLights.forEach((light) => {
        if (this.get('lightsData')[light].state.effect !== effect) {
          $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
            data: JSON.stringify({ 'effect': effect }),
            contentType: 'application/json',
            type: 'PUT'
          });
        }
      });
    }
  }),

  rgbPreview: observer('rgb', function () {
    let rgb = this.get('rgb'),
      xy = rgbToCie(rgb[0], rgb[1], rgb[2]);

    this.set('colorLoopOn', false);

    this.get('activeLights').forEach((light) => {
      $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
        data: JSON.stringify({ "xy": xy }),
        contentType: 'application/json',
        type: 'PUT'
      });
    });

    this.set('colorLoopOn', false);
    $('.color').css('background', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
  }),

  onActiveLightsChange: on('init', observer('activeLights.[]', function () {
    let lightsData = this.get('lightsData'),
      xy = null,
      setRGB = true;

    this.get('activeLights').forEach((i) => {
      let light = lightsData[i];

      if (xy !== null && xy[0] !== light.state.xy[0] && xy[1] !== light.state.xy[1]) {
        setRGB = false;
      }

      xy = light.state.xy;
    });

    if (setRGB && xy) {
      let rgb = cieToRgb(xy[0], xy[1]);

      $('.color').css('background', 'rgb(' + Math.abs(rgb[0]) + ',' + Math.abs(rgb[1]) + ',' + Math.abs(rgb[2]) + ')');
    } else {
      $('.color').css('background', 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')');
    }
  })),

  // determines whether the lights are on/off for the lights switch
  lightsOnChange: on('init', observer('lightsData.@each.state.on', 'activeLights.[]', function () {
    if (!this.get('strobeOn')) {
      let lightsData = this.get('lightsData'), lightsOn = this.get('activeLights').some(function (light) {
        return lightsData[light].state.on === true;
      });

      this.set('lightsOn', lightsOn);
    }
  })),

  onLightsOnChange: observer('lightsOn', function () {
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      lightsOn = this.get('lightsOn');

    let lightsOnSystem = activeLights.some(function (light) {
      return lightsData[light].state.on === true;
    });

    // if the internal lights state is different than the one from lightsData (user manually toggled the switch), send the request to change the bulbs state
    if (lightsOn !== lightsOnSystem) {
      activeLights.forEach((light) => {
        $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify({ "on": lightsOn }),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  }),

  onBrightnessChanged: observer('lightsBrightness', function () {
    once(this, function () {
      let lightsData = this.get('lightsData'),
        lightsBrightnessSystem = false,
        lightsBrightness = this.get('lightsBrightness'),
        activeLights = this.get('activeLights');

      activeLights.forEach(function (light) {
        lightsBrightnessSystem += lightsData[light].state.bri;
      });

      lightsBrightnessSystem /= activeLights.length;

      // if the internal lights state is different than the one from lightsData (user manually toggled the switch), send the request to change the bulbs state
      if (lightsBrightness !== lightsBrightnessSystem) {
        activeLights.forEach((light) => {
          $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
            data: JSON.stringify({ "bri": lightsBrightness }),
            contentType: 'application/json',
            type: 'PUT'
          });
        });
      }
    });
  }),

  // sync the current light settings to the newly added light
  onaActiveLightsChange: observer('syncLight', function () {
    let options = {
      on: this.get('lightsOn'),
      bri: this.get('lightsBrightness'),
      effect: this.get('colorLoopOn') ? 'colorloop' : 'none'
    }, rgb = this.get('rgb'),
      syncLight = this.get('syncLight');

    if (rgb[0] !== 255 && rgb[1] !== 255 && rgb[2] !== 255) {
      options['xy'] = this.rgbToXy(rgb[0], rgb[1], rgb[2]);
    }

    options['transitiontime'] = 0;

    $.ajax(this.get('apiURL') + '/lights/' + syncLight + '/state', {
      data: JSON.stringify(options),
      contentType: 'application/json',
      type: 'PUT'
    });
  }),

  // **************** STROBE LIGHT START ****************
  strobeOn: false,

  strobeOnInervalHandle: null,
  preStrobeOnLightsDataCache: null,
  nextLightIdx: 0,

  onStrobeOnChange: observer('strobeOn', function () {
    let lightsData = this.get('lightsData'),
      strobeOn = this.get('strobeOn');

    if (strobeOn) {
      this.set('preStrobeOnLightsDataCache', lightsData);
      let stobeInitRequestData = { transitiontime: 0 };

      for (let key in lightsData) {
        if (lightsData.hasOwnProperty(key)) {
          if (lightsData[key].state.on) {
            stobeInitRequestData.on = false;
          }

          $.ajax(this.get('apiURL') + '/lights/' + key + '/state', {
            data: JSON.stringify(stobeInitRequestData),
            contentType: 'application/json',
            type: 'PUT'
          });
        }
      }

      this.set('strobeOnInervalHandle', setInterval(this.strobeStep.bind(this), 500));
    } else { // revert the light system to pre-strobe
      let preStrobeOnLightsDataCache = this.get('preStrobeOnLightsDataCache'), updateLight = (lightIndex) => {
        $.ajax(this.get('apiURL') + '/lights/' + lightIndex + '/state', {
          data: JSON.stringify({
            on: preStrobeOnLightsDataCache[lightIndex].state.on,
            sat: preStrobeOnLightsDataCache[lightIndex].state.sat
          }),
          contentType: 'application/json',
          type: 'PUT'
        });
      };

      for (let key in lightsData) {
        if (lightsData.hasOwnProperty(key)) {
          later(this, updateLight, key, 2000);
        }
      }

      later(this, this.onColorLoopOnChange, 2000);
      clearInterval(this.get('strobeOnInervalHandle'));
    }

    this.set('pauseLightUpdates', strobeOn);
  }),

  strobeStep() {
    let nextLightIdx = this.get('nextLightIdx') % this.get('activeLights').length,
      nextStrobeLight = this.get('activeLights')[nextLightIdx],
      turnOnOptions = { on: true, transitiontime: 0, alert: 'select' };

    // random light if in cololoop mode
    if (this.get('colorLoopOn')) {
      turnOnOptions.hue = Math.floor(Math.random() * 65535);
    }

    $.ajax(this.get('apiURL') + '/lights/' + nextStrobeLight + '/state', {
      data: JSON.stringify(turnOnOptions),
      contentType: 'application/json',
      type: 'PUT'
    });
    $.ajax(this.get('apiURL') + '/lights/' + nextStrobeLight + '/state', {
      data: JSON.stringify({ 'on': false, 'transitiontime': 0 }),
      contentType: 'application/json',
      type: 'PUT'
    });

    this.set('nextLightIdx', ++nextLightIdx);
  },

  strobeOnTxt: computed('strobeOn', function () {
    return this.get('strobeOn') ? 'On' : 'Off';
  }),

  dimmerOnClass: computed('dimmerOn', function () {
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }),

  actions: {
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    }
  }
});
