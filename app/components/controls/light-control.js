import Em from 'ember';

export default Em.Component.extend({

  classNames: ['innerControlFrame'],

  lightsDataIntervalHandle: null,

  modalData: null,
  isShowingLightsModal: false,
  isShowingAddGroupsModal: false,
  actions: {
    selectLight: function(id, data){
      if(this.get('isShowingLightsModal')){
        this.set('modalData', {data:data, id:id});
      }

      this.toggleProperty('isShowingLightsModal');
    }
  },

  // determines whether the lights are on/off for the lights switch
  lightsOn: function(){
    var lightsData = this.get('lightsData');

    return this.get('activeLights').some(function(light) {
      return lightsData[light].state.on === true;
    });
  }.property('lightsData', 'activeLights'),

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
  }.property('lightsOn')
});
