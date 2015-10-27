import Em from 'ember';

export default Em.Component.extend({
  classNames: ['dropdown-menu'],
  elementId: 'groupList',

  tagName: null,

  groupIdSelection: null,

  actions: {
    selectGroup(selection){
      this.set('groupIdSelection', selection);
    },
    toggleConfirmDeleteGroupsModal(groupName, groupId){
      this.setProperties({
        deleteGroupName: groupName,
        deleteGroupId: groupId
      });
      this.toggleProperty('isShowingConfirmDeleteModal');
    },
    toggleAddGroupsModal(){
      this.toggleProperty('isShowingAddGroupsModal');
    }
  },

  groupsArrData: function(){
    var groupsData = this.get('groupsData'), lightsData = this.get('lightsData'), groupsArrData = [], ids = [], groupIdSelection = this.get('groupIdSelection');

    for (let key in lightsData) {
      if(lightsData.hasOwnProperty(key) && lightsData[key].state.reachable){
        ids.push(key);
      }
    }
    groupsArrData.push({name: 'All', data: {lights: ids, key: '0' }, rowClass: groupIdSelection === '0' ? 'groupRow selectedRow' : 'groupRow', deletable: false});

    for (let key in groupsData) {
      if (groupsData.hasOwnProperty(key)) {
        var rowClass = 'groupRow';

        if(key === groupIdSelection){
          rowClass += ' selectedRow';
        }

        groupsArrData.push({name: groupsData[key].name, data: {lights: groupsData[key].lights, key: key}, rowClass: rowClass, deletable: true});
      }
    }

    return groupsArrData;
  }.property('groupsData', 'lightsData', 'groupIdSelection'),

  onGroupIdSelectionChanged: function(){
    var groupIdSelection = this.get('groupIdSelection'), lights = [];

    this.get('groupsArrData').some(function(group){
      if(group.data.key === groupIdSelection){
        lights = group.data.lights;
        return true;
      }
    });

    this.get('storage').set('huegasm.selectedGroup', groupIdSelection);

    if(!Em.isNone(groupIdSelection) && !Em.isEmpty(lights)){
      this.set('activeLights', lights);
    }
  }.observes('groupIdSelection', 'groupsArrData'),

  didInsertElement(){
    var selectGroup = '0', storageItem = this.get('storage').get('huegasm.selectedGroup');

    if(storageItem){
      selectGroup = storageItem;
    }

    this.set('groupIdSelection', selectGroup);
  }
});
