import Em from 'ember';

export default Em.Component.extend({
  bridgeIp: null,

  bridgeUsername: null,

  updateGroupsData: true,
  groupsData: null,
  lightsData: null,
  activeLights: Em.A(),

  apiURL: function(){
      return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername');
  }.property('bridgeIp', 'bridgeUsername'),

  init: function() {
    this._super();
    this.doUpdateGroupsData();

    this.set('lightsDataIntervalHandle', setInterval(this.updateLightData.bind(this), 1000));
  },

  onUpdateGroupsDataChange: function(){
    if(this.get('updateGroupsData')){
      var self = this;
      setTimeout(function(){ self.doUpdateGroupsData(); }, 1000);
    }
  }.observes('updateGroupsData'),

  doUpdateGroupsData: function(){
    var self = this;

    Em.$.get(this.get('apiURL') + '/groups', function (result, status) {
      if (status === 'success' ) {
        self.set('groupsData', result);
      }
    });

    this.toggleProperty('updateGroupsData');
  },

  tabList: ["Lights", "Scenes", "Music"],
  selectedTab: 0,
  tabData: function(){
    var tabData = [], selectedTab = this.get('selectedTab');

    this.get('tabList').forEach(function(tab, i){
      var selected = false;

      if(i === selectedTab){
        selected = true;
      }

      tabData.push({"name": tab, "selected": selected });
    });

    return tabData;
  }.property('tabList', 'selectedTab'),

  lightsTabSelected: Em.computed.equal('selectedTab', 0),
  scenesTabSelected: Em.computed.equal('selectedTab', 1),
  musicTabSelected: Em.computed.equal('selectedTab', 2),

  actions: {
    changeTab: function(tabName){
      this.set('selectedTab', this.get('tabList').indexOf(tabName));
    }
  },

  updateLightData: function(){
    var self = this;

    Em.$.get(this.get('apiURL') + '/lights', function (result, status) {
      if (status === 'success' && JSON.stringify(self.get('lightsData')) !== JSON.stringify(result) ) {
        if(self.get('activeLights').length === 0){
          var ids = [];
          for (let key in result) {
            if(result.hasOwnProperty(key) && result[key].state.reachable){
              ids.push(key);
            }
          }
          self.set('activeLights', ids);
        }

        self.set('lightsData', result);
      } else if(status !== 'success') {
        // something went terribly wrong ( user got unauthenticated? ) and we'll need to start all over
        clearInterval(self.get('lightsDataIntervalHandle'));
        this.setProperties({
          bridgeIp: null,
          bridgeUsername: null
        });
      }
    });
  }
});
