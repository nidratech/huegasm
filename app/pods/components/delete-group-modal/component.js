import Ember from 'ember';

const {
  Component,
  $
} = Ember;

export default Component.extend({
  actions: {
    close: function(){
      this.sendAction();
    },
    delete: function(){
      let groupId = this.get('groupId');

      $.ajax(this.get('apiURL') + '/groups/' + groupId, {
        contentType: 'application/json',
        type: 'DELETE'
      });

      let groupsData = this.get('groupsData'), newGroupsData = [];
      for (let key in groupsData) {
        if(groupsData.hasOwnProperty(key) && groupsData[key].name !== this.get('groupName') ){
          newGroupsData[key] = groupsData[key];
        }
      }

      if(groupId === this.get('groupIdSelection')){
        this.set('groupIdSelection', '0');
      }

      this.setProperties({
        updateGroupsData: true,
        groupsData: newGroupsData
      });

      this.sendAction();
    }
  }
});
