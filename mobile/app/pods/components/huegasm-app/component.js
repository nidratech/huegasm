import Ember from 'ember';

const {
  Component,
  isEmpty
} = Ember;

export default Component.extend({
  bridgeIp: null,
  bridgeUsername: null,
  trial: false,
  storage: null,

  init() {
    this._super(...arguments);

    let storage = new window.Locally.Store({ compress: true });
    this.set('storage', storage);

    if (!isEmpty(storage.get('huegasm.bridgeIp')) && !isEmpty(storage.get('huegasm.bridgeUsername'))) {
      this.setProperties({
        bridgeIp: storage.get('huegasm.bridgeIp'),
        bridgeUsername: storage.get('huegasm.bridgeUsername')
      });
    }
  }
});
