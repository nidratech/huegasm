import Ember from 'ember';

const {
  Component,
  observer,
  computed,
  isEmpty,
  isNone,
  $
} = Ember;

export default Component.extend({
  groupName: null,
  selectedLights: [],

  onIsShowingModalChange: observer('isShowingModal', function(){
    if(this.get('isShowingModal')){
      this.setProperties({
        selectedLights: [],
        groupName: null
      });
    }
  }),

  saveDisabled: computed('groupName', 'selectedLights.[]', function(){
    return isNone(this.get('groupName')) || isEmpty(this.get('selectedLights')) || isEmpty(this.get('groupName').trim());
  }),

  didInsertElement: function() {
    $(document).keypress((event) => {
      if(!this.get('saveDisabled') && event.which === 13) {
        this.send('save');
      }
    });
  },

  actions: {
    close: function(){
      this.sendAction();
    },
    save: function(){
      let newGroupData = {"name": this.get('groupName'), "lights": this.get('selectedLights')},
        newGroupsData = this.get('groupsData');

      $.ajax(this.get('apiURL') + '/groups', {
        data: JSON.stringify(newGroupData),
        contentType: 'application/json',
        type: 'POST'
      });

      // crappy code to redraw the lights
      newGroupsData['9999'] = newGroupData;

      this.setProperties({
        updateGroupsData: true,
        groupsData: newGroupsData
      });
      this.sendAction();
    },
    clickLight: function(id) {
      let selectedLights = this.get('selectedLights');

      if(selectedLights.contains(id)){
        selectedLights.removeObject(id);
      } else {
        selectedLights.pushObject(id);
      }
    }
  }
});
