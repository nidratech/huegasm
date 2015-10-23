import Em from 'ember';

export default Em.Mixin.create({
  currentVisName: 'None',

  currentVisSettings: function () {
    var name = this.get('currentVisName');

    this.get('storage').set('huegasm.currentVisName', name);

    if (Em.isNone(name)) {
      return null;
    } else {
      return this.get('visSettings').filter(function (vis) {
        return vis.name === name
      });
    }
  }.property('currentVisName'),

  visNames: function () {
    return this.get('visSettings').map(function (vis) {
      return vis.name;
    });
  }.property('visSettings'),

  visSettings: [{
    name: "None",
    set: null
  }, {
    name: "Borealis",
    set: {
      controls: {
        seuilAudible: 0.002942,
        radiusAmplitude: 0,
        radius: 116,
        radiusVar: 0.16,
        amplitudeOnMag: -1.02,
        colors: {r: 0.91, g: 0.6, b: 0.75},
        burningColors: {r: 8.7, g: 4.64, b: 3.29},
        burningColorsMax: {r: 0.898, g: 0.665, b: 0.258},
        spectralColors: {r: -1.24, g: -0.98, b: -1.6},
        bgColors: {r: 0, g: 0, b: 4},
        speed: -0.13,
        picture: "assets/images/flares/flare4.png",
        colorsDecr: {r: 0.04787, g: -0.00097, b: -0.00281},
        dots: 288,
        maxSize: 758,
        rotation: {x: 0, y: 0, z: 0},
        position: {x: 0, y: 0, z: 0},
        radiusIncr: -1.24,
        speedIncr: 4,
        opacityBase: 0.471,
        opacityAmp: 1.5,
        opacityDecr: 0.0048,
        centerAmp: 0,
        sizeAmp: 0.73,
        sizeDecr: -0.00289,
        freqSpeedIncr: 7.6313,
        magSpeedIncr: 0,
        baseRotate: -910.3086207435979,
        autoRotate: 0,
        rotateAmp: -0.029517,
        textureRotateDecr: 0.128881,
        textureRotateAmp: -0.7313,
        equalizer: 263,
        gravity: {x: -0.00558, y: 0.0068, z: 0.0121},
        showAmp: 0,
        blending: 2,
        autoTraveler: 1,
        camera: {
          positionIncr: {x: 0, y: 0, z: 0},
          traveler: {
            freq: {x: 0, y: 0.01, z: 0.01, x2: 0, y2: 0, z2: 0},
            phase: {x: 0, y: 0.01, z: 0.01, x2: 0, y2: 0, z2: 0},
            width: {x: 0, y: 0.1, z: 0.1, x2: 0, y2: 0, z2: 0},
            center: {x: 0, y: 0, z: 0, x2: 0, y2: 0, z2: 0}
          }
        }
      },
      camera: {
        position: {x: 40, y: 13.218400900933863, z: -9.516315737622158},
        rotation: {x: -2.194772871513226, y: 1.184106819993227, z: 2.2315573880289308}
      },
      particles: {
        position: {x: -198.4052190636108, y: -37.40200000000022, z: 15.228000000000227},
        rotation: {x: 4.733931634852215, y: 1.9666500000000078, z: -0.16421999999999976}
      }
    }
  },
    {
      name: "Lightwave",
      set: [{
        controls: {
          seuilAudible: 0.002088,
          radiusAmplitude: -7.852,
          radius: 120,
          radiusVar: 0.012,
          radiusVarAmp: 0,
          amplitudeOnMag: 0,
          colors: {r: 0.81, g: 0.81, b: 0.94},
          burningColors: {r: 7.24, g: 4.02, b: 9.42},
          burningColorsMax: {r: 0.206, g: 0.299, b: 0.9},
          spectralColors: {r: -0.28, g: 0, b: 0.19},
          bgColors: {r: 0, g: 0, b: -1},
          speed: -0.48,
          picture: "assets/images/flares/vor8.2.png",
          colorsDecr: {r: 0.00057, g: 0.00364, b: 0.02},
          dots: 482,
          maxSize: 464,
          rotation: {x: 0, y: 0, z: 0},
          position: {x: 0, y: 0, z: 0},
          radiusIncr: -1.89,
          radiusIncrAmp: 4.8,
          speedIncr: -37,
          opacityBase: 0.986,
          opacityAmp: 6.7,
          opacityDecr: 0.0086,
          centerAmp: 0,
          sizeAmp: 2.63,
          sizeDecr: 0,
          freqSpeedIncr: 0,
          magSpeedIncr: 0,
          baseRotate: -910.8242890837017,
          autoRotate: 0.0011,
          rotateAmp: -0.179517,
          textureRotateDecr: 0.02761,
          textureRotateAmp: 0,
          equalizer: -145,
          gravity: {x: -0.00011, y: -0.0116, z: 0.0154},
          gravityAmp: {x: 0, y: 0, z: 1.97},
          showAmp: 0,
          blending: 2,
          autoTraveler: 1,
          camera: {
            positionIncr: {x: 0, y: 0, z: 0},
            traveler: {
              freq: {x: 0.0191, y: 0.01, z: 0.01, x2: 0, y2: 0.008925, z2: 0.00265},
              phase: {x: 0.0154, y: 0.01, z: 0.01, x2: 0, y2: 0.0125, z2: 0.003525},
              width: {x: 0.84, y: -0.02, z: -0.02, x2: 0, y2: 0.005, z2: 0},
              center: {x: 0, y: 0, z: 0, x2: 0, y2: 0, z2: 0}
            }
          }
        },
        camera: {
          position: {x: 28.290507810306817, y: -79.05312595414983, z: 148.26913157117622},
          rotation: {x: 0.4898326329313103, y: 0.16680418921697668, z: -0.08829352787105102}
        },
        particles: {
          position: {x: 31, y: 35.789000000000456, z: 30.221000000000057},
          rotation: {x: 1.5, y: 3.813987739867519, z: 10.34557348383392}
        }
      }]
    },
    {
      name: "Neutrino",
      set: {
        controls: {
          seuilAudible: 0.001,
          radiusAmplitude: 0.422,
          radius: 207,
          radiusVar: 0.008,
          radiusVarAmp: -4510,
          amplitudeOnMag: 0,
          colors: {r: 0.38, g: 0.84, b: 0.87},
          burningColors: {r: 9.42, g: 8.17, b: 1.5},
          burningColorsMax: {r: 1, g: 0.583, b: 0.183},
          spectralColors: {r: -0.3, g: 0.23, b: -0.13},
          bgColors: {r: 0, g: 0, b: -1},
          speed: 8.49,
          picture: "assets/images/flares/colo.png",
          colorsDecr: {r: 0, g: 0, b: 0},
          dots: 478,
          maxSize: 392,
          rotation: {x: 0, y: 0, z: 0},
          position: {x: 0, y: 0, z: 0},
          radiusIncr: -1.13,
          radiusIncrAmp: -14.48,
          speedIncr: 0,
          opacityBase: 0.88,
          opacityAmp: 1.3,
          opacityDecr: 0.0152,
          centerAmp: 0,
          sizeAmp: 2.625,
          sizeDecr: 0,
          freqSpeedIncr: 2.6026,
          magSpeedIncr: 0.3834,
          baseRotate: -543.1624876256562,
          autoRotate: 0,
          rotateAmp: 0,
          textureRotateDecr: 0.02761,
          textureRotateAmp: 0,
          equalizer: 83,
          gravity: {x: -0.00281, y: 0.0136, z: 0.0196},
          gravityAmp: {x: -4.2, y: -0.15, z: 1.02},
          showAmp: 0,
          blending: 2,
          autoTraveler: 0,
          camera: {
            positionIncr: {x: 0, y: 0, z: 0},
            traveler: {
              freq: {x: 0, y: 0.01, z: 0.01, x2: 0, y2: 0.008925, z2: 0.00265},
              phase: {x: 0, y: 0.01, z: 0.01, x2: 0, y2: 0.0125, z2: 0.003525},
              width: {x: 0, y: -0.02, z: -0.02, x2: 0, y2: 0.005, z2: 0},
              center: {x: 0, y: 0, z: 0, x2: 0, y2: 0, z2: 0}
            }
          }
        },
        camera: {
          position: {x: 40, y: -305.0573302931556, z: -176.2810417210021},
          rotation: {x: 2.094778817564933, y: 0.11304655916704225, z: -2.9488045979781217}
        },
        particles: {
          position: {x: -20, y: 62.67200000000026, z: 77.36300000000016},
          rotation: {x: 1.5, y: 4.53220881574775, z: 12.23706348383359}
        }
      }
    }
  ]
});
