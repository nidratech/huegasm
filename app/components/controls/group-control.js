import Em from 'ember';

export default Em.Component.extend({
  classNames: ['innerControlFrame'],

  tagName: null,

  groupSelection: null,

  actions: {
    selectGroup: function(selection){
      this.set('groupSelection', selection);
    },

    toggleAddGroupsModal: function(){
      this.toggleProperty('isShowingAddGroupsModal');
    }
  },

  groupsArrData: function(){
    var groupsData = this.get('groupsData'), lightsData = this.get('lightsData'), groupsArrData = [], ids = [];

    for (let key in lightsData) {
      if(lightsData.hasOwnProperty(key) && lightsData[key].state.reachable){
        ids.push(key);
      }
    }
    groupsArrData.push({name: 'All', data: {lights: ids}});

    for (let key in groupsData) {
      if (groupsData.hasOwnProperty(key)) {
        groupsArrData.push({name: groupsData[key].name, data: {lights: groupsData[key].lights, key: key}});
      }
    }

    return groupsArrData;
  }.property('groupsData', 'lightsData'),

  onGroupSelectionChanged: function(){
    var groupSelection = this.get('groupSelection');

    if(!Em.isNone(groupSelection)){
      this.set('activeLights', groupSelection.lights);
    }
  }.observes('groupSelection')
});
