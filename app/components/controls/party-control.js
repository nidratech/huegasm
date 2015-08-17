import Em from 'ember';

export default Em.Component.extend({

  apiURL: null,

  strobeOn: false,

  lightsData: null,
  activeLights: null,

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
});
