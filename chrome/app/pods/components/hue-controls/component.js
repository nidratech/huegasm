import Ember from 'ember';

const {
  A,
  Component,
  computed,
  isEmpty,
  isNone,
  run: { later, scheduleOnce },
  inject,
  $
} = Ember;

export default Component.extend({
  classNames: ['container-fluid'],
  elementId: 'hue-controls',
  lightsData: null,

  activeLights: A(),
  tabList: ["Lights", "Music"],
  selectedTab: 1,
  pauseLightUpdates: false,

  displayFailure: true,

  notify: inject.service(),

  dimmerOnClass: computed('dimmerOn', function () {
    return this.get('dimmerOn') ? 'dimmerOn md-menu-origin' : 'md-menu-origin';
  }),

  ready: computed('lightsData', 'trial', function () {
    return this.get('trial') || !isNone(this.get('lightsData'));
  }),

  apiURL: computed('bridgeIp', 'bridgeUsername', function () {
    return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername');
  }),

  tabData: computed('tabList', 'selectedTab', function () {
    let tabData = [], selectedTab = this.get('selectedTab');

    this.get('tabList').forEach(function (tab, i) {
      let selected = false;

      if (i === selectedTab) {
        selected = true;
      }

      tabData.push({ "name": tab, "selected": selected });
    });

    return tabData;
  }),

  didInsertElement() {
    // here's a weird way to automatically initialize bootstrap tooltips
    let observer = new MutationObserver(function (mutations) {
      let haveTooltip = !mutations.every(function (mutation) {
        return isEmpty(mutation.addedNodes) || isNone(mutation.addedNodes[0].classList) || mutation.addedNodes[0].classList.contains('tooltip');
      });

      if (haveTooltip) {
        scheduleOnce('afterRender', function () {
          $('.bootstrap-tooltip').tooltip();
        });
      }
    });

    observer.observe($('#hue-controls')[0], { childList: true, subtree: true });
  },

  init() {
    this._super(...arguments);

    if (!this.get('trial')) {
      this.updateLightData();
      setInterval(this.updateLightData.bind(this), 2000);
    }

    if (!isNone(chrome.storage.local.get('huegasm.selectedTab'))) {
      this.set('selectedTab', chrome.storage.local.get('huegasm.selectedTab'));
    }
  },

  updateLightData() {
    let fail = () => {
      if (isNone(this.get('lightsData'))) {
        this.send('clearBridge');
      } else if (this.get('displayFailure')) {
        this.get('notify').warning({ html: '<div class="alert alert-warning" role="alert">Error retrieving data from your lights. Yikes.</div>' });
        this.set('displayFailure', false);

        later(this, function () {
          this.set('displayFailure', true);
        }, 30000);
      }
    };

    if (!this.get('pauseLightUpdates')) {
      $.get(this.get('apiURL') + '/lights', (result, status) => {
        if (!isNone(result[0]) && !isNone(result[0].error)) {
          fail();
        } else if (status === 'success' && JSON.stringify(this.get('lightsData')) !== JSON.stringify(result)) {
          this.set('lightsData', result);
        }
      }).fail(fail);
    }
  },

  actions: {
    changeTab(tabName) {
      let index = this.get('tabList').indexOf(tabName);
      this.set('selectedTab', index);
      chrome.storage.local.set('huegasm.selectedTab', index);
    },
    clearBridge() {
      chrome.storage.local.remove('huegasm.bridgeUsername');
      chrome.storage.local.remove('huegasm.bridgeIp');
      location.reload();
    },
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    },
    toggleLightsIcons() {
      this.sendAction('toggleLightsIcons');
    },
    clearAllSettings() {
      chrome.storage.local.clear();
      location.reload();
    }
  }
});
