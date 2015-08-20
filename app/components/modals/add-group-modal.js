import Em from 'ember';

export default Em.Component.extend({
  actions: {
    close: function(){
      this.sendAction();
    },
    save: function(){
      var newGroupData = {"name": this.get('groupName'), "lights": this.get('selectedLights')}, newGroupsData = this.get('groupsData');

      Em.$.ajax(this.get('apiURL') + '/groups', {
        data: JSON.stringify(newGroupData),
        contentType: 'application/json',
        type: 'POST'
      });

      newGroupsData['9999'] = newGroupData;

      this.setProperties({
        updateGroupsData: true,
        groupsData: newGroupsData
      });
      this.sendAction();
    },
    clickLight: function(id) {
      var selectedLights = this.get('selectedLights');

      if(selectedLights.contains(id)){
        selectedLights.removeObject(id);
      } else {
        selectedLights.push(id);
      }

      this.notifyPropertyChange('selectedLights');
    }
  },

  groupName: null,

  selectedLights: [],

  onIsShowingAddGroupsModalChange: function(){
    this.set('selectedLights', []);
  }.observes('isShowingAddGroupsModal'),

  saveDisabled: function(){
    return Em.isNone(this.get('groupName')) || Em.isEmpty(this.get('selectedLights')) || Em.isEmpty(this.get('groupName').trim());
  }.property('groupName', 'selectedLights.[]')
});
