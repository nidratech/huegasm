import Ember from 'ember';

const {
  Component,
  isEmpty,
  $
} = Ember;

export default Component.extend({
  bridgeIp: null,
  bridgeUsername: null,
  trial: false,
  elementId: 'huegasm',

  init() {
    this._super(...arguments);

    if (!isEmpty(chrome.storage.local.get('huegasm.bridgeIp')) && !isEmpty(chrome.storage.local.get('huegasm.bridgeUsername'))) {
      this.setProperties({
        bridgeIp: chrome.storage.local.get('huegasm.bridgeIp'),
        bridgeUsername: chrome.storage.local.get('huegasm.bridgeUsername')
      });
    }
  },

  actions: {
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    },

    toggleLightsIcons() {
      this.sendAction('toggleLightsIcons');
    }
  }
});
