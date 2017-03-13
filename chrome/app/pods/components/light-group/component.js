import Ember from 'ember';

const {
  A,
  Component,
  computed,
  isEmpty,
  isNone,
  observer,
  $
} = Ember;

export default Component.extend({
  elementId: 'active-lights',
  classNames: ['light-group'],
  isHovering: false,
  activeLights: A(),

  // list of all the lights in the hue system
  lightsList: computed('lightsData', 'activeLights.[]', 'dimmerOn', function () {
    let lightsData = this.get('lightsData'),
      activeLights = this.get('activeLights'),
      dimmerOn = this.get('dimmerOn'),
      lightsList = A(),
      src,
      activeClass;

    for (let key in lightsData) {
      activeClass = 'light-active';

      if (lightsData.hasOwnProperty(key) && lightsData[key].state.reachable) {
        switch (lightsData[key].modelid) {
          case 'BSB001':
            src = 'bridge_v1';
            break;
          case 'BSB002':
            src = 'bridge_v2';
            break;
          case 'LCT001':
          case 'LCT007':
          case 'LCT010':
          case 'LCT014':
          case 'LTW010':
          case 'LTW001':
          case 'LTW004':
          case 'LTW015':
          case 'LWB004':
          case 'LWB006':
            src = 'white_and_color_e27';
            break;
          case 'LWB010':
          case 'LWB014':
            src = 'white_e27';
            break;
          case 'LCT002':
            src = 'br30';
            break;
          case 'LCT011':
          case 'LTW011':
            src = 'br30_slim';
            break;
          case 'LCT003':
            src = 'gu10';
            break;
          case 'LTW013':
            src = 'gu10_perfectfit';
            break;
          case 'LST002':
          case 'LST001':
            src = 'lightstrip';
            break;
          case 'LLC006':
          case 'LLC010':
            src = 'iris';
            break;
          case 'LLC005':
          case 'LLC011':
          case 'LLC012':
          case 'LLC007':
            src = 'bloom';
            break;
          case 'LLC014':
            src = 'aura';
            break;
          case 'LLC013':
            src = 'storylight';
            break;
          case 'LLC020':
            src = 'go';
            break;
          case 'HBL001':
          case 'HBL002':
          case 'HBL003':
            src = 'beyond_ceiling_pendant_table';
            break;
          case 'HIL001':
          case 'HIL002':
            src = 'impulse';
            break;
          case 'HEL001':
          case 'HEL002':
            src = 'entity';
            break;
          case 'HML001':
          case 'HML002':
          case 'HML003':
          case 'HML004':
          case 'HML005':
            src = 'phoenix_ceiling_pendant_table_wall';
            break;
          case 'HML006':
            src = 'phoenix_down';
            break;
          case 'LTP003':
            src = 'pendant_square';
            break;
          case 'LTP002':
          case 'LTP003':
            src = 'pendant_round';
            break;
          case 'LTP001':
            src = 'pendant_oval';
            break;
          case 'LDF002':
          case 'LTF002':
          case 'LTF001':
          case 'LTC001':
          case 'LTC002':
          case 'LDF001':
            src = 'ceiling_square';
            break;
          case 'LTC003':
          case 'LTD001':
          case 'LTD001':
            src = 'ceiling_round';
            break;
          case 'LDD002':
            src = 'floor';
            break;
          case 'LDD001':
            src = 'table';
            break;
          case 'LDT001':
          case 'MWM001':
            src = 'recessed';
            break;
          case 'SWT001':
            src = 'tap';
            break;
          case 'RWL021':
            src = 'hds';
            break;
          case 'SML001':
            src = 'motion_sensor';
            break;
          default:
            src = 'white_e27';
        }

        if (dimmerOn) {
          src = `assets/images/lights/filled/${src}.svg`;
        } else {
          src = `assets/images/lights/outline/${src}.svg`;
        }

        if (!activeLights.includes(key)) {
          activeClass = 'light-inactive';
        }

        lightsList.push({ src , name: lightsData[key].name, id: key, data: lightsData[key], activeClass });
      }
    }

    return lightsList;
  }),

  onActiveLightsChange: observer('activeLights.[]', function () {
    chrome.storage.local.set({ 'activeLights': this.get('activeLights') });
  }),

  init() {
    this._super(...arguments);

    let lightsData = this.get('lightsData'),
      _activeLights = this.get('activeLights');

    chrome.storage.local.get('activeLights', ({activeLights}) => {
      if (!isNone(activeLights)) {
        activeLights.forEach(function (i) {
          if (!isNone(lightsData) && lightsData.hasOwnProperty(i) && lightsData[i].state.reachable) {
            _activeLights.pushObject(i);
          }
        });
      } else {
        for (let key in lightsData) {
          if (lightsData.hasOwnProperty(key) && lightsData[key].state.reachable) {
            _activeLights.pushObject(key);
          }
        }
      }
    });
  },

  actions: {
    clickLight(id) {
      let activeLights = this.get('activeLights'),
        lightId = activeLights.indexOf(id);

      if (lightId !== -1) {
        activeLights.removeObject(id);
      } else {
        activeLights.pushObject(id);
        this.set('syncLight', id);
      }
    },
    lightStartHover(id) {
      let activeLights = this.get('activeLights'),
        hoveredLight = this.get('lightsList').filter(function (light) {
          return light.activeClass !== 'unreachable' && light.id === id[0] && activeLights.indexOf(id) !== -1;
        });

      if (!isEmpty(hoveredLight) && this.get('noHover') !== true) {
        $.ajax(this.get('apiURL') + '/lights/' + id + '/state', {
          data: JSON.stringify({ "alert": "lselect" }),
          contentType: 'application/json',
          type: 'PUT'
        });
      }

      this.setProperties({
        pauseLightUpdates: true,
        isHovering: true
      });
    },
    lightStopHover(id) {
      let hoveredLight = this.get('lightsList').filter(function (light) {
        return light.activeClass !== 'unreachable' && light.id === id[0];
      });

      if (!isEmpty(hoveredLight) && this.get('noHover') !== true) {
        $.ajax(this.get('apiURL') + '/lights/' + id + '/state', {
          data: JSON.stringify({ "alert": "none" }),
          contentType: 'application/json',
          type: 'PUT'
        });
      }

      this.setProperties({
        pauseLightUpdates: false,
        isHovering: false
      });
    }
  }
});
