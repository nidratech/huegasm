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

    chrome.storage.local.get('bridgeIp', ({bridgeIp}) => {
      chrome.storage.local.get('bridgeUsername', ({bridgeUsername}) => {
        this.setProperties({
          bridgeIp,
          bridgeUsername
        });
      });
    });
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
