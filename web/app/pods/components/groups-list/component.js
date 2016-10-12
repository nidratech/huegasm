import Ember from 'ember';

const {
  Component,
  observer,
  computed,
  isEmpty,
  isNone,
} = Ember;

export default Component.extend({
  classNames: ['dropdown-menu'],
  elementId: 'group-list',
  tagName: null,
  groupIdSelection: null,

  groupsArrData: computed('groupsData', 'groupIdSelection', function(){
    let groupsData = this.get('groupsData'), lightsData = this.get('lightsData'), groupsArrData = [], ids = [], groupIdSelection = this.get('groupIdSelection');

    for (let key in lightsData) {
      if(lightsData.hasOwnProperty(key) && lightsData[key].state.reachable){
        ids.push(key);
      }
    }
    groupsArrData.push({name: 'All', data: {lights: ids, key: '0' }, rowClass: groupIdSelection === '0' ? 'group-row selected-row' : 'group-row', deletable: false});

    for (let key in groupsData) {
      if (groupsData.hasOwnProperty(key)) {
        let rowClass = 'group-row';

        if(key === groupIdSelection){
          rowClass += ' selected-row';
        }

        groupsArrData.push({name: groupsData[key].name, data: {lights: groupsData[key].lights, key: key}, rowClass: rowClass, deletable: true});
      }
    }

    return groupsArrData;
  }),

  onGroupIdSelectionChanged: observer('groupIdSelection', 'groupsArrData', function(){
    let groupIdSelection = this.get('groupIdSelection'),
      lights = [];

    this.get('groupsArrData').some(function(group){
      if(group.data.key === groupIdSelection){
        lights = group.data.lights;
        return true;
      }
    });

    this.get('storage').set('huegasm.selectedGroup', groupIdSelection);

    if(!isNone(groupIdSelection) && !isEmpty(lights)){
      this.set('activeLights', lights);
    }
  }),

  didInsertElement(){
    let selectGroup = '0',
      storageItem = this.get('storage').get('huegasm.selectedGroup');

    if(storageItem){
      selectGroup = storageItem;
    }

    this.set('groupIdSelection', selectGroup);
  },

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
  }
});
