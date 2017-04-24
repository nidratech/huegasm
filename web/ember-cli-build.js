/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var Funnel = require('broccoli-funnel');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    fingerprint:{
      exclude: ['logo.png']
    }
  });
  var extraAssets = new Funnel('bower_components/bootstrap-sass/assets/fonts/bootstrap/', {
    srcDir: '/',
    include: ['**'],
    destDir: '/fonts/bootstrap'
  });

  app.import('vendor/dancer.js');
  app.import('vendor/cie-rgb-converter.js');
  
  app.import('bower_components/bootstrap-sass/assets/javascripts/bootstrap/tooltip.js');
  app.import('bower_components/intro.js/intro.js');
  app.import('bower_components/intro.js/introjs.css');
  app.import('bower_components/intro.js/themes/introjs-nassim.css');
  app.import('bower_components/JavaScript-ID3-Reader/dist/id3-minimized.js');
  app.import('bower_components/jquery-mousewheel/jquery.mousewheel.js');
  app.import('bower_components/locallyjs/dist/locally.min.js');
  app.import('bower_components/velocity/velocity.js');

  return app.toTree(extraAssets);
};
