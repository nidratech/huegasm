import Em from 'ember';

export default Em.Component.extend({
  classNames: ['container-fluid'],
  elementId: 'hueControls',

  bridgeIp: null,
  manualBridgeIp: null,
  bridgeUsername: null,

  updateGroupsData: true,
  groupsData: null,
  lightsData: null,

  activeLights: [],

  actions: {
    changeTab(tabName){
      var index = this.get('tabList').indexOf(tabName);
      this.set('selectedTab', index);
      localStorage.setItem('huegasm.selectedTab', index);
    },
    clearBridge() {
      delete localStorage['huegasm.bridgeUsername'];
      delete localStorage['huegasm.bridgeIp'];
      location.reload();
    },
    clearAllSettings() {
      localStorage.clear();
      location.reload();
    }
  },

  apiURL: function(){
    return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername');
  }.property('bridgeIp', 'bridgeUsername'),

  didInsertElement(){
    // here's a weird way to automatically initialize bootstrap tooltips
    var self = this, observer = new MutationObserver(function(mutations) {
      var haveTooltip = !mutations.every(function(mutation) {
        return Em.isEmpty(mutation.addedNodes) || Em.isNone(mutation.addedNodes[0].classList) || mutation.addedNodes[0].classList.contains('tooltip');
      });

      if(haveTooltip) {
        Em.run.once(this, function(){
          Em.$('.bootstrapTooltip').tooltip();
        });
      }
    });

    observer.observe(Em.$('#hueControls')[0], {childList: true, subtree: true});
  },

  init() {
    this._super();

    if(!this.get('trial')) {
      this.doUpdateGroupsData();
      this.set('lightsDataIntervalHandle', setInterval(this.updateLightData.bind(this), 1000));
    }

    if (localStorage.getItem('huegasm.selectedTab')) {
      this.set('selectedTab', Number(localStorage.getItem('huegasm.selectedTab')));
    }
  },

  onUpdateGroupsDataChange: function(){
    if(this.get('updateGroupsData')){
      var self = this;
      setTimeout(function(){ self.doUpdateGroupsData(); }, 1000);
    }
  }.observes('updateGroupsData'),

  doUpdateGroupsData(){
    var self = this;

    Em.$.get(this.get('apiURL') + '/groups', function (result, status) {
      if (status === 'success' ) {
        self.set('groupsData', result);
      }
    });

    this.toggleProperty('updateGroupsData');
  },

  tabList: ["Lights", "Music"],
  selectedTab: 1,
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
  musicTabSelected: Em.computed.equal('selectedTab', 1),

  updateLightData(){
    var self = this, fail = function() {
      clearInterval(self.get('lightsDataIntervalHandle'));
      self.setProperties({
        bridgeIp: null,
        bridgeUsername: null
      });
    };

    Em.$.get(this.get('apiURL') + '/lights', function (result, status) {
      if (status === 'success' && Em.isNone(result[0])) {
        self.set('lightsData', result);
      } else {
        fail();
      }
    }).fail(fail);
  },

  ready: function() {
    return this.get('trial') || !Em.isNone(this.get('lightsData'));
  }.property('lightsData', 'trial')
});
