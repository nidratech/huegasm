import Em from 'ember';

export default Em.Component.extend({

  lightsDataIntervalHandle: null,

  lightsApiURL: null,

  lightsData: null,

  // determines whether the lights are on/off for the lights switch
  lightsOn: function(){
    var lightsData = this.get('lightsData');

    for (var key in lightsData) {
      if (lightsData.hasOwnProperty(key)) {
        if(lightsData[key].state.on){
          return true;
        }
      }
    }

    return false;
  }.property('lightsData'),

  // determines the average brightness of the hue system for the brightness slider
  lightsBrightness: function(){
    var lightsData = this.get('lightsData'), lightsBrightness = 0;

    for (var key in lightsData) {
      if (lightsData.hasOwnProperty(key)) {
        lightsBrightness += lightsData[key].state.bri;
      }
    }

    return lightsBrightness/this.get('lightsList').length;
  }.property('lightsData', 'lightsList'),

  // list of all the lights in the hue system
  lightsList: function(){
    var lightsData = this.get('lightsData'), lightsList = [];
    for (var key in lightsData) {
      if (lightsData.hasOwnProperty(key)) {
        switch(lightsData[key].modelid){
          case 'LCT001':
            lightsList.push('a19');
            break;
          case 'LCT002':
            lightsList.push('br30');
            break;
          case 'LCT003':
            lightsList.push('gu10');
            break;
          case 'LST001':
            lightsList.push('lightstrip');
            break;
          case 'LLC010':
            lightsList.push('lc_iris');
            break;
          case 'LLC011':
            lightsList.push('lc_bloom');
            break;
          case 'LLC012':
            lightsList.push('lc_bloom');
            break;
          case 'LLC006':
            lightsList.push('lc_iris');
            break;
          case 'LLC007':
            lightsList.push('lc_aura');
            break;
          case 'LLC013':
            lightsList.push('storylight');
            break;
          case 'LWB004':
            lightsList.push('a19');
            break;
          case 'LLC020':
            lightsList.push('huego');
            break;
          default:
            lightsList.push('a19');
        }
      }
    }

    return lightsList;
  }.property('lightsData'),

  brightnessControlDisabled: Em.computed.not('lightsOn'),

  onLightsOnChange: function(){
    var lightsData = this.get('lightsData'), lightsOnSystem = false, lightsOn = this.get('lightsOn');

    for (let key in lightsData) {
      if (lightsData.hasOwnProperty(key)) {
        if(lightsData[key].state.on){
          lightsOnSystem = true;
          break;
        }
      }
    }

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(lightsOn !== lightsOnSystem){
      for (let key in lightsData) {
        Em.$.ajax(this.get('lightsApiURL') + '/' + key + '/state', {
          data: JSON.stringify({"on": lightsOn}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }
    }
  }.observes('lightsOn'),

  onBrightnessChange: function(){
    var lightsData = this.get('lightsData'), lightsBrightnessSystem = false, lightsBrightness = this.get('lightsBrightness');

    for (let key in lightsData) {
      if (lightsData.hasOwnProperty(key)) {
        lightsBrightnessSystem += lightsData[key].state.bri;
      }
    }
    lightsBrightnessSystem /= this.get('lightsList').length;

    // if the internal lights state is different than the one from lightsData ( user manually toggled the switch ), send the request to change the bulbs state
    if(lightsBrightness !== lightsBrightnessSystem){
      for (let key in lightsData) {
        Em.$.ajax(this.get('lightsApiURL') + '/' + key + '/state', {
          data: JSON.stringify({"bri": lightsBrightness}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }
    }
  }.observes('lightsBrightness'),

  lightsOnTxt: function(){
    return this.get('lightsOn') ? 'On' : 'Off';
  }.property('lightsOn')
});
