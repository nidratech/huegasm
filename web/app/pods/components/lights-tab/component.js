/*global rgbToCie cieToRgb*/
import Ember from 'ember';

const { Component, observer, computed, on, run: { later, throttle }, $, isEmpty } = Ember;

export default Component.extend({
  classNames: ['col-sm-10', 'col-sm-offset-1', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'lights-tab',

  rgb: [255, 255, 255],

  lightsOn: false,

  // COLOR LOOP related stuff
  colorLoopOn: false,

  lightsOnTxt: computed('lightsOn', function() {
    return this.get('lightsOn') ? 'On' : 'Off';
  }),

  colorloopOnTxt: computed('colorLoopOn', function() {
    return this.get('colorLoopOn') ? 'On' : 'Off';
  }),

  // determines the average brightness of the hue system for the brightness slider
  lightsBrightness: computed('lightsData', 'activeLights.[]', function() {
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      lightsBrightness = 0;

    activeLights.forEach(function(light) {
      lightsBrightness += lightsData[light].state.bri;
    });

    return lightsBrightness / activeLights.length;
  }),

  brightnessControlDisabled: computed.not('lightsOn'),

  onColorLoopOnChange: observer('colorLoopOn', function() {
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      colorLoopsOn = this.get('colorLoopOn'),
      effect = colorLoopsOn ? 'colorloop' : 'none';

    let colorLoopsOnSystem = activeLights.some(function(light) {
      return lightsData[light].state.effect === 'colorloop';
    });

    // if the internal lights state is different than the one from lightsData (user manually toggled the switch), send the request to change the bulbs state
    if (colorLoopsOn !== colorLoopsOnSystem) {
      activeLights.forEach(light => {
        if (this.get('lightsData')[light].state.effect !== effect) {
          $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
            data: JSON.stringify({ effect: effect }),
            contentType: 'application/json',
            type: 'PUT'
          });
        }
      });
    }
  }),

  changeLightsColor() {
    let { activeLights, apiURL, xy } = this.getProperties('activeLights', 'apiURL', 'xy');

    activeLights.forEach(light => {
      $.ajax(`${apiURL}/lights/${light}/state`, {
        data: JSON.stringify({ xy }),
        contentType: 'application/json',
        type: 'PUT'
      });
    });
  },

  rgbPreview: observer('rgb', function() {
    let { rgb, activeLights } = this.getProperties('rgb', 'activeLights');

    this.set('colorLoopOn', false);

    throttle(this, this.changeLightsColor, activeLights.length * 69, false);

    this.setProperties({ colorLoopOn: false, xy: rgbToCie(rgb[0], rgb[1], rgb[2]) });
    $('.color').css('background', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
  }),

  onActiveLightsChange: observer('activeLights.[]', function() {
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      xy = null;

    if (!isEmpty(lightsData)) {
      activeLights.forEach(i => {
        let light = lightsData[i];

        if (light && light.state && light.state.xy) {
          if (xy === null) {
            xy = [0, 0];
          }
          xy[0] += light.state.xy[0];
          xy[1] += light.state.xy[1];
        }
      });

      if (xy) {
        let rgb = cieToRgb(xy[0] / activeLights.length, xy[1] / activeLights.length);

        $('.color').css('background', 'rgb(' + Math.abs(rgb[0]) + ',' + Math.abs(rgb[1]) + ',' + Math.abs(rgb[2]) + ')');
      }
    }
  }),

  // sync the system lights on/off state with the Huegasm UI
  systemLightsOnChange: on(
    'init',
    observer('lightsData.@each.state.on', 'activeLights.[]', function() {
      if (!this.get('strobeOn')) {
        let { lightsData, activeLights } = this.getProperties('lightsData', 'activeLights');

        this.set('lightsOn', activeLights.some(light => lightsData[light].state.on === true));
      }
    })
  ),

  // sync the system lights on/off state from the Huegasm UI
  onLightsOnChange: observer('lightsOn', function() {
    let activeLightsLength = this.get('activeLights').length;

    this.set('lightsOnDisabled', true);

    throttle(this, this.changeLightsOnOff, activeLightsLength * 69, false);
  }),

  changeLightsOnOff() {
    let { lightsData, activeLights, lightsOn, apiURL } = this.getProperties('lightsData', 'activeLights', 'lightsOn', 'apiURL'),
      lightsOnSystem = activeLights.some(light => lightsData[light].state.on === true);

    later(
      this,
      () => {
        this.set('lightsOnDisabled', false);
      },
      800
    );

    // if the internal lights state is different than the one from lightsData (user manually toggled the switch), send the request to change the bulbs state
    if (lightsOn !== lightsOnSystem) {
      activeLights.forEach(lightId => {
        $.ajax(`${apiURL}/lights/${lightId}/state`, {
          data: JSON.stringify({ on: lightsOn }),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  },

  changeLightsBrightness() {
    let { lightsData, lightsBrightness, activeLights } = this.getProperties('lightsData', 'lightsBrightness', 'activeLights'),
      lightsBrightnessSystem = false;

    activeLights.forEach(light => {
      lightsBrightnessSystem += lightsData[light].state.bri;
    });

    lightsBrightnessSystem /= activeLights.length;

    // if the internal lights state is different than the one from lightsData (user manually toggled the switch), send the request to change the bulbs state
    if (lightsBrightness !== lightsBrightnessSystem) {
      activeLights.forEach(light => {
        $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify({ bri: lightsBrightness }),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  },

  onBrightnessChanged: observer('lightsBrightness', function() {
    let activeLightsLength = this.get('activeLights').length;

    throttle(this, this.changeLightsBrightness, activeLightsLength * 69, false);
  }),

  // sync the current light settings to the newly added light
  onSyncLightsChanged: observer('syncLight', function() {
    let options = {
        on: this.get('lightsOn'),
        bri: this.get('lightsBrightness'),
        effect: this.get('colorLoopOn') ? 'colorloop' : 'none'
      },
      rgb = this.get('rgb'),
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

  didInsertElement() {
    this.onActiveLightsChange();
  },

  // **************** STROBE LIGHT START ****************
  strobeOn: false,

  strobeOnInervalHandle: null,
  preStrobeOnLightsDataCache: null,
  nextLightIdx: 0,

  onStrobeOnChange: observer('strobeOn', function() {
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
    } else {
      // revert the light system to pre-strobe
      let preStrobeOnLightsDataCache = this.get('preStrobeOnLightsDataCache'),
        updateLight = lightIndex => {
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
      data: JSON.stringify({ on: false, transitiontime: 0 }),
      contentType: 'application/json',
      type: 'PUT'
    });

    this.set('nextLightIdx', ++nextLightIdx);
  },

  strobeOnTxt: computed('strobeOn', function() {
    return this.get('strobeOn') ? 'On' : 'Off';
  }),

  dimmerOnClass: computed('dimmerOn', function() {
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }),

  actions: {
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    },

    randomizeHues() {
      $('.dice')
        .velocity({ scale: 1.1 }, 100)
        .velocity({ scale: 1 }, 100);

      this.get('activeLights').forEach(light => {
        let options = { hue: Math.floor(Math.random() * 65535), sat: 254 };

        if (this.get('lightsData')[light].state.on === false) {
          options.on = true;
        }

        $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify(options),
          contentType: 'application/json',
          type: 'PUT'
        });
      });

      later(() => {
        this.onActiveLightsChange();
      }, 1000);
    }
  }
});
