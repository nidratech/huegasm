import Em from 'ember';

export default Em.Component.extend({
  actions: {
    toggleDimmer(){
      this.toggleProperty('dimmerOn');
    },
    isReady(){
      this.set('ready', true);
    }
  },
  bridgeIp: null,

  bridgeUsername: null,

  trial: false,

  storage: null,

  dimmerOn: false,

  ready: false,

  dimmerOnClass: function(){
    var dimmerOn = this.get('dimmerOn'),
      storage = this.get('storage'),
      className = null;

    if(dimmerOn){
      className = 'dimmerBulbOn';
      Em.$('body').addClass('dimmerOn');
      Em.$('html').addClass('dimmerOn');
    } else {
      Em.$('body').removeClass('dimmerOn');
      Em.$('html').removeClass('dimmerOn');
    }

    storage.set('huegasm.dimmerOn', dimmerOn);

    return className;
  }.property('dimmerOn'),

  init(){
    this._super();

    var storage = new window.Locally.Store({ compress: true });
    this.set('storage', storage);

    if(!Em.isNone(storage.get('huegasm.dimmerOn'))) {
      this.set('dimmerOn', storage.get('huegasm.dimmerOn'));
    }

    if(!Em.isEmpty(storage.get('huegasm.bridgeIp')) && !Em.isEmpty(storage.get('huegasm.bridgeUsername'))) {
      this.setProperties({
        bridgeIp: storage.get('huegasm.bridgeIp'),
        bridgeUsername: storage.get('huegasm.bridgeUsername')
      });
    }
  }
});
