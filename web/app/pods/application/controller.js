import Ember from 'ember';

const {
  Controller,
  isEmpty,
  $
} = Ember;

export default Controller.extend({
  dimmerOn: false,

  init(){
    this._super(...arguments);

    let storage = new window.Locally.Store({compress: true}),
      dimmerOn = storage.get('huegasm.dimmerOn');
    this.set('storage', storage);

    if (!isEmpty(dimmerOn) && dimmerOn) {
      this.send('toggleDimmer');
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
    }
  }
});
