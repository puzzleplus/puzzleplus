// Functions for binding the lmnopuz JS to Wave.

function $(id) { return document.getElementById(id); }

// Detect whether the browser supports the HTML5 File API.
function supportsUpload() {
  try {
    var f = new FileReader;
    return true;
  } catch (e) {
    return false;
  }
}

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
    Globals.cluebox = $('current_clue');

    Globals.console.write(
        "Welcome to lmnopuz! " +
        "lmnopuz has many nifty shortcut keys that you can learn about by " +
        " clicking the \"Help\" link in the upper right corner.");

    Globals.clues = new CluesUI(Crossword);

    // user -> color
    Globals.user_colors = {};
    Globals.has_typed = false;

    // We need to wait to set focus until the table has been rendered (so
    // that the offset stuff works) and until the clues have been created (so
    // that the initial ones will be highlighted).  This kinda sucks.
    Globals.widget.setFocus(Globals.widget.square(0, 0));
    $('crossword_container').style.display = 'block';
    $('upload').style.display = 'none';

    // NOTE: we call adjustHeight here, before appending the clues box, to work
    // around a bug in how wave computes the height of the gadget in
    // Webkit-based browsers.
    gadgets.window.adjustHeight();
    $('clues').appendChild(Globals.clues.container);
    handleResize();
  } else {
    $('upload').style.display = 'block';
    gadgets.window.adjustHeight();
  }
}

function handleResize() {
  var clue_height = $('crossword').childNodes[0].clientHeight +
                    $('current_clue').offsetHeight;
  Globals.clues.setHeight(clue_height);

  // Make the width of the console/roster table match that of the
  // crossword/clues table.
  $('bottomtable').style.width = $('toptable').clientWidth;

  if (Globals.cluebox) {
    Globals.cluebox.style.width = $('crossword').childNodes[0].clientWidth + "px";
  }


  Globals.console.scrollToBottom();
}

function addPuzToWave(files) {
  if (files.length != 1) {
    Globals.console.write("Need to upload one puz file!");
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

function addBuiltInPuzToWave(puz_file) {
  state.submitDelta( { crossword: puz_file } );
}

// Returns a color for the current user. If the user does not have a color, one
// will be assigned and sent along to the other participants in the wave. It is
// posible that this color will change later, if there is a conflict with
// another user.
function getMyColor() {
  if (!wave) return '#dddddd';

  var state = wave.getState();
  if (!state) return '#dddddd';

  // This is what we think our color is.
  // It's possible that someone else has stolen it from us.
  var my_color = Globals.my_color;

  var me = wave.getViewer().getId();
  if (!my_color || state.get("@" + my_color) != me) {
    // Either we haven't assigned ourselves a color yet or someone stolen this
    // color from us. In either case, assign ourselves a new one.
    var count = 0;
    for (var x in Globals.user_colors) { count++; }
    var color = RandomLightColor(count);
    var delta = {};
    delta["@" + color] = me;
    state.submitDelta(delta);
    Globals.my_color = color;
    if (console) console.log("Assigning self color #" + count + ": " + color);
  }
  return Globals.my_color;
}

function updateWave(x, y, let) {
  if (wave) {
    var k = "" + x + "," + y;
    var delta = {};
    delta[k] = let + "\t" + wave.getViewer().getId();
    getMyColor();  // make sure we have a color assigned to us.
    wave.getState().submitDelta(delta);
    Globals.has_typed = true;
    // Globals.console.write("delta: {" + x + "," + y + ": " + let + "}");
  }
}

function stateUpdated() {
  var state = wave.getState();
  if (typeof(Crossword) == 'undefined') {
    makeCrossword();
  }

  if (state && state.get("crossword", null)) {
    var me = wave.getViewer().getId();
    var keys = state.getKeys();

    // Make two passes through the state: one for the colors, one for the cells.
    Globals.my_color = null;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.substr(0, 1) != "@") continue;
      // must be a user color: "@color" -> "user@domain.com"
      var color = k.substr(1);
      var user = state.get(k);
      Globals.user_colors[user] = color;
      if (user == me) {
        Globals.my_color = color;
      }
    }

    // Pass two: cells on the grid.
    var any_from_me = false;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.substr(0, 1) == "@") continue;

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

      // TODO(danvk): keep an inverted copy of this map.
      var color = Globals.user_colors[user];
      if (!color) {
        color = '#dddddd';
      }

      var isGuess = (letter != letter.toUpperCase());
      square.fill(letter.toUpperCase(), color, isGuess);

      if (user == me) any_from_me = true;
    }

    if ((Globals.has_typed || any_from_me) && !(Globals.my_color)) {
      // The was probably a race condition and someone stole our color.
      // Assign ourselves a new one.
      getMyColor();
    }
    gadgets.window.adjustHeight();
  }
}
