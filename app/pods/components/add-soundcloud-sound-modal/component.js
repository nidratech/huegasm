import Em from 'ember';

export default Em.Component.extend({
  actions: {
    close: function () {
      this.sendAction();
    }
  },
  saveDisabled: function(){
    return Em.isNone(this.get('groupName')) || Em.isEmpty(this.get('selectedLights')) || Em.isEmpty(this.get('groupName').trim());
  }.property('groupName', 'selectedLights.[]')
});
