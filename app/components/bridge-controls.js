import Em from 'ember';

export default Em.Component.extend({
  bridgeIp: null,

  bridgeUsername: null,

  lightsData: null,

  lightsDataIntervalHandle: null,

  lightsApiURL: function(){
      return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername') + '/lights';
  }.property('bridgeIp', 'bridgeUsername'),

  didInsertElement: function() {
    this.set('lightsDataIntervalHandle', setInterval(this.updateLightData.bind(this), 1000));
  },

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

  onLightsOnChange: function(){
    var lightsData = this.get('lightsData'), lightsOnState = false, lightsOn = this.get('lightsOn');

    for (let key in lightsData) {
      if (lightsData.hasOwnProperty(key)) {
        if(lightsData[key].state.on){
          lightsOnState = true;
          break;
        }
      }
    }

    if(lightsOn !== lightsOnState){
      for (let key in lightsData) {
        Em.$.ajax(this.get('lightsApiURL') + '/' + key + '/state', {
          data: JSON.stringify({"on": lightsOn}),
          contentType: 'application/json',
          type: 'PUT'
        })
      }
    }
  }.observes('lightsOn'),

  lightsOnTxt: function(){
    return this.get('lightsOn') ? 'On' : 'Off';
  }.property('lightsOn'),

  updateLightData: function(){
    var self = this;
    Em.$.get(this.get('lightsApiURL'), function (result, status) {
      if (status === 'success') {
        self.set('lightsData', result);
      }
    });
  }
});
