import Ember from 'ember';

const {
  Component,
  isEmpty,
  isNone,
  $
} = Ember;

export default Component.extend({
  bridgeIp: null,
  bridgeUsername: null,
  trial: false,
  dimmerOn: false,
  ready: false,

  init(){
    this._super(...arguments);

    let storage = new window.Locally.Store({compress: true}),
      dimmerOn = storage.get('huegasm.dimmerOn');
    this.set('storage', storage);

    if (!isNone(dimmerOn) && dimmerOn) {
      this.send('toggleDimmer');
    }

    if (!isEmpty(storage.get('huegasm.bridgeIp')) && !isEmpty(storage.get('huegasm.bridgeUsername'))) {
      this.setProperties({
        bridgeIp: storage.get('huegasm.bridgeIp'),
        bridgeUsername: storage.get('huegasm.bridgeUsername')
      });
    }
  },

  actions: {
    toggleDimmer(){
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
    },

    isReady(){
      this.set('ready', true);
    }
  }
});
