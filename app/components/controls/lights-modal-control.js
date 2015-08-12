import Em from 'ember';

export default Em.Component.extend({
  actions: {
    clickLight: function(){
      this.sendAction();
    }
  },

  modalData: null,

  lightsApiURL: null
});
