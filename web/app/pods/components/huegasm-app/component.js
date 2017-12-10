import Ember from 'ember';

const { Component, isEmpty, $ } = Ember;

export default Component.extend({
  bridgeIp: null,
  bridgeUsername: null,
  trial: false,
  ready: false,
  elementId: 'huegasm',
  classNameBindings: ['bridgeUsername::display-flex'],

  init() {
    this._super(...arguments);

    let storage = this.get('storage');

    if (!isEmpty(storage.get('huegasm.bridgeIp')) && !isEmpty(storage.get('huegasm.bridgeUsername'))) {
      this.setProperties({
        bridgeIp: storage.get('huegasm.bridgeIp'),
        bridgeUsername: storage.get('huegasm.bridgeUsername')
      });
    }
  },

  actions: {
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    },

    toggleLightsIcons() {
      this.sendAction('toggleLightsIcons');
    },

    isReady() {
      this.set('ready', true);
      $('html, body').velocity('scroll');
    }
  }
});
