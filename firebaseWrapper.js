require('firebase');
var parse = require('url-parse');

var channelQueryParam = parse(location.href, true).query['aframe-firebase-channel'];

function Firebase (config) {
  this.channel = channelQueryParam || config.channel || 'default';
  this.firebase = firebase.initializeApp(config);
  var database = this.database = firebase.database().ref(this.channel);

  this.getAllEntities = function () {
    return new Promise(function (resolve) {
      database.child('entities').once('value', function (snapshot) {
        resolve(snapshot.val() || {});
      });
    });
  };

  this.onEntityAdded = function (handler) {
    database.child('entities').on('child_added', function (data) {
      handler(data.key, data.val());
    });
  };

  this.onEntityChanged = function (handler) {
    database.child('entities').on('child_changed', function (data) {
      handler(data.key, data.val());
    });
  };

  this.onEntityRemoved = function (handler) {
    database.child('entities').on('child_removed', function (data) {
      handler(data.key);
    });
  };

  this.removeEntityOnDisconnect = function (id) {
    database.child('entities').child(id).onDisconnect().remove();
  };

  this.createEntity = function () {
    return database.child('entities').push().key;
  };

  this.updateEntity = function (id, data) {
    database.child('entities/' + id).update(data);
  };
}

module.exports = Firebase;
