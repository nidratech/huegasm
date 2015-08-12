import Em from 'ember';

export default Em.Component.extend({
  bridgeIp: null,

  bridgeUsername: null,

  groupsData: null,
  lightsData: null,
  activeLights: null,

  numLights: function(){
    var lightsData = this.get('lightsData'), numLights = 0;

    for (let key in this.get('lightsData')) {
      if(lightsData.hasOwnProperty(key)){
        numLights++;
      }
    }

    return numLights;
  }.property('lightsData'),

  apiURL: function(){
      return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername');
  }.property('bridgeIp', 'bridgeUsername'),

  init: function() {
    this._super();
    var self = this;

    Em.$.get(this.get('apiURL') + '/groups', function (result, status) {
      if (status === 'success' ) {
        self.set('groupsData', result);
      }
    });

    this.set('lightsDataIntervalHandle', setInterval(this.updateLightData.bind(this), 1000));
  },

  updateLightData: function(){
    var self = this;

    Em.$.get(this.get('apiURL') + '/lights', function (result, status) {
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
