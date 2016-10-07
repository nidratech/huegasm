import Ember from 'ember';

const {
  Component,
  computed,
  isEmpty,
  isNone,
  $
} = Ember;

export default Component.extend({
  bridgeIp: null,
  bridgeUsername: null,
  trial: false,
  storage: null,
  dimmerOn: false,
  ready: false,

  year: computed(function(){
    return new Date().getFullYear();
  }),

  dimmerOnClass: computed('dimmerOn', function(){
    let dimmerOn = this.get('dimmerOn'),
      storage = this.get('storage'),
      dimmerOnClass = null;

    if (dimmerOn) {
      $('body').addClass('dimmerOn');
      $('html').addClass('dimmerOn');
      dimmerOnClass = 'active';
    } else {
      $('body').removeClass('dimmerOn');
      $('html').removeClass('dimmerOn');
    }

    storage.set('huegasm.dimmerOn', dimmerOn);

    return dimmerOnClass;
  }),

  init(){
    this._super();

    let storage = new window.Locally.Store({compress: true});
    this.set('storage', storage);

    if (!isNone(storage.get('huegasm.dimmerOn'))) {
      this.set('dimmerOn', storage.get('huegasm.dimmerOn'));
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
    },
    isReady(){
      this.set('ready', true);
    }
  }
});
