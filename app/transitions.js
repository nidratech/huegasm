export default function(){
  this.transition(
    this.hasClass('tabSwitch'),
    this.use('crossFade')
  );
}
