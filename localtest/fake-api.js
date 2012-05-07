// This defines a fake, local implementation of gapi.hangout.
// This allows lmnopuz to be tested locally using the same JS as in production.

// Methods/Properties of gapi that are used:
// gapi.hangout.data
// gapi.hangout.data.getKeys();
// gapi.hangout.data.getState();
// gapi.hangout.data.getValue();
// gapi.hangout.data.onStateChanged.add();
// gapi.hangout.data.submitDelta();
// gapi.hangout.getParticipantById();
// gapi.hangout.getParticipantId();
// gapi.hangout.onApiReady.add()

var pageHasLoaded = false;
var initFns = [];
document.addEventListener('DOMContentLoaded', function() {
  pageHasLoaded = true;
  for (var i = 0; i < initFns.length; i++) {
    initFns[i]();
  }
});

var gadgets = (function() {
  return {
    util: {
      registerOnLoadHandler: function(fn) {
        if (!pageHasLoaded) {
          initFns.push(fn);
        } else {
          fn();
        }
      }
    },

    window: {
      adjustHeight: function(height) {
        // This does something in iGoogle but is a no-op in Google+ Hangouts.
      }
    }
  }
})();

var gapi = (function() {
  var state = {};
  var users = {};
  var stateChangeFns = [];
  var apiReadyFns = [];

  gadgets.util.registerOnLoadHandler(function() {
    var obj = {
      isApiReady: true
    };

    // Give other onload event handlers a change to run and possibly register
    // their own apiReadyFns.
    setTimeout(function() {
      for (var i = 0; i < apiReadyFns.length; i++) {
        apiReadyFns[i](obj);
      }
    }, 100);
  });

  return {
    hangout: {
      data: {
        getKeys: function() {
          var keys = [];
          for (var k in state) {
            keys.push(k);
          }
          return keys;
        },

        getState: function() {
          var copy = {};
          for (var k in state) {
            copy[k] = state[k];
          }
          return copy;
        },

        getValue: function(key) {
          return state[key];
        },

        submitDelta: function(delta, keys_to_delete) {
          // TODO(danvk): implement keys_to_delete if I use it.
          for (var k in delta) {
            state[k] = delta[k];
          }
          for (var i = 0; i < stateChangeFns.length; i++) {
            stateChangeFns[i]();
          }
        },

        onStateChanged: {
          add: function(fn) {
            stateChangeFns.push(fn);
          }
        }
      },

      getParticipantId: function() {
        return '123ABC';
      },

      getParticipantById: function(id) {
        return {
          '123ABC': {
            person: {
              id: '4567890123',
              displayName: 'John Doe'
            }
          }
        }[id];
      },

      onApiReady: {
        add: function(fn) {
          apiReadyFns.push(fn);
        }
      }
    }
  }
})();
