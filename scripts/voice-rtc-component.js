AFRAME.registerSystem('voice-rtc', {
  schema: {
    publish_key: {type: 'string'},
    subscribe_key: {type: 'string'}
  },

  init: function() {
    this.supported =
        window.RTCPeerConnection    ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection;
  },

  login: function(id, el) {
    // var id = this.id = document.querySelector('firebase-broadcast');
    if(!this.supported) {
      console.log('webRTC not supported')
      return;
    }
    console.log(id);
    var self = this;
    var config = this.sceneEl.getAttribute('voice-rtc');
    // Voice only
    config.media = { audio: true, video: false };
    config.ssl = true;
    config.number = id;

    var phone = this.phone = PHONE(config);

    phone.ready(function(){
      console.log('phone ready');
      self.phoneReady = true;
    });

    phone.receive(function(session){
      // Fires whether call is made or received
      this.session = session;
      console.log('session', session);

      session.connected(function(session) {
        // TODO: Make it so that the audio element
        // attaches to the entity speaking

        console.log('connected');
      });

      session.ended(function(session) {
        // el.setAttribute('sound', 'src', '');
        console.log('disconnected');
      });

      console.log('call successful');
    });

    this.loggedIn = true;
    return this.loggedIn;

  },

  makeCall: function(id) {
    if(!this.supported) {
      return false;
    }

    var phone = this.phone;
    console.log('calling', id);
    phone.dial(id);

    return true;
  }
});

/**
 * Connect to pubnub and all peers
 */
AFRAME.registerComponent('voice-rtc-call', {
  dependencies: [],

  schema: {
    id: { type: 'string'},
    time: { type: 'string' }
  },

  init: function() {

  },

  update: function() {
    var data = this.data;
    var el = this.el;
    var firebase = el.sceneEl.systems.firebase;
    var system = el.sceneEl.systems['voice-rtc'];
    var isMe = el.getAttribute('firebase-broadcast');
    var isThem = el.getAttribute('voice-rtc-call');

    console.log(isThem);
    if(isMe && isMe.id) {
      console.log('me', isMe);
      id = isMe.id;
      data = id;

      if(!system.loggedIn) {
        system.login(id,el);
      }

    }
  },

  tick: function() {
    var el = this.el;
    var isReady = el.getAttribute('firebase-broadcast');
    var voiceEl = el.getAttribute('voice-rtc-call');
    var system = el.sceneEl.systems['voice-rtc'];

    if(isReady && isReady.id) {
      console.log('ready');

      system.joinTime = Date.now();

      el.setAttribute('voice-rtc-call', 'id', isReady.id);
      el.setAttribute('voice-rtc-call', 'time', system.joinTime);

      this.tick = function() {};
    } else if (system.phoneReady && voiceEl && voiceEl.id !== 'true') {
      console.log('them', voiceEl)

      if(voiceEl.time < system.joinTime) {
        system.makeCall(voiceEl.id);
      }

      this.tick = function() {};
    }
  }

});
