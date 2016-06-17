var AFRAME = require('aframe');
require('../index');
var FirebaseWrapper = require('../firebaseWrapper');

suite('firebase system', function () {
  setup(function () {
    var sceneEl = document.createElement('a-scene');
    var system = this.system = new AFRAME.systems.firebase();
    sceneEl.setAttribute('firebase',
                         'apiKey: a; authDomain: b; databaseURL: c; storageBucket: d');
    system.sceneEl = sceneEl;
  });


  test('calls init with Firebase config', function (done) {
    this.sinon.stub(FirebaseWrapper.prototype, 'init', function (config) {
      assert.equal(config.apiKey, 'a');
      assert.equal(config.authDomain, 'b');
      assert.equal(config.databaseURL, 'c');
      assert.equal(config.storageBucket, 'd');
      done();
    });
    this.system.init();
  });
});
