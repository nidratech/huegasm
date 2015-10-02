import Em from 'ember';

export default Em.Component.extend({
  actions: {
    close: function(){
      this.sendAction();
    },
    delete: function(){
      var groupId = this.get('groupId');

      Em.$.ajax(this.get('apiURL') + '/groups/' + groupId, {
        contentType: 'application/json',
        type: 'DELETE'
      });

      var groupsData = this.get('groupsData'), newGroupsData = [];
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
