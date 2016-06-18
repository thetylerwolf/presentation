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
  setup(function (done) {
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

    document.body.appendChild(sceneEl);
    sceneEl.addEventListener('loaded', function () {
      done();
    });
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

    test('can add entities to specified parents', function (done) {
      var sceneEl = this.sceneEl;
      var system = this.system;
      var parentEntity  = document.createElement('a-entity');

      system.init();
      system.entities['entity:parent'] = parentEntity;
      system.handleEntityAdded('entity:child', {
        id: 'child',
        parentId: 'entity:parent'
      });

      setTimeout(function () {
        assert.ok(parentEntity.querySelector('#child'));
        done();
      });
    });

    test('can add nested entities', function (done) {
      var sceneEl = this.sceneEl;
      var system = this.system;

      system.init();
      system.handleEntityAdded('entity:a', {
        id: 'entity-A'
      });
      system.handleEntityAdded('entity:b', {
        id: 'entity-B',
        parentId: 'entity:a'
      });

      setTimeout(function () {
        var entityA = sceneEl.querySelector('#entity-A');
        assert.ok(entityA.querySelector('#entity-B'));
        done();
      });
    });

    test('does not setAttribute with parentId', function (done) {
      var sceneEl = this.sceneEl;
      var system = this.system;

      system.init();
      system.handleEntityAdded('entity:a', {
        id: 'entity-A',
        parentId: 'xxx'
      });

      setTimeout(function () {
        assert.notOk(sceneEl.querySelector('#entity-A').getAttribute('parentId'));
        done();
      });
    });
  });

  suite('handleEntityChanged', function () {
    test('updates entity', function () {
      var system = this.system;
      var entityA = document.createElement('a-entity');

      system.init();
      system.entities['entity:a'] = entityA;
      system.handleEntityChanged('entity:a', {position: '1 1 1'});

      assert.equal(entityA.getAttribute('position').x, 1);
    });

    test('does not update entity if broadcasting', function () {
      var sceneEl = this.sceneEl;
      var system = this.system;
      var entityA = document.createElement('a-entity');
      entityA.setAttribute('position', '0 0 0');

      system.init();
      system.broadcastingEntities['entity:a'] = entityA;
      system.handleEntityChanged('entity:a', {position: '1 1 1'});

      assert.equal(entityA.getAttribute('position').x, 0);
    });
  });
});
