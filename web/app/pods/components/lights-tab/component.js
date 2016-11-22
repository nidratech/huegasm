import Ember from 'ember';

const {
  Component,
  observer,
  computed,
  on,
  $
} = Ember;

export default Component.extend({
  classNames: ['col-sm-8', 'col-sm-offset-2', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'lights-tab',

  rgb: [255, 255, 255],

  lightsOn: false,

  // COLOR LOOP related stuff
  colorLoopOn: false,

  lightsOnTxt: computed('lightsOn', function(){
    return this.get('lightsOn') ? 'On' : 'Off';
  }),

  colorloopOnTxt: computed('colorLoopOn', function(){
    return this.get('colorLoopOn') ? 'On' : 'Off';
  }),

  // determines the average brightness of the hue system for the brightness slider
  lightsBrightness: computed('lightsData', function(){
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      lightsBrightness = 0;

    activeLights.forEach(function(light){
      lightsBrightness += lightsData[light].state.bri;
    });

    return lightsBrightness/activeLights.length;
  }),

  brightnessControlDisabled: computed.not('lightsOn'),

  onColorLoopOnChange: observer('colorLoopOn', function(){
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      colorLoopsOn = this.get('colorLoopOn'),
      effect = colorLoopsOn ? 'colorloop' : 'none';

    let colorLoopsOnSystem = activeLights.some(function(light) {
      return lightsData[light].state.effect === 'colorloop';
    });

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(colorLoopsOn !== colorLoopsOnSystem){
      activeLights.forEach((light)=>{
        if(this.get('lightsData')[light].state.effect !== effect) {
          $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
            data: JSON.stringify({'effect': effect }),
            contentType: 'application/json',
            type: 'PUT'
          });
        }
      });
    }
  }),

  rgbPreview: observer('rgb', function() {
    let rgb = this.get('rgb'),
      xy = this.rgbToXy(rgb[0], rgb[1], rgb[2]);

    this.set('colorLoopOn', false);

    this.get('activeLights').forEach((light) => {
      $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
        data: JSON.stringify({"xy": xy}),
        contentType: 'application/json',
        type: 'PUT'
      });
    });

    this.set('colorLoopOn', false);
    $('.color').css('background', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
  }),

  // determines whether the lights are on/off for the lights switch
  lightsOnChange: on('init', observer('lightsData.@each.state.on', 'activeLights.[]', function(){
    if(!this.get('strobeOn')){
      let lightsData = this.get('lightsData'), lightsOn = this.get('activeLights').some(function(light) {
        return lightsData[light].state.on === true;
      });

      this.set('lightsOn', lightsOn);
    }
  })),

  onLightsOnChange: observer('lightsOn', function(){
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      lightsOn = this.get('lightsOn');

    let lightsOnSystem = activeLights.some(function(light) {
      return lightsData[light].state.on === true;
    });

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(lightsOn !== lightsOnSystem){
      activeLights.forEach((light)=>{
        $.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify({"on": lightsOn}),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  }),

  onBrightnessChanged: observer('lightsBrightness', function(){
    let lightsData = this.get('lightsData'),
      lightsBrightnessSystem = false,
      lightsBrightness = this.get('lightsBrightness'),
      activeLights = this.get('activeLights');

    activeLights.forEach(function(light){
      lightsBrightnessSystem += lightsData[light].state.bri;
    });

    lightsBrightnessSystem /= activeLights.length;

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(lightsBrightness !== lightsBrightnessSystem){
      activeLights.forEach((light)=>{
        $.ajax(this.get('apiURL')  + '/lights/' + light + '/state', {
          data: JSON.stringify({"bri": lightsBrightness}),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  }),

  // sync the current light settings to the newly added light
  onaActiveLightsChange: observer('syncLight', function(){
    let options = {
      on: this.get('lightsOn'),
      bri: this.get('lightsBrightness'),
      effect: this.get('colorLoopOn') ? 'colorloop' : 'none'
    }, rgb = this.get('rgb'),
      syncLight = this.get('syncLight');

    if(rgb[0] !== 255 && rgb[1] !== 255 && rgb[2] !== 255) {
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
  strobeSat: 0,
  preStrobeOnLightsDataCache: null,
  lastStrobeLight: 0,

  onStrobeOnChange: observer('strobeOn', function () {
    let lightsData = this.get('lightsData'),
      strobeOn = this.get('strobeOn');

    if (strobeOn) {
      this.set('preStrobeOnLightsDataCache', lightsData);
      let stobeInitRequestData = {'sat': this.get('strobeSat'), 'transitiontime': 0};

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
      let preStrobeOnLightsDataCache = this.get('preStrobeOnLightsDataCache'), updateLight = (lightIndex)=> {
        $.ajax(this.get('apiURL') + '/lights/' + lightIndex + '/state', {
          data: JSON.stringify({
            'on': preStrobeOnLightsDataCache[lightIndex].state.on,
            'sat': preStrobeOnLightsDataCache[lightIndex].state.sat
          }),
          contentType: 'application/json',
          type: 'PUT'
        });
      };

      for (let key in lightsData) {
        if (lightsData.hasOwnProperty(key)) {
          setTimeout(updateLight, 2000, key);
        }
      }

      setTimeout(()=>{this.onColorLoopOnChange();}, 2000);
      clearInterval(this.get('strobeOnInervalHandle'));
    }

    this.set('pauseLightUpdates', strobeOn);
  }),

  strobeStep() {
    let lastStrobeLight = (this.get('lastStrobeLight') + 1) % (this.get('activeLights').length + 1),
      turnOnOptions = {'on': true, 'transitiontime': 0, 'alert': 'select'};

    // random light if in cololoop mode
    if(this.get('colorLoopOn')) {
      turnOnOptions.hue = Math.floor(Math.random() * 65535);
    }

    $.ajax(this.get('apiURL') + '/lights/' + lastStrobeLight + '/state', {
      data: JSON.stringify(turnOnOptions),
      contentType: 'application/json',
      type: 'PUT'
    });
    $.ajax(this.get('apiURL') + '/lights/' + lastStrobeLight + '/state', {
      data: JSON.stringify({'on': false, 'transitiontime': 0}),
      contentType: 'application/json',
      type: 'PUT'
    });

    this.set('lastStrobeLight', lastStrobeLight);
  },

  strobeOnTxt: computed('strobeOn', function () {
    return this.get('strobeOn') ? 'On' : 'Off';
  }),

  dimmerOnClass: computed('dimmerOn', function(){
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }),

  actions: {
    toggleDimmer(){
      this.sendAction('toggleDimmer');
    }
  },

  // **************** STROBE LIGHT FINISH ****************
  // http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
  rgbToXy(red, green, blue){
    let X, Y, Z, x, y;

    // normalize
    red = Number((red/255));
    green = Number((green/255));
    blue = Number((blue/255));

    // gamma correction
    red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
    green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
    blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

    // RGB to XYZ
    X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
    Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
    Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

    x = X / (X + Y + Z);
    y = Y / (X + Y + Z);

    return [x,y];
  },

  xyToRgb(x, y){
    let r, g, b, X, Y = 1.0, Z;

    X = (Y / y) * x;
    Z = (Y / y) * (1 - x - y);

    r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    g = X * -0.707196 + Y * 1.655397 + Z * 0.036152;
    b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    if (r > b && r > g && r > 1.0) {
      // red is too big
      g = g / r;
      b = b / r;
      r = 1.0;
    } else if (g > b && g > r && g > 1.0) {
      // green is too big
      r = r / g;
      b = b / g;
      g = 1.0;
    } else if (b > r && b > g && b > 1.0) {
      // blue is too big
      r = r / b;
      g = g / b;
      b = 1.0;
    }

    r = (r <= 0.0031308) ? 12.92 * r : 1.055 * Math.pow(r, (1.0 / 2.4)) - 0.055;
    g = (g <= 0.0031308) ? 12.92 * g : 1.055 * Math.pow(g, (1.0 / 2.4)) - 0.055;
    b = (b <= 0.0031308) ? 12.92 * b : 1.055 * Math.pow(b, (1.0 / 2.4)) - 0.055;

    if (r > b && r > g) {
      // red is biggest
      if (r > 1.0) {
        g = g / r;
        b = b / r;
        r = 1.0;
      }
    } else if (g > b && g > r) {
      // green is biggest
      if (g > 1.0) {
        r = r / g;
        b = b / g;
        g = 1.0;
      }
    } else if (b > r && b > g) {
      // blue is biggest
      if (b > 1.0) {
        r = r / b;
        g = g / b;
        b = 1.0;
      }
    }

    r = r * 255;
    g = g * 255;
    b = b * 255;

    return [r, g, b];
  }
});
