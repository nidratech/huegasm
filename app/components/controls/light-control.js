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
      if(self.get('colorPickerDisplayed') && !event.target.classList.contains('color') && !Em.$(event.target).closest('.colorpicker').length) {
        self.toggleProperty('colorPickerDisplayed');
      }
    });
  },

  rgb: [255, 255, 255],
  rgbPreview: function() {
    var rgb = this.get('rgb');
    Em.$('.color').css('background', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
  }.observes('rgb'),

  // determines whether the lights are on/off for the lights switch
  lightsOn: function(){
    var lightsData = this.get('lightsData');

    if(this.get('strobeOn')){
      return false;
    }

    return this.get('activeLights').some(function(light) {
      return lightsData[light].state.on === true;
    });
  }.property('lightsData', 'activeLights', 'strobeOn'),

  // color of the lights in the group
  color: function(){
    var lightsData = this.get('lightsData'),
      color = [0,0,0];

    if(this.get('strobeOn') || this.get('activeLights').length === 0){
      return color;
    }

    return [lightsData[0].state.hue, lightsData[0].state.sat, lightsData[0].state.bri];
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
  }.property('strobeOn')

  // **************** STROBE LIGHT FINISH ****************
});
