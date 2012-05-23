// Parses a .puz file into a javascript object.
// Need to populate:
// x copyright
// x author
// x title
// x height
// x down
// x width
// x numbers
// x answer
// x across
function parsePuz(puz) {
  var expected = 'ACROSS&DOWN\0';
  if (puz.substr(2, expected.length) != expected) {
    console.log("Failure! No ACROSS&DOWN");
    return null;
  }
  var c = {};
  c.checksum = puz.substr(0, 2);
  WIDTHOFFSET = 0x2c;   // :nodoc:
  HEADERLENGTH = 0x34;  // :nodoc:

  c.width = puz.charCodeAt(WIDTHOFFSET);
  c.height = puz.charCodeAt(WIDTHOFFSET + 1);
  c.cluecount = puz.charCodeAt(WIDTHOFFSET + 2);

  var ofs = HEADERLENGTH;
  var key = puz.substr(ofs, c.width * c.height);
  ofs += key.length;
  var dashes = puz.substr(ofs, c.width * c.height);
  ofs += dashes.length;

  // sometimes the comment contains nuls.
  // so we limit the split to clues + 3 headers + optional comment.
  var strings = puz.substr(ofs).split('\0', c.cluecount + 3 + 1);
  
  // figure out how much we read. The rest is extensions.
  for (var i = 0; i < strings.length; i++) {
    ofs += strings[i].length + 1;
  }

  // TODO(checksum)

  // XXX right here we should convert the strings to UTF-8.
  var clueoffset = ofs;
  c.title = strings[0];
  clueoffset += c.title.length + 1;
  c.author = strings[1];
  clueoffset += c.author.length + 1;
  c.copyright = strings[2];
  clueoffset += c.copyright.length + 1;
  strings = strings.slice(3);

  // Map from extension ID -> extension data.
  var extensions = {};
  while (ofs < puz.length - 8) {
    var name = puz.substr(ofs, 4);
    ofs += 4;
    var len_str = puz.substr(ofs, 2);
    ofs += 2;
    len = 256 * len_str.charCodeAt(1) + len_str.charCodeAt(0);
    var checksum = puz.substr(ofs, 2);
    ofs += 2;

    var data = puz.substr(ofs, len);
    ofs += len;
    ofs += 1;  // null terminator
    extensions[name] = data;
  }

  // TODO(danvk): something wonky here
  c.comment = "";
  if (strings.length > c.cluecount) {
    c.comment = strings.pop();
  }

  c.squares = [];
  for (var x = 0; x < c.width; x++) {
    var row = [];
    for (var y = 0; y < c.height; y++) {
      row.push(null);
    }
    c.squares.push(row);
  }
  for (var y = 0; y < c.height; y++) {
    for (var x = 0; x < c.width; x++) {
      var ch = key.substr(y * c.width + x, 1);
      if (ch != '.') {
        c.squares[x][y] = { 'char': ch };
      }
    }
  }

  var num = 1;
  for (var y = 0; y < c.height; y++) {
    for (var x = 0; x < c.width; x++) {
      var square = c.squares[x][y];
      if (!square) continue;

      // we're a numbered square if we're on an min extreme
      // and we have at least one square following...
      var down = false, across = false;
      if ((x == 0 || !c.squares[x-1][y]) &&
          (x+1 < c.width && c.squares[x+1][y])) {
        across = true;
      }

      if ((y == 0 || !c.squares[x][y-1]) &&
          (y+1 < c.height && c.squares[x][y+1])) {
        down = true;
      }

      if (down || across) {
        if (down) { square.down = num; }
        if (across) { square.across = num; }
        num += 1;
      }
    }
  }

  // Parse out the down/across clues.
  c.down = [];
  c.across = [];
  var n = 0;
  for (var y = 0; y < c.height; y++) {
    for (var x = 0; x < c.width; x++) {
      var square = c.squares[x][y];
      if (!square) continue;

      if (square.across) {
        c.across.push([square.across, strings[n]]);
        n += 1;
      }
      if (square.down) {
        c.down.push([square.down, strings[n]]);
        n += 1;
      }
    }
  }

  // Parse out circled cells.
  if (extensions['GEXT']) {
    n = -1;
    var gext = extensions['GEXT'];
    for (var y = 0; y < c.height; y++) {
      for (var x = 0; x < c.width; x++) {
        n++;
        var square = c.squares[x][y];
        if (!square) continue;

        var bits = gext.charCodeAt(n);
        if (bits & 0x10) { }  // cell previously marked incorrect
        if (bits & 0x20) { }  // cell currently marked incorrect
        if (bits & 0x40) { }  // cell contents were given
        if (bits & 0x80) {  // square is circled
          square.circled = true;
        }
      }
    }
  }

  // Construct c.answer
  c.answer = "";
  for (var y = 0; y < c.height; y++) {
    for (var x = 0; x < c.width; x++) {
      var sq = c.squares[x][y];
      if (sq) { c.answer += sq.char; }
      else    { c.answer += "."; }
    }
  }

  // Construct c.numbers
  c.numbers = [];
  for (var y = 0; y < c.height; y++) {
    var row = [];
    for (var x = 0; x < c.width; x++) {
      row.push(null);
    }
    c.numbers.push(row);
  }
  for (var y = 0; y < c.height; y++) {
    for (var x = 0; x < c.width; x++) {
      var sq = c.squares[x][y];
      if (sq) { c.numbers[y][x] = sq.across || sq.down || 0; }
      else    { c.numbers[y][x] = 0; }
    }
  }
  // delete c.squares;

  return c;
}
