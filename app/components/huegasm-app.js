import Em from 'ember';

export default Em.Component.extend({
  bridgeIp: null,

  bridgeUsername: null,

  init: function(){
    this._super();
    if(localStorage.getItem('huegasm.bridgeIp')){
      this.set('bridgeIp', localStorage.getItem('huegasm.bridgeIp'));
    }

    if(localStorage.getItem('huegasm.bridgeUsername')){
      this.set('bridgeUsername', localStorage.getItem('huegasm.bridgeUsername'));
    }
  }
});
