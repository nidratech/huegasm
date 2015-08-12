import Em from 'ember';

export default Em.Component.extend({

  lightsDataIntervalHandle: null,

  apiURL: null,

  lightsData: null,
  activeLights: null,

  groupSelection: null,
  groupsData: null,
  groupsArrData: function(){
    var groupsData = this.get('groupsData'), groupsArrData = [];

    for (var key in groupsData) {
      if (groupsData.hasOwnProperty(key)) {
        groupsArrData.push({name: groupsData[key].name, id: key});
      }
    }

    return groupsArrData;
  }.property('groupsData'),

  onGroupSelectionChange: function(){
    debugger;
  }.observes('groupSelection'),

  modalData: null,
  isShowingLightsModal: false,
  actions: {
    clickLight: function(id, data){
      this.set('modalData', {data:data, id:id});
      this.toggleProperty('isShowingLightsModal');
    }
  },

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
            lightsList.push({type: 'a19', name: lightsData[key].name, id: key, data: lightsData[key] });
            break;
          case 'LCT002':
            lightsList.push({type: 'br30', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LCT003':
            lightsList.push({type: 'gu10', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LST001':
            lightsList.push({type: 'lightstrip', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LLC010':
            lightsList.push({type: 'lc_iris', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LLC011':
            lightsList.push({type: 'lc_bloom', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LLC012':
            lightsList.push({type: 'lc_bloom', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LLC006':
            lightsList.push({type: 'lc_iris', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LLC007':
            lightsList.push({type: 'lc_aura', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LLC013':
            lightsList.push({type: 'storylight', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LWB004':
            lightsList.push({type: 'a19', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          case 'LLC020':
            lightsList.push({type: 'huego', name: lightsData[key].name, id: key, data: lightsData[key]});
            break;
          default:
            lightsList.push({type: 'a19', name: lightsData[key].name, id: key, data: lightsData[key]});
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
        Em.$.ajax(this.get('apiURL')  + '/lights/' + key + '/state', {
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
        Em.$.ajax(this.get('apiURL')  + '/lights/' + key + '/state', {
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
