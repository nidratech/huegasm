/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'huegasm',
    podModulePrefix: 'huegasm/pods',
    environment: environment,
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    contentSecurityPolicy: {
      'default-src': "'none'",
      'script-src': "'self' 'unsafe-inline' connect.soundcloud.com www.google-analytics.com",
      'font-src': "'self' fonts.gstatic.com",
      'connect-src': "'self' *",
      'img-src': "'self' *.sndcdn.com  www.google-analytics.com data:",
      'media-src': "'self' api.soundcloud.com *.sndcdn.com blob:",
      'style-src': "'self' 'unsafe-inline' fonts.googleapis.com",
      'object-src': "'self' connect.soundcloud.com",
      'frame-src': "'self'"
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
    //ENV.baseURL = '/huegasm';
  }

  return ENV;
};
