// A tiny chat server to test out comet/dangling gets in node.js.

var express = require('express'),
    io      = require('socket.io');


var app = express.createServer();
var io = io.listen(app);

app.configure(function() {
  app.use(express.static(__dirname + '/static'));
});


app.listen(8080);

// Broadcasts a message and sends it to ourself as well.
function broadcast_self(socket, msg_name, data) {
  socket.broadcast.emit(msg_name, data);
  socket.emit(msg_name, data);
}

var num_users = 0;
var usernames = [ 'Dan Vanderkam', 'Rocky Gulliver', 'Raven Keller', 'Kenny Leftin', 'Jossie Ivanov', 'Alastair Tse' ];
function make_up_username() {
  var user = usernames[num_users % usernames.length];
  num_users++;
  return user;
}

io.sockets.on('connection', function(socket) {
  var nickname = make_up_username();

  // Announce ourselves.
  socket.broadcast.emit('new_user', { user: nickname });
  socket.emit('my_name_is', { user: nickname });

  socket.on('chat', function(data) {
    broadcast_self(socket, 'chat', { user: nickname, message: data.message });
  });

  socket.on('disconnect', function () {
    broadcast_self(socket, 'lost_user', { user: nickname });
  });
});
