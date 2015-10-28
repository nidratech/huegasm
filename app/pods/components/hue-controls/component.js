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
      this.get('storage').set('huegasm.selectedTab', index);
    },
    clearBridge() {
      var storage = this.get('storage');
      storage.remove('huegasm.bridgeUsername');
      storage.remove('huegasm.bridgeIp');
      location.reload();
    },
    clearAllSettings() {
      this.get('storage').clear();
      location.reload();
    },
    startIntro(){
      var intro = introJs(),
        playerBottom = Em.$('#playerBottom');

      intro.setOptions({
        steps: [
          {
            element: '#musicTab',
            intro: 'This is the music tab. Here you\'ll be able to play music and synchronize it with your active lights.<br><br>' +
            '<i>TIP: Control which lights are active through the <b>Lights</b> tab or through the <b>Groups</b> menu dropdown.</i>'
          },
          {
            element: '#playlist',
            intro: 'You can add and select music to play from your playlist here. You may add local audio files, stream music from soundcloud or stream music into the application fromn your mic.<br><br>' +
            '<i>TIP: Songs added through soundcloud will be saved for when you visit this page again.</i>'
          },
          {
            element: '#playerArea',
            intro: 'The audio playback may be controlled with the controls here. Basic music visualization effects may be shown here by selecting them from the menu ( eyeball in the bottom right ).'
          },
          {
            element: '#beatOptionRow',
            intro: 'Beat detection settings:<br>' +
            '<b>Beat Threshold</b> - The minimum sound intensity for the beat to register<br>' +
            '<b>Beat Interval</b> - The minimum amount of time between each registered beat <br>' +
            '<b>Frequency Range</b> - The frequency range of the sound to listen on for the beat<br>' +
            '<b>Transition Time</b> - The time it takes for a light to change color or brightness<br><br>' +
            '<i>TIP: Beat settings are saved per song as indicated by the red start icon in the top left corner. These settings they will be restored if you ever listen to the same song again.</i>'
          },
          {
            element: '#beatOptionButtonGroup',
            intro: 'Some additional options:<br>' +
            '<b>Default</b> - Revert to the default beat detection settings<br>' +
            '<b>Random/Sequential</b> - The transition order of lights on beat<br>' +
            '<b>Brightness/Brightness & Color</b> - The properties of the lights to change on beat<br><br>' +
            '<i>TIP: Turn the colorloop \'on\' in the <b>Lights</b> tab and set only the brightness to change on beat for a cool visual effect.</i>'
          },
          {
            element: '#beatContainer',
            intro: 'An interactive speaker that will bump on a registered beat. Switch over to the <b>Debug View</b> to see the intesity of all the registered and unregistered beats.<br><br>' +
            '<i>TIP: Click on the center of the speaker to simulate a beat.</i>'
          },
          {
            element: '#lightsTab',
            intro: 'This is the lights tab. Here you\'ll be able to change various light properties:<br>' +
            '<b>Power</b> - The selected lights to be on/off<br>' +
            '<b>Brightness</b> - The brightness level of the selected lights<br>' +
            '<b>Color</b> - The color of the selected lights<br>' +
            '<b>Strobe</b> - Selected lights will flash in sequential order<br>' +
            '<b>Colorloop</b> - Selected lights will slowly cycle through all the colors<br>'
          },
          {
            element: '#activeLights',
            intro: 'These icons represent the hue lights in your system. Active lights will be controlled by the application while the inactive lights will have a red X over them and will not be controlled. You may toggle a light\'s active state by clicking on it'
          },
          {
            element: Em.$('.settingsItem')[0],
            intro: 'Groups allow for saving and selecting sets of lights.',
            position: 'left'
          },
          {
            element: Em.$('.settingsItem')[1],
            intro: 'A few miscellaneous settings can be found here.<br><br>' +
            '<b>WARNING:</b> clearing application settings will restore the application to its original state. This will even delete your playlist and any saved song beat preferences.',
            position: 'left'
          },
          {
            element: '#dimmerWrapper',
            intro: 'Enjoy the application. ;) <br><br>' +
            '<i>TIP: click on the lightbulb to turn off the lights.</i>',
            position: 'top'
          }
        ]
      });

      // it's not pretty but it works
      intro.onchange((element) => {
        this.set('dimmerOn', false);

        if(element.id === 'musicTab' || element.id === 'playlist' || element.id === 'playerArea' || element.id === 'beatOptionRow' || element.id === 'beatOptionButtonGroup' || element.id === 'beatContainer'){
          Em.$('#musicTab').removeClass('hidden');
          Em.$('#lightsTab').addClass('hidden');
          Em.$('.navigationItem').eq(0).removeClass('active');
          Em.$('.navigationItem').eq(1).addClass('active');
        } else {
          Em.$('#lightsTab').removeClass('hidden');
          Em.$('#musicTab').addClass('hidden');
          Em.$('.navigationItem').eq(1).removeClass('active');
          Em.$('.navigationItem').eq(0).addClass('active');
        }

        if(element.id === 'musicTab' || element.id === 'playlist' || element.id === 'playerArea'){
          playerBottom.hide();
        } else if(element.id === 'beatOptionRow' || element.id === 'beatOptionButtonGroup' || element.id === 'beatContainer'){
          playerBottom.show();
        } else if(element.id === 'lightsTab'){
          Em.$('#musicTab').addClass('hidden');
          Em.$('#lightsTab').removeClass('hidden');
        } else if(element.id === 'dimmerWrapper'){
          Em.$(document).click();
        }
      });

      intro.onexit(()=>{
        this.set('activeTab', 1);
        Em.$('#musicTab').removeClass('hidden');
        Em.$('#lightsTab').addClass('hidden');
        Em.$('.navigationItem').eq(0).removeClass('active');
        Em.$('.navigationItem').eq(1).addClass('active');
        playerBottom.hide();
      });

      intro.start();
    }
  },

  apiURL: function(){
    return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername');
  }.property('bridgeIp', 'bridgeUsername'),

  didInsertElement(){
    // here's a weird way to automatically initialize bootstrap tooltips
    var observer = new MutationObserver(function(mutations) {
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

    if (!Em.isNone(this.get('storage').get('huegasm.selectedTab'))) {
      this.set('selectedTab', this.get('storage').get('huegasm.selectedTab'));
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

  pauseLightUpdates: false,

  updateLightData(){
    var self = this, fail = function() {
      clearInterval(self.get('lightsDataIntervalHandle'));
      self.setProperties({
        bridgeIp: null,
        bridgeUsername: null
      });
    };

    if(!this.get('pauseLightUpdates')){
      Em.$.get(this.get('apiURL') + '/lights', function (result, status) {
        if(!Em.isNone(result[0]) && !Em.isNone(result[0].error)){
          fail();
        } else if (status === 'success' && JSON.stringify(self.get('lightsData')) !== JSON.stringify(result)) {
          self.set('lightsData', result);
        }
      }).fail(fail);
    }
  },

  dimmerOnClass: function(){
    return this.get('dimmerOn') ? 'dimmerOn' : null;
  }.property('dimmerOn'),

  ready: function() {
    return this.get('trial') || !Em.isNone(this.get('lightsData'));
  }.property('lightsData', 'trial')
});
