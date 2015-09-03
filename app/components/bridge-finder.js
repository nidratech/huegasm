import Em from 'ember';

export default Em.Component.extend({
  classNames: ['container'],
  bridgeIp: null,

  bridgeUsername: null,

  bridgeFindStatus: null,
  bridgeFindSuccess: Em.computed.equal('bridgeFindStatus', 'success'),
  bridgeFindMultiple: Em.computed.equal('bridgeFindStatus', 'multiple'),
  bridgeFindFail: Em.computed.equal('bridgeFindStatus', 'fail'),

  // 30 seconds
  bridgeUsernamePingMaxTime: 30000,
  bridgeUsernamePingIntervalTime: 1000,
  bridgeUserNamePingIntervalProgress: 0,

  bridgePingIntervalHandle: null,
  bridgeAuthenticateReachedStatus: null,

  actions: {
    retry: function(){
      this.onBridgeIpChange();
    }
  },

  // find the bridge ip here
  init: function () {
    this._super();

    if(this.get('bridgeIp') === null){
      var self = this;

      Em.$.get('https://www.meethue.com/api/nupnp', function (result, status) {
        var bridgeFindStatus = 'fail';

        if (status === 'success' && result.length === 1) {
          self.set('bridgeIp', result[0].internalipaddress);
          localStorage.setItem('huegasm.bridgeIp', result[0].internalipaddress);
          bridgeFindStatus = 'success';
        } else if(result.length > 1) {
          bridgeFindStatus = 'multiple';
        } else {
          bridgeFindStatus = 'fail';
        }

        self.set('bridgeFindStatus', bridgeFindStatus);
      });
    }
  },

  // try to authenticate against the bridge here
  onBridgeIpChange: function () {
    this.setProperties({
      bridgePingIntervalHandle: setInterval(this.pingBridgeUser.bind(this), this.get('bridgeUsernamePingIntervalTime')),
      bridgeUserNamePingIntervalProgress: 0
    });
  }.observes('bridgeIp'),

  pingBridgeUser: function () {
    var bridgeIp = this.get('bridgeIp'), self = this, bridgeUserNamePingIntervalProgress = this.get('bridgeUserNamePingIntervalProgress'), bridgeUsernamePingMaxTime = this.get('bridgeUsernamePingMaxTime');

    if (bridgeIp !== null && bridgeUserNamePingIntervalProgress < 100) {
      Em.$.ajax('http://' + bridgeIp + '/api', {
        data: JSON.stringify({"devicetype": "huegasm"}),
        contentType: 'application/json',
        type: 'POST'
      }).done(function (result, status) {
        if (status === 'success') {
          if (!result[0].error) {
            self.set('bridgeUsername', result[0].success.username);
            localStorage.setItem('huegasm.bridgeUsername', result[0].success.username);
            clearInterval(self.get('bridgePingIntervalHandle'));
            self.set('bridgePingIntervalHandle', null);
          }
          self.set('bridgeAuthenticateError', result[0].internalipaddress);
        }

        self.set('bridgeAuthenticateReachedStatus', status);
      });

      this.incrementProperty('bridgeUserNamePingIntervalProgress', this.get('bridgeUsernamePingIntervalTime')/bridgeUsernamePingMaxTime*100);
    } else {
      clearInterval(this.get('bridgePingIntervalHandle'));
      this.set('bridgePingIntervalHandle', null);
    }
  },

  isAuthenticating: function(){
    return this.get('bridgePingIntervalHandle') !== null;
  }.property('bridgePingIntervalHandle')
});
