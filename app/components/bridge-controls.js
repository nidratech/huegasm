import Em from 'ember';

export default Em.Component.extend({
  bridgeIp: null,

  bridgeUsername: null,

  lightsData: null,

  numLights: function(){
    var lightsData = this.get('lightsData'), numLights = 0;

    for (let key in this.get('lightsData')) {
      if(lightsData.hasOwnProperty(key)){
        numLights++;
      }
    }

    return numLights;
  }.property('lightsData'),

  lightsApiURL: function(){
      return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername') + '/lights';
  }.property('bridgeIp', 'bridgeUsername'),

  didInsertElement: function() {
    this.set('lightsDataIntervalHandle', setInterval(this.updateLightData.bind(this), 1000));
  },

  updateLightData: function(){
    var self = this;

    Em.$.get(this.get('lightsApiURL'), function (result, status) {
      if (status === 'success' && JSON.stringify(self.get('lightsData')) !== JSON.stringify(result) ) {
        self.set('lightsData', result);
      } else if(status !== 'success' ) {
        // something went terribly wrong ( user got unauthenticated? ) and we'll need to start all over
        clearInterval(self.get('lightsDataIntervalHandle'));
        this.setProperties({
          bridgeIp: null,
          bridgeUsername: null
        });

        console.error(status + ': ' + result);
      }
    });
  }
});
