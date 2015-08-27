import Em from 'ember';

export default Em.Component.extend({
  didInsertElement: function () {
    var dancer = new Dancer(),
      self = this,
      briOff  = function(i){
        Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
          data: JSON.stringify({'on': 1, 'transitiontime': 0}),
          contentType: 'application/json',
          type: 'PUT'
        });
      },
      kick = dancer.createKick({
        threshold : 0.45,
        frequency: [0, 3],
        onKick: function ( mag ) {

          if(self.get('paused') === false){
            for(let i=1; i <= 1; i++){
              Em.$.ajax(self.get('apiURL') + '/lights/' + i + '/state', {
                data: JSON.stringify({'bri': 254, 'transitiontime': 0}),
                contentType: 'application/json',
                type: 'PUT'
              });

              setTimeout(briOff, 50, i);
            }

            self.set('paused', true);

            setTimeout(function(){ self.set('paused', false); }, 150);

            console.log('Kick at ' + mag);
          }

        }
      }),
      a = new Audio();

    kick.on();

    audio_file.onchange = function(){
      var files = this.files;
      var file = URL.createObjectURL(files[0]);
      a.src = file;
      dancer.load(a);

      dancer.play();
    };
  },

  paused: false
});
