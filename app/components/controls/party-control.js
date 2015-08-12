import Em from 'ember';

export default Em.Component.extend({

  lightsApiURL: null,

  strobeOn: false,

  numLights: 0,
  lightsData: null,

  strobeOnInervalHandle: null,
  strobeSat: 0,
  preStrobeOnLightsDataCache: null,
  lastStrobeLight: 0,

  onStrobeOnChange: function () {
    var lightsData = this.get('lightsData'), self = this;

    if (this.get('strobeOn')) {
      this.set('preStrobeOnLightsDataCache', lightsData);
      var stobeInitRequestData = {'sat': this.get('strobeSat'), 'bri': 254, 'transitiontime': 0};

      for (let key in lightsData) {
        if (lightsData.hasOwnProperty(key)) {
          if (lightsData[key].state.on) {
            stobeInitRequestData.on = false;
          }

          Em.$.ajax(this.get('lightsApiURL') + '/' + key + '/state', {
            data: JSON.stringify(stobeInitRequestData),
            contentType: 'application/json',
            type: 'PUT'
          });
        }
      }

      this.set('strobeOnInervalHandle', setInterval(this.strobeStep.bind(this), 200));
    } else { // revert the light system to pre-strobe
      var preStrobeOnLightsDataCache = this.get('preStrobeOnLightsDataCache');

      for (let key in lightsData) {
        if (lightsData.hasOwnProperty(key)) {
          setTimeout(function () {
            Em.$.ajax(self.get('lightsApiURL') + '/' + key + '/state', {
              data: JSON.stringify({
                'on': preStrobeOnLightsDataCache[key].state.on,
                'sat': preStrobeOnLightsDataCache[key].state.sat,
                'bri': preStrobeOnLightsDataCache[key].state.bri
              }),
              contentType: 'application/json',
              type: 'PUT'
            });
          }, 2000);
        }
      }

      clearInterval(this.get('strobeOnInervalHandle'));
    }
  }.observes('strobeOn'),

  strobeStep: function () {
    var lightsData = this.get('lightsData'), lastStrobeLight = (this.get('lastStrobeLight') + 1) % (this.get('numLights') + 1), self = this;

    Em.$.ajax(this.get('lightsApiURL') + '/' + lastStrobeLight + '/state', {
      data: JSON.stringify({'on': true, 'transitiontime': 0, 'alert': 'select'}),
      contentType: 'application/json',
      type: 'PUT'
    });
    Em.$.ajax(self.get('lightsApiURL') + '/' + lastStrobeLight + '/state', {
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
