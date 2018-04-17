import Ember from 'ember';

const { Controller, isEmpty, $ } = Ember;

export default Controller.extend({
  dimmerOn: false,
  lightsIconsOn: true,

  init() {
    this._super(...arguments);

    let storage = new window.Locally.Store({ compress: true }),
      dimmerOn = storage.get('huegasm.dimmerOn'),
      lightsIconsOn = storage.get('huegasm.lightsIconsOn');
    this.set('storage', storage);

    if (!isEmpty(dimmerOn) && dimmerOn) {
      this.send('toggleDimmer');
    }

    if (!isEmpty(lightsIconsOn)) {
      this.set('lightsIconsOn', lightsIconsOn);
    }
  },

  actions: {
    toggleLightsIcons() {
      this.toggleProperty('lightsIconsOn');

      let lightsIconsOn = this.get('lightsIconsOn');

      this.get('storage').set('huegasm.lightsIconsOn', lightsIconsOn);
    },
    toggleDimmer() {
      this.toggleProperty('dimmerOn');

      let dimmerOn = this.get('dimmerOn');

      if (dimmerOn) {
        $('body').addClass('dimmerOn');
        $('html').addClass('dimmerOn');
      } else {
        $('body').removeClass('dimmerOn');
        $('html').removeClass('dimmerOn');
      }

      this.get('storage').set('huegasm.dimmerOn', dimmerOn);
    }
  }
});
