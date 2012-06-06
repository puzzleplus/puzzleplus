// A node.js socket.io server which implements some of the G+ Hangouts API.
//
// Events which this server emits:
// - youAre: { user: username, id: id# }
// - participantsChanged: { users: [ { user: username, id: id# }, ... ] }
// - stateChanged: { state: { global state object } }
//
// Events which this server understands:
// - submitDelta: { delta: { k1: v1, k2: v2, ... }, deleteKeys: [ ... ] }

var EVENTS = {
  YOU_ARE: 'youAre',
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

var num_users = 0;
var users = [
  { id: 1234, displayName: 'Dan Vanderkam', imageUrl: '' },
  { id: 2345, displayName: 'Rocky Gulliver', imageUrl: '' },
  { id: 3456, displayName: 'Raven Keller', imageUrl: '' },
  { id: 4567, displayName: 'Kenny Leftin', imageUrl: '' },
  { id: 5678, displayName: 'Jossie Ivanov', imageUrl: '' },
  { id: 6789, displayName: 'Alastair Tse', imageUrl: '' }
  // TODO(danvk): add more
];

// Returns a { id: id#, displayName: "User Name", ... } object.
function makeUpUser() {
  var user = users[num_users % users.length];
  num_users++;
  return user;
}

// This is the unified state object which is synchronized across clients.
var global_state = { };

// Current list of enabled users.
var current_users = [ ];

io.sockets.on('connection', function(socket) {
  var user = make_up_user();
  current_users.push(user);

  // Tell the user who they are and give them the lay of the land.
  // TODO(danvk): does the G+ API call participantsChanged and stateChanged?
  socket.emit(EVENTS.YOU_ARE, user);
  socket.emit(EVENTS.PARTICIPANTS_CHANGED, current_users);
  socket.emit(EVENTS.STATE_CHANGED, global_state);

  // Let everyone else know that someone has joined.
  socket.broadcast(EVENTS.PARTICIPANTS_CHANGED, current_users);

  socket.on('disconnect', function() {
    var idx = current_users.indexOf(user);
    current_users.splice(idx, 1);
    socket.broadcast(EVENTS.PARTICIPANTS_CHANGED, current_users);
  });

  socket.on(EVENTS.SUBMIT_DELTA, function(data) {
    for (var k in data.delta) {
      global_state[k] = data.delta[k];
    }
    for (var i = 0; i < data.deleteKeys.length; i++) {
      delete global_state[data.deleteKeys[i]];
    }

    // TODO(danvk): socket.emit(EVENTS.STATE_CHANGED) as well?
    socket.broadcast.emit(EVENTS.STATE_CHANGED, global_state);
  });
});
