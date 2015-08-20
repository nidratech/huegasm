import Em from 'ember';

export default Em.Component.extend({
  actions: {
    close: function(){
      this.sendAction();
    },
    delete: function(){
      Em.$.ajax(this.get('apiURL') + '/groups/' + this.get('groupId'), {
        contentType: 'application/json',
        type: 'DELETE'
      });

      var groupsData = this.get('groupsData'), newGroupsData = [];
      for (let key in groupsData) {
        if(groupsData.hasOwnProperty(key) && groupsData[key].name !== this.get('groupName') ){
          newGroupsData[key] = groupsData[key];
        }
      }

      this.setProperties({
        updateGroupsData: true,
        groupsData: newGroupsData
      });

      this.sendAction();
    }
  }
});
