var AFRAME = require('aframe');
require('../index');
var FirebaseWrapper = require('../firebaseWrapper');

/**
 * Tests rely on FirebaseWrapper, which abstracts away communicating with Firebase.
 * We use Sinon to stub and spy the FirebaseWrapper for testing the Firebase system.
 * By default, we stub all the FirebaseWrapper methods.
 * When we want to assert, we restore thse stubs and add a test stub.
 */
suite('firebase system', function () {
  setup(function () {
    var sceneEl = this.sceneEl = document.createElement('a-scene');
    var system = this.system = sceneEl.systems.firebase;
    sceneEl.setAttribute('firebase',
                         'apiKey: a; authDomain: b; databaseURL: c; storageBucket: d');
    system.sceneEl = sceneEl;

    this.sinon.stub(FirebaseWrapper.prototype, 'init', function () {});
    this.sinon.stub(FirebaseWrapper.prototype, 'getAllEntities', function () {
      return new Promise(function () {
        resolve({});
      });
    });
    this.sinon.stub(FirebaseWrapper.prototype, 'onEntityAdded', function () {});
    this.sinon.stub(FirebaseWrapper.prototype, 'onEntityChanged', function () {});
    this.sinon.stub(FirebaseWrapper.prototype, 'onEntityRemoved', function () {});
  });


  suite('init', function () {
    test('does not init Firebase without config', function () {
      FirebaseWrapper.prototype.init.restore();
      this.sceneEl.removeAttribute('firebase');
      var initSpy = this.sinon.spy(FirebaseWrapper.prototype, 'init');
      this.system.init();
      assert.notOk(initSpy.called);
    });

    test('inits Firebase with config', function (done) {
      FirebaseWrapper.prototype.init.restore();
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

  suite('handleInitialSync', function () {
    test('inserts entities read from database', function (done) {
      var sceneEl = this.sceneEl;
      this.system.init();
      this.system.handleInitialSync({
        entityA: {id: 'a', position: '1 1 1'},
        entityB: {id: 'b', rotation: '90 90 90'}
      });

      process.nextTick(function () {
        var entityA = sceneEl.querySelector('#a');
        var entityB = sceneEl.querySelector('#b');
        assert.equal(entityA.getAttribute('position').x, 1);
        assert.equal(entityB.getAttribute('rotation').x, 90);
        done();
      });
    });

    test('does not re-add entity', function (done) {
      var sceneEl = this.sceneEl;
      this.system.init();
      this.system.entities['entityA'] = document.createElement('a-entity');
      this.system.handleInitialSync({entityA: {id: 'a', position: '1 1 1'}});

      process.nextTick(function () {
        assert.notOk(sceneEl.querySelector('#a'));
        done();
      });
    });
  });
});
