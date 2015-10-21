import Em from 'ember';

export default Em.Component.extend({
  classNames: ['col-sm-8', 'col-sm-offset-2', 'col-xs-12'],
  classNameBindings: ['active::hidden'],

  activeLights: [],
  lightsData: null,

  lightsDataIntervalHandle: null,

  colorPickerDisplayed: false,

  actions: {
    clickLight(light){
      var activeLights = this.get('activeLights'),
        lightId = activeLights.indexOf(light);

      if(lightId !== -1){
        activeLights.removeObject(light);
      } else {
        activeLights.pushObject(light);

        // sync the current light settings to the newly added light
        var options = {on: this.get('lightsOn'), bri: this.get('lightsBrightness'), effect: this.get('colorLoopOn') ? 'colorloop' : 'none'},
          rgb = this.get('rgb');

        if(rgb[0] !== 255 && rgb[1] !== 255 && rgb[2] !== 255) {
          options['xy'] = this.rgbToXy(rgb[0], rgb[1], rgb[2]);
        }

        Em.$.ajax(this.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify(options),
          contentType: 'application/json',
          type: 'PUT'
        });
      }
    },
    toggleColorpicker() {
      this.toggleProperty('colorPickerDisplayed');
    }
  },

  didInsertElement() {
    var self = this;
    // TODO figure out how to convert this
    //this.xyToRgb(0.5,0.5);
    Em.$(document).click(function() {
      if(self.get('colorPickerDisplayed') && !event.target.classList.contains('color') && !Em.$(event.target).closest('.colorpicker, #colorRow').length) {
        self.toggleProperty('colorPickerDisplayed');
      }
    });

    Em.$(document).on('click', '#colorRow', () => {
      this.send('toggleColorpicker');
    });
  },

  rgb: [255, 255, 255],
  rgbPreview: function() {
    var rgb = this.get('rgb'),
      self = this,
      xy = this.rgbToXy(rgb[0], rgb[1], rgb[2]);

    this.set('colorLoopOn', false);

    this.get('activeLights').forEach(function (light) {
      Em.$.ajax(self.get('apiURL') + '/lights/' + light + '/state', {
        data: JSON.stringify({"xy": xy}),
        contentType: 'application/json',
        type: 'PUT'
      });
    });

    Em.$('.color').css('background', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
  }.observes('rgb'),

  colorRowAction: function() {
    if (this.get('trial')) {
      return null;
    }

    return "toggleColorpicker";
  }.property('trial'),

  // COLOR LOOP related stuff
  colorLoopOn: false,
  colorLoopDependenciesChanged: function(){
    var lightsData = this.get('lightsData'), newValue;

    if(this.get('strobeOn')){
      newValue = false;
    } else {
      newValue = this.get('activeLights').some(function(light) {
        return lightsData[light].state.effect === 'colorloop';
      });
    }

    this.set('colorLoopOn', newValue);
  }.observes('lightsData.@each.state.effect', 'activeLights.[]', 'strobeOn'),
  onColorLoopOnChange: function(){
    var lightsData = this.get('lightsData'), activeLights = this.get('activeLights'), colorLoopsOn = this.get('colorLoopOn'), self = this;

    var colorLoopsOnSystem = activeLights.some(function(light) {
      return lightsData[light].state.effect === 'colorloop';
    });

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(colorLoopsOn !== colorLoopsOnSystem){
      activeLights.forEach(function (light) {
        Em.$.ajax(self.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify({"effect": colorLoopsOn ? 'colorloop' : 'none'}),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  }.observes('colorLoopOn'),

  // determines whether the lights are on/off for the lights switch
  lightsOn: function(){
    var lightsData = this.get('lightsData');

    if(this.get('strobeOn')){
      return false;
    }

    return this.get('activeLights').some(function(light) {
      return lightsData[light].state.on === true;
    });
  }.property('lightsData.@each.state.on', 'activeLights.[]', 'strobeOn'),

  // determines the average brightness of the hue system for the brightness slider
  lightsBrightness: function(){
    var lightsData = this.get('lightsData'), activeLights = this.get('activeLights'), lightsBrightness = 0;

    activeLights.forEach(function(light){
      lightsBrightness += lightsData[light].state.bri;
    });

    return lightsBrightness/activeLights.length;
  }.property('lightsData'),

  brightnessControlDisabled: Em.computed.not('lightsOn'),

  onLightsOnChange: function(){
    var lightsData = this.get('lightsData'), activeLights = this.get('activeLights'), lightsOn = this.get('lightsOn'), self = this;

    var lightsOnSystem = activeLights.some(function(light) {
      return lightsData[light].state.on === true;
    });

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(lightsOn !== lightsOnSystem){
      activeLights.forEach(function (light) {
        Em.$.ajax(self.get('apiURL') + '/lights/' + light + '/state', {
          data: JSON.stringify({"on": lightsOn}),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  }.observes('lightsOn'),



  onBrightnessChanged: function(){
    var lightsData = this.get('lightsData'), lightsBrightnessSystem = false, lightsBrightness = this.get('lightsBrightness'), activeLights = this.get('activeLights'), self = this;

    activeLights.forEach(function(light){
      lightsBrightnessSystem += lightsData[light].state.bri;
    });

    lightsBrightnessSystem /= activeLights.length;

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(lightsBrightness !== lightsBrightnessSystem){
      activeLights.forEach(function(light){
        Em.$.ajax(self.get('apiURL')  + '/lights/' + light + '/state', {
          data: JSON.stringify({"bri": lightsBrightness}),
          contentType: 'application/json',
          type: 'PUT'
        });
      });
    }
  }.observes('lightsBrightness'),

  lightsOnTxt: function(){
    return this.get('lightsOn') ? 'On' : 'Off';
  }.property('lightsOn'),

  colorloopOnTxt: function(){
    return this.get('colorLoopOn') ? 'On' : 'Off';
  }.property('colorLoopOn'),

  // **************** STROBE LIGHT START ****************

  strobeOn: false,

  strobeOnInervalHandle: null,
  strobeSat: 0,
  preStrobeOnLightsDataCache: null,
  lastStrobeLight: 0,

  onStrobeOnChange: function () {
    var lightsData = this.get('lightsData'), self = this;

    if (this.get('strobeOn')) {
      this.set('preStrobeOnLightsDataCache', lightsData);
      var stobeInitRequestData = {'sat': this.get('strobeSat'), 'transitiontime': 0};

      for (let key in lightsData) {
        if (lightsData.hasOwnProperty(key)) {
          if (lightsData[key].state.on) {
            stobeInitRequestData.on = false;
          }

          Em.$.ajax(this.get('apiURL') + '/lights/' + key + '/state', {
            data: JSON.stringify(stobeInitRequestData),
            contentType: 'application/json',
            type: 'PUT'
          });
        }
      }

      this.set('strobeOnInervalHandle', setInterval(this.strobeStep.bind(this), 200));
    } else { // revert the light system to pre-strobe
      var preStrobeOnLightsDataCache = this.get('preStrobeOnLightsDataCache'), updateLight = function (lightIndx) {
        Em.$.ajax(self.get('apiURL') + '/lights/' + lightIndx + '/state', {
          data: JSON.stringify({
            'on': preStrobeOnLightsDataCache[lightIndx].state.on,
            'sat': preStrobeOnLightsDataCache[lightIndx].state.sat
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

      clearInterval(this.get('strobeOnInervalHandle'));
    }
  }.observes('strobeOn'),

  strobeStep() {
    var lastStrobeLight = (this.get('lastStrobeLight') + 1) % (this.get('activeLights').length + 1), self = this;

    Em.$.ajax(this.get('apiURL') + '/lights/' + lastStrobeLight + '/state', {
      data: JSON.stringify({'on': true, 'transitiontime': 0, 'alert': 'select'}),
      contentType: 'application/json',
      type: 'PUT'
    });
    Em.$.ajax(self.get('apiURL') + '/lights/' + lastStrobeLight + '/state', {
      data: JSON.stringify({'on': false, 'transitiontime': 0}),
      contentType: 'application/json',
      type: 'PUT'
    });

    this.set('lastStrobeLight', lastStrobeLight);
  },

  strobeOnTxt: function () {
    return this.get('strobeOn') ? 'On' : 'Off';
  }.property('strobeOn'),

  dimmerOnClass: function(){
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }.property('dimmerOn'),

  // **************** STROBE LIGHT FINISH ****************
  // http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
  rgbToXy(red, green, blue){
    var X, Y, Z, x, y;

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
    var r, g, b, X, Y = 1.0, Z;

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
