import Em from 'ember';

export default Em.Component.extend({
  actions: {
    toggleDimmer(){
      this.toggleProperty('dimmerOn');
    }
  },
  bridgeIp: null,

  bridgeUsername: null,

  trial: false,

  dimmerOn: false,
  dimmerOnClass: function(){
    var dimmerOn = this.get('dimmerOn'),
      className = null;

    if(dimmerOn){
      className = 'dimmerBulbOn';
      Em.$('body').addClass('dimmerOn');
      Em.$('html').addClass('dimmerOn');
      Em.$('md-icon').addClass('dimmerOn');
    } else {
      Em.$('body').removeClass('dimmerOn');
      Em.$('html').removeClass('dimmerOn');
      Em.$('md-icon').removeClass('dimmerOn');
    }

    return className;
  }.property('dimmerOn'),

  init(){
    this._super();

    if(localStorage.getItem('huegasm.bridgeIp')){
      this.set('bridgeIp', localStorage.getItem('huegasm.bridgeIp'));
    }

    if(localStorage.getItem('huegasm.bridgeUsername')){
      this.set('bridgeUsername', localStorage.getItem('huegasm.bridgeUsername'));
    }
  }
});
