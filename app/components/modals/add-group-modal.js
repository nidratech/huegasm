import Em from 'ember';

export default Em.Component.extend({
  actions: {
    close: function(){
      this.sendAction();
    },
    save: function(){
      this.sendAction();
    },
    selectLight: function(id) {
      console.log('selected ' + id);
    }
  },

  groupName: null,

  saveDisabled: false
});
