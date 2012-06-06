// A node.js socket.io server which implements some of the G+ Hangouts API.
//
// Events which this server emits:
// - welcome: { id: your_id#, users: [], state: {} }
// - participantsChanged: { users: [ { user: username, id: id# }, ... ] }
// - stateChanged: { state: { global state object } }
//
// Events which this server understands:
// - submitDelta: { delta: { k1: v1, k2: v2, ... }, deleteKeys: [ ... ] }

var EVENTS = {
  WELCOME: 'welcome',
  PARTICIPANTS_CHANGED: 'participantsChanged',
  STATE_CHANGED: 'stateChanged',
  SUBMIT_DELTA: 'submitDelta'
};

var express = require('express'),
    io      = require('socket.io');

var app = express.createServer();
var io = io.listen(app);

app.configure(function() {
  app.use(express.static(__dirname + '/..'));
});

app.listen(8080);

var DEFAULT_PHOTO = 'https://lh5.googleusercontent.com/-_om-59NoFH8/AAAAAAAAAAI/AAAAAAAAAAA/0fcwDv4LZ-M/s48-c-k/photo.jpg';
var num_users = 0;
var users = [
  { id: 1234, displayName: 'Dan Vanderkam', image: { url: DEFAULT_PHOTO } },
  { id: 2345, displayName: 'Rocky Gulliver', image: { url: DEFAULT_PHOTO } },
  { id: 3456, displayName: 'Raven Keller', image: { url: DEFAULT_PHOTO } },
  { id: 4567, displayName: 'Kenny Leftin', image: { url: DEFAULT_PHOTO } },
  { id: 5678, displayName: 'Jossie Ivanov', image: { url: DEFAULT_PHOTO } },
  { id: 6789, displayName: 'Alastair Tse', image: { url: DEFAULT_PHOTO } }
  // TODO(danvk): add more
];

// Returns a { id: id#, displayName: "User Name", ... } object.
function makeUpUser() {
  var user = users[num_users % users.length];
  var displayIndex = num_users;
  num_users++;
  return {
    id: 'x' + user.id,  // per-hangout id
    displayIndex: displayIndex,
    hasAppEnabled: true,
    hasMicrophone: false,
    hasCamera: false,
    person: user
  };
}

// This is the unified state object which is synchronized across clients.
var global_state = { };

// Current list of enabled users.
var current_users = [ ];

io.sockets.on('connection', function(socket) {
  var user = makeUpUser();
  current_users.push(user);

  // Tell the user who they are and give them the lay of the land.
  socket.emit(EVENTS.WELCOME, {
    id: user.id,
    state: global_state,
    users: current_users
  } );

  // Let everyone else know that someone has joined.
  socket.broadcast.emit(EVENTS.PARTICIPANTS_CHANGED, { users: current_users });

  socket.on('disconnect', function() {
    var idx = current_users.indexOf(user);
    current_users.splice(idx, 1);
    socket.broadcast.emit(EVENTS.PARTICIPANTS_CHANGED, { users: current_users });
  });

  socket.on(EVENTS.SUBMIT_DELTA, function(data) {
    if (data.delta) {
      for (var k in data.delta) {
        global_state[k] = data.delta[k];
      }
    }
    if (data.deleteKeys) {
      for (var i = 0; i < data.deleteKeys.length; i++) {
        delete global_state[data.deleteKeys[i]];
      }
    }

    socket.broadcast.emit(EVENTS.STATE_CHANGED, { state: global_state });
    socket.emit(EVENTS.STATE_CHANGED, { state: global_state });
  });
});
