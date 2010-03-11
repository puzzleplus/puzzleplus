// Functions for binding the lmnopuz JS to Wave.

function $(id) { return document.getElementById(id); }

function makeCrossword() {
  var state = wave.getState();
  if (!state) return;

  var crossword = state.get("crossword", null);
  if (crossword) {
    Crossword = parsePuz(crossword);
    if (!Crossword) {
      console.log("couldn't parse crossword");
      return;
    }
    Globals = {
    };

    var page_title = "lmnopuz";
    if (Crossword.title) page_title += " - " + Crossword.title;

    // TODO(danvk): focus box's color should be same as player's color.
    Globals.focusbox = new FocusBox('blue', 3 /* width */ , 4 /* z-index */);

    Globals.widget = new CrosswordWidget;
    Globals.widget.onChanged = function(x,y,let) { updateWave(x, y, let); };
    $('crossword').appendChild(Globals.widget.loadCrossword(Crossword));

    Globals.console = new Console(3,
                                  false);
    $('console').appendChild(Globals.console.container);

    Globals.console.write(
        "Welcome to lmnopuz! " +
        "lmnopuz has many nifty shortcut keys that you can learn about by " +
        " clicking the \"Help\" link in the upper right corner.");

    Globals.clues = new CluesUI(Crossword);
    $('clues').appendChild(Globals.clues.container);

    // user -> color
    Globals.user_colors = {};

    handleResize();

    // We need to wait to set focus until the table has been rendered (so
    // that the offset stuff works) and until the clues have been created (so
    // that the initial ones will be highlighted).  This kinda sucks.
    Globals.widget.setFocus(Globals.widget.square(0, 0));
    $('crossword_container').style.display = 'block';
    $('upload').style.display = 'none';
  } else {
    $('upload').style.display = 'block';
  }
}

function handleResize() {
  Globals.clues.setHeight($('crossword_container').childNodes[0].clientHeight);

  // Make the width of the console/roster table match that of the
  // crossword/clues table.
  $('bottomtable').style.width = $('toptable').clientWidth;

  Globals.console.scrollToBottom();
}

function addPuzToWave() {
  var input = document.getElementById("puz");
  var files = input.files;
  if (files.length != 1) {
    Globals.console.write("Need to upload a file!");
    return;
  }

  var reader = new FileReader();
  reader.onloadend = function(e) {
    var state = wave.getState();
    var crossword = state.get("crossword", null);
    if (crossword) {
      Globals.console.write("Tried to add a second puz file!");
      return;
    }

    puz = parsePuz(e.target.result);
    if (!puz) {
      Globals.console.write("Couldn't parse puz file!");
      return;
    }

    // Wave can only store string -> string maps, so it's easiest to submit the
    // binary .puz file to the wave.
    state.submitDelta( { crossword: e.target.result } );
  };

  reader.readAsBinaryString(files[0]);
}

function updateWave(x, y, let) {
  if (wave) {
    var k = "" + x + "," + y;
    var delta = {};
    delta[k] = let + "\t" + wave.getViewer().getId();
    wave.getState().submitDelta(delta);
    // Globals.console.write("delta: {" + x + "," + y + ": " + let + "}");
  }
}

function stateUpdated() {
  var state = wave.getState();
  if (typeof(Crossword) == 'undefined') {
    makeCrossword();
  }

  if (state.get("crossword", null)) {
    var keys = state.getKeys();
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.substr(0, 1) != "@") {
        // must be a cell: "x,y" -> "letter,user@domain.com"
        var xy = k.split(",");
        if (xy.length != 2) continue;
        var x = parseInt(xy[0]);
        var y = parseInt(xy[1]);
        if (isNaN(x) || isNaN(y)) continue;
        var square = Globals.widget.square(x, y);
        if (!square) continue;

        var letter_user = state.get(k).split("\t");
        if (letter_user.length != 2) continue;
        var letter = letter_user[0];
        var user = letter_user[1];

        var color = Globals.user_colors[user];
        if (!color) {
          color = '#dddddd';
        }

        square.fill(letter, color, false);
      } else {
        // must be a user: "@user@domain.com" -> "#abcdef"
        Globals.user_colors[k.substr(1)] = state.get(k);
      }
    }

    var participants = wave.getParticipants();
    if (participants) {
      var numPeople = participants.length;
      var me = wave.getViewer().getId();
      if (!Globals.user_colors[me]) {
        // Assign a color to ourself.
        // TODO(danvk): generate more colors.
        var colors = ["#eea", "#fcb", "#cfc", "#adf", "#ebf"];

        // Which particpant number are we?
        var count = 0;
        for (var x in Global.user_colors) { count++; }
        var my_color = colors[count % colors.length];
        var delta = {};
        delta["@" + me] = my_color;
        state.submitDelta(delta);
        if (console) {
          console.log("setting my color to: " + my_color);
        }
      }
    }
  }
}
