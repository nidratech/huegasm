import Ember from 'ember';

const {
  Component,
  observer,
  computed,
  on,
  isNone,
  run: { later },
  $
} = Ember;

export default Component.extend({
  elementId: 'bridge-finder',
  classNames: ['container'],
  bridgeIp: null,
  trial: false,
  bridgeUsername: null,
  bridgeFindStatus: null,
  bridgeFindSuccess: computed.equal('bridgeFindStatus', 'success'),
  bridgeFindMultiple: computed.equal('bridgeFindStatus', 'multiple'),
  bridgeFindFail: computed.equal('bridgeFindStatus', 'fail'),
  bridgeUsernamePingMaxTime: 30000, // 30 seconds
  bridgeUsernamePingIntervalTime: 1500,
  bridgeUserNamePingIntervalProgress: 0,
  bridgePingIntervalHandle: null,
  bridgeAuthenticateReachedStatus: null,
  manualBridgeIp: null,
  manualBridgeIpNotFound: false,
  multipleBridgeIps: [],
  isAuthenticating: computed.notEmpty('bridgePingIntervalHandle'),

  // try to authenticate against the bridge here
  onBridgeIpChange: on('init', observer('bridgeIp', function () {
    if (!this.get('trial') && !this.get('isAuthenticating')) {
      this.setProperties({
        bridgePingIntervalHandle: setInterval(this.pingBridgeUser.bind(this), this.get('bridgeUsernamePingIntervalTime')),
        bridgeUserNamePingIntervalProgress: 0
      });
    }
  })),

  didInsertElement() {
    $(document).keypress((event) => {
      if (!isNone(this.get('manualBridgeIp')) && event.which === 13) {
        this.send('findBridgeByIp');
      }
    });
  },

  // find the bridge ip here
  init() {
    this._super(...arguments);

    if (this.get('bridgeIp') === null) {
      $.ajax('https://www.meethue.com/api/nupnp', {
        timeout: 30000
      })
        .done((result, status) => {
          let bridgeFindStatus = 'fail';

          if (!this.isDestroyed) {
            if (status === 'success' && result.length === 1) {
              this.set('bridgeIp', result[0].internalipaddress);
              chrome.storage.local.set({ 'bridgeIp': result[0].internalipaddress });
              bridgeFindStatus = 'success';
            } else if (result.length > 1) {
              let multipleBridgeIps = this.get('multipleBridgeIps');

              result.forEach(function (item) {
                multipleBridgeIps.pushObject(item.internalipaddress);
              });

              bridgeFindStatus = 'multiple';
            } else {
              bridgeFindStatus = 'fail';
            }

            this.set('bridgeFindStatus', bridgeFindStatus);
          }
        })
        .fail(() => {
          this.set('bridgeFindStatus', 'fail');
        });
    }
  },

  pingBridgeUser() {
    let bridgeIp = this.get('bridgeIp'),
      bridgeUserNamePingIntervalProgress = this.get('bridgeUserNamePingIntervalProgress'),
      bridgeUsernamePingMaxTime = this.get('bridgeUsernamePingMaxTime');

    if (bridgeIp !== null && bridgeUserNamePingIntervalProgress < 100) {
      $.ajax('http://' + bridgeIp + '/api', {
        data: JSON.stringify({ "devicetype": "huegasm" }),
        contentType: 'application/json',
        type: 'POST'
      }).done((result, status) => {
        if (!this.isDestroyed) {
          this.set('bridgeAuthenticateReachedStatus', status);

          if (status === 'success' && !result[0].error) {
            this.clearBridgePingIntervalHandle();
            chrome.storage.local.set({ 'bridgeUsername': result[0].success.username });
            this.set('bridgeUsername', result[0].success.username);
          }
        }
      });

      this.incrementProperty('bridgeUserNamePingIntervalProgress', this.get('bridgeUsernamePingIntervalTime') / bridgeUsernamePingMaxTime * 100);
    } else {
      this.clearBridgePingIntervalHandle();
    }
  },

  clearBridgePingIntervalHandle() {
    clearInterval(this.get('bridgePingIntervalHandle'));
    if (!this.isDestroyed) {
      this.set('bridgePingIntervalHandle', null);
    }
  },

  actions: {
    retry() {
      this.onBridgeIpChange();
    },
    chooseBridge(bridgeIp) {
      this.set('bridgeIp', bridgeIp);
      chrome.storage.local.set({ 'bridgeIp': bridgeIp });
    },
    findBridgeByIp() {
      let manualBridgeIp = this.get('manualBridgeIp');

      if (manualBridgeIp.toLowerCase() === 'trial' || manualBridgeIp.toLowerCase() === 'offline') {
        this.setProperties({
          trial: true,
          bridgeIp: 'trial',
          bridgeUsername: 'trial'
        });
      } else {
        $.ajax('http://' + manualBridgeIp + '/api', {
          data: JSON.stringify({ "devicetype": "huegasm" }),
          contentType: 'application/json',
          type: 'POST'
        }).fail(() => {
          this.set('manualBridgeIpNotFound', true);
          later(this, function () {
            this.set('manualBridgeIpNotFound', false);
          }, 5000);
        }).then(() => {
          this.send('chooseBridge', manualBridgeIp);
        });
      }
    }
  },
});
