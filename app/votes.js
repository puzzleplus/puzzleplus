var Votes = (function() {
'use strict';

/**
 * This class tracks pending votes and determines when votes have succeeded or
 * timed out.
 * It posts updates directly to gapi.hangout.data.
 * Call update() when the hangout state has changed.
 * It has three event listeners:
 * - onVoteSucceeded: a vote passed unanimously. Take action accordingly.
 * - onVoteCountdown: time has ticked and there's a pending vote.
 * - onVoteChanged: there's a new pending vote, or a vote was resolved.
 * @constructor
 */
var Votes = function() {
  this.votes = {};  // vote key --> { yeas: [id1, id2, ...], firstSeenMs: 123 }
  this.userIds = [];
  this.timerId = window.setInterval(this.tick.bind(this), 1000);

  // TODO: use a better event dispatch system, e.g. backbone.js
  this.onVoteSucceeded = function(voteKey) {
    // This gets fired when _this user_ made the vote succeed.
    // It typically only fires for one user, not for all users.
    // It _may_ fire for multiple users under unusual circumstances, e.g. if
    // the last remaining holdout leaves the hangout.
    // console.log('vote succeeded!', voteKey);
  };
  this.onVoteCountdown = function() {
    // console.log('countdown', this.votes);
  };
  this.onVoteChanged = function() {
    // console.log('votes changed', this.votes);
  };
};

Votes.VOTE_DURATION_MS = 30000;  // 30s

// Update the Votes list to reflect new state.
Votes.prototype.update = function(keys, state) {
  var votes = {};
  keys.forEach(function(k) {
    var m = k.match(/^v,(.*),(\d+)$/);
    if (!m) return;

    var voteKey = m[1],
        playerId = m[2];

    if (!(voteKey in votes)) {
      // TODO: check state metadata to see how old this vote really is.
      // If you join the hangout mid-vote, this could be quite incorrect.
      votes[voteKey] = {yeas: [], firstSeenMs: Date.now()};
    }

    votes[voteKey].yeas.push(parseInt(playerId, 0));
  });

  // New votes blast away old votes, except for the first seen time.  If a vote
  // disappears, that's fine -- it must have been fulfilled or timed out.
  for (var k in votes) {
    var oldVote = this.votes[k];
    if (oldVote) {
      votes[k].firstSeenMs = oldVote.firstSeenMs;
    }
    votes[k].yeas.sort();
  }
  var changed = !_.isEqual(votes, this.votes);
  this.votes = votes;

  if (changed) {
    this.onVoteChanged();
  }
};

// The roster may have changed -- check for newly fulfilled votes.
Votes.prototype.updateUsers = function(users) {
  var newUserIds = _.pluck(users, 'id');
  if (_.union(this.userIds, newUserIds).length != this.userIds.length) {
    this.userIds = newUserIds;
    this.checkForFulfilledVotes();
  }
};

// Time has elapsed. Check for expired votes.
Votes.prototype.tick = function() {
  var any = !_.isEmpty(this.votes);
  var nowMs = Date.now();
  _(this.votes).each(function(vote, voteKey) {
    if (nowMs - vote.firstSeenMs > Votes.VOTE_DURATION_MS) {
      // It's expired -- kill it!
      this.deleteVote(voteKey);
      // No notification that a vote failed.
    }
  }.bind(this));

  if (any) {
    this.onVoteCountdown();
  }
};

// this is a bit of an edge case -- perhaps the lone holdout left the hangout?
Votes.prototype.checkForFulfilledVotes = function() {
  _(this.votes).each(function(vote, voteKey) {
    if (_.difference(this.userIds, vote.yeas).length == 0) {
      this.voteSucceeded(voteKey);
    }
  }.bind(this));
};


function makeKey(voteKey, playerId) {
  return 'v,' + voteKey + ',' + playerId;
}


// A vote has either succeeded or failed. Remove all keys relating to it from
// the Hangout state.
Votes.prototype.deleteVote = function(voteKey) {
  if (!this.votes[voteKey]) return;
  var keysToDelete = this.votes[voteKey].yeas.map(function(playerId) {
    return makeKey(voteKey, playerId);
  });
  gapi.hangout.data.submitDelta({}, keysToDelete);
};

Votes.prototype.voteSucceeded = function(voteKey) {
  this.deleteVote(voteKey);
  this.onVoteSucceeded(voteKey);
};

function isLastVote(playerId, previousVotes, users) {
  var missingVotes = _.difference(users, previousVotes, [playerId]);
  return (missingVotes.length == 0);
}

/**
 * The player approves a vote.
 * This can either create a new vote or approve an existing one.
 */
Votes.prototype.vote = function(voteKey, playerId) {
  // Check if we're the last vote.
  // This could even happen if we're the first vote, if it's a solo hangout.
  var yeas = [];
  if (this.votes[voteKey]) {
    yeas = this.votes[voteKey].yeas;
  }
  if (isLastVote(playerId, yeas, this.userIds)) {
    this.voteSucceeded(voteKey);
    return;
  }

  var o = {};
  o[makeKey(voteKey, playerId)] = '1';
  gapi.hangout.data.submitDelta(o);
};

return Votes;
})();
