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
    var sinon = this.sinon;

    sceneEl.setAttribute('firebase',
                         'apiKey: a; authDomain: b; databaseURL: c; storageBucket: d');
    system.sceneEl = sceneEl;

    sinon.stub(FirebaseWrapper.prototype, 'init', function () {});
    sinon.stub(FirebaseWrapper.prototype, 'getAllEntities', function () {
      return new Promise(function () {
        resolve({});
      });
    });
    sinon.stub(FirebaseWrapper.prototype, 'onEntityAdded', function () {});
    sinon.stub(FirebaseWrapper.prototype, 'onEntityChanged', function () {});
    sinon.stub(FirebaseWrapper.prototype, 'onEntityRemoved', function () {});
  });


  suite('init', function () {
    test('does not init Firebase without config', function () {
      var initSpy;
      var sceneEl = this.sceneEl;
      var system = this.system;

      FirebaseWrapper.prototype.init.restore();
      sceneEl.removeAttribute('firebase');
      initSpy = sinon.spy(FirebaseWrapper.prototype, 'init');
      system.init();
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
      var system = this.system;

      system.init();
      system.handleInitialSync({
        'entity:a': {id: 'a', position: '1 1 1'},
        'entity:b': {id: 'b', rotation: '90 90 90'}
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
      var system = this.system;

      system.init();
      system.entities['entity:a'] = document.createElement('a-entity');
      system.handleInitialSync({'entity:a': {id: 'a', position: '1 1 1'}});

      process.nextTick(function () {
        assert.notOk(sceneEl.querySelector('#a'));
        done();
      });
    });
  });

  suite('handleEntityAdded', function () {
    test('adds entity', function (done) {
      var sceneEl = this.sceneEl;
      var system = this.system;

      system.init();
      system.handleEntityAdded('entity:a', {id: 'a', material: {color: 'red'}});

      process.nextTick(function () {
        var entityA = sceneEl.querySelector('#a');
        assert.equal(system.entities['entity:a'], entityA);
        assert.equal(entityA.getAttribute('material').color, 'red');
        done();
      });
    });

    test('does not re-add entity if already added', function (done) {
      var sceneEl = this.sceneEl;
      var system = this.system;

      system.init();
      system.entities['entity:a'] = document.createElement('a-entity');
      system.handleEntityAdded('entity:a', {id: 'a'});

      process.nextTick(function () {
        assert.notOk(sceneEl.querySelector('#a'));
        done();
      });
    });

    test('does not re-add entity if already broadcasting', function (done) {
      var sceneEl = this.sceneEl;
      var system = this.system;

      system.init();
      system.broadcastingEntities['entity:a'] = document.createElement('a-entity');
      system.handleEntityAdded('entity:a', {id: 'a'});

      process.nextTick(function () {
        assert.notOk(sceneEl.querySelector('#a'));
        done();
      });
    });

    test('can add child entities', function (done) {
      var sceneEl = this.sceneEl;
      var system = this.system;

      var parentEntity  = document.createElement('a-entity');
      parentEntity.setAttribute('id', 'parent');
      sceneEl.appendChild(parentEntity);

      system.init();
      system.handleEntityAdded('entity:child', {
        id: 'child',
        parentId: 'parent',
        mixin: 'b'
      });

      process.nextTick(function () {
        assert.equal(parentEntity.querySelector('#child').getAttribute('mixin', 'b'));
        done();
      });
    });
  });
});
