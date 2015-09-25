import Em from 'ember';

export default Em.Component.extend({
  classNames: ['innerControlFrame', 'col-sm-8', 'col-sm-offset-2', 'col-xs-12'],
  classNameBindings: ['active::hidden'],
  elementId: 'lightControl',

  activeLights: [],
  lightsData: null,

  lightsDataIntervalHandle: null,

  colorPickerDisplayed: false,

  actions: {
    clickLight: function(light){
      var activeLights = this.get('activeLights'),
        lightId = activeLights.indexOf(light);

      if(lightId !== -1){
        delete activeLights[lightId];
      } else {
        activeLights.pushObject(light);
      }
    },
    toggleColorpicker: function() {
      this.toggleProperty('colorPickerDisplayed');
    }
  },

  didInsertElement: function() {
    var self = this;

    Em.$(document).click(function() {
      if(self.get('colorPickerDisplayed') && !event.target.classList.contains('color') && !Em.$(event.target).closest('.colorpicker, .colorRow').length) {
        self.toggleProperty('colorPickerDisplayed');
      }
    });
  },

  rgb: [255, 255, 255],
  rgbPreview: function() {
    var rgb = this.get('rgb'),
      self = this,
      xy = this.rgbToXy(rgb[0], rgb[1], rgb[2]);

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

  // determines whether the lights are on/off for the lights switch
  lightsOn: function(){
    var lightsData = this.get('lightsData');

    if(this.get('strobeOn')){
      return false;
    }
    this.get('color');
    return this.get('activeLights').some(function(light) {
      return lightsData[light].state.on === true;
    });
  }.property('lightsData', 'activeLights', 'strobeOn'),

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

  strobeStep: function () {
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

  // **************** STROBE LIGHT FINISH ****************
  // http://www.developers.meethue.com/documentation/color-conversions-rgb-xy
  rgbToXy: function(red, green, blue){
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

  xyToRgb: function(x, y){
    var r, g, b, X, Y, Z, activeLights = this.get('activeLights'), lightsData = this.get('lightsData');

    Y = lightsData[activeLights[1]].state.bri;
    X = ((Y / y) * x)/100;
    Z = ((Y / y) * (1 - x - y))/100;
    Y = Y/100;

    r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
    g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
    b = X * 0.0557 + Y * -0.2040 + Z * 1.0570;

    r = (r <= 0.0031308) ? 12.92 * r : 1.055 * Math.pow(r, (1.0 / 2.4)) - 0.055;
    g = (g <= 0.0031308) ? 12.92 * g : 1.055 * Math.pow(g, (1.0 / 2.4)) - 0.055;
    b = (b <= 0.0031308) ? 12.92 * b : 1.055 * Math.pow(b, (1.0 / 2.4)) - 0.055;

    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);

    return [r, g, b];
  }
});
