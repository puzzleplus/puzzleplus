var VotesUI = (function() {
'use strict';

/**
 * UI for casting votes & displaying pending votes.
 * @constructor
 */
function VotesUI(votes) {
  this.votes = votes;
  this.container = document.createElement('div');

  el('check-all').onclick = function() {
    Globals.votes.vote('check,all', getMyId());
  };
  el('check-word').onclick = function() {
    var w = Globals.widget,
        num = w.getNumber(w.focused, w.direction_horiz),
        clue = num + (w.direction_horiz ? 'A' : 'D');
    Globals.votes.vote('check,' + clue, getMyId());
  };
  el('check-square').onclick = function() {
    var sq = Globals.widget.focused;
    var pos = sq.x + ',' + sq.y;
    Globals.votes.vote('check,' + pos, getMyId());
  };

  this.pendingVotes = document.createElement('div');
  this.pendingVotes.addEventListener('click', this.handleClick.bind(this));
  this.container.appendChild(this.pendingVotes);

  // TODO: use a real event registration system for these.
  this.votes.onVoteSucceeded = function(voteKey) {
    if (voteKey.slice(0, 6) == 'check,') {
      Globals.widget.check(voteKey.slice(6));
    }
    this.update();
  }.bind(this);
  this.votes.onVoteCountdown = this.update.bind(this);
  this.votes.onVoteChanged = this.update.bind(this);
}

// Returns a human-readable version of the vote key, e.g.
// 'check,52A' --> 'check 52A'
function voteString(voteKey) {
  if (voteKey.slice(0, 6) == 'check,') {
    var k = voteKey.slice(6);
    if (k == 'all') {
      return 'Check All';
    } else if (k.indexOf(',') >= 0) {
      // it's a cell: "Check 2,0"
      // TODO: highlight this cell visibly.
      return 'Check ' + k;
    } else {
      // it's a word: "Check 52A"
      return 'Check ' + k;
    }
  } else {
    throw 'Unknown vote type: ' + voteKey;
  }
}

function getPendingVoteHtml(vote, voteKey, userIds) {
  var elapsedTimeMs = Date.now() - vote.firstSeenMs,
      remainingTimeMs = Math.max(0, Votes.VOTE_DURATION_MS - elapsedTimeMs),
      hasApproved = _.contains(vote.yeas, getMyId()),
      missingApprovals = _.difference(userIds, vote.yeas);

  var userMap = _.object(gapi.hangout.getParticipants().map(function(user) {
    return [user.person.id, user.person.displayName];
  }));
  userMap[getMyId()] = '<b>You</b>';

  var makeNamesList = function(userIds) {
    var userNames = userIds.map(function(id) { return userMap[id]; });
    if (userNames.length <= 1) return userNames.join('');

    return userNames.slice(0, -2).join(', ') + ' and ' + userNames[userNames.length - 1];
  };

  var approversText = makeNamesList(vote.yeas),
      missingText = makeNamesList(missingApprovals),
      voteText = voteString(voteKey),
      html = '<p class="pending-vote">' +
          approversText + ' would like to ' + voteText + '.<br>' +
          'Need approval from ' + missingText +
          ' in the next <b>' + Math.floor(remainingTimeMs/1000) + '</b>s.' +
          (hasApproved ? '' : '<br><a data-voteKey="' + voteKey + '" href="#">' +
                              'Make it so!</a>') + '</p>';
  return html;
}

// This might be a click on a "vote" link.
VotesUI.prototype.handleClick = function(e) {
  if (e.target.tagName == 'A' && e.target.hasAttribute('data-voteKey')) {
    e.preventDefault();
    Globals.votes.vote(e.target.getAttribute('data-voteKey'), getMyId());
  }
};

// Something about the votes has changed. Re-render the pending votes list.
VotesUI.prototype.update = function() {
  this.pendingVotes.innerHTML = _.map(this.votes.votes, function(vote, voteKey) {
    return getPendingVoteHtml(vote, voteKey, Globals.votes.userIds);
  }).join('<hr>');
};

return VotesUI;
})();
