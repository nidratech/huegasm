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

    ['bridgeIp', 'bridgeUsername', 'dimmerOn'].forEach((item) => {
      var storedValue = storage.get('huegasm.' + item);

      if(storedValue) {
        this.set(item, storage.get('huegasm.' + item));
      }
    });
  }
});
