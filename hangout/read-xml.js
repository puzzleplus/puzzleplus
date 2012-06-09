// This reads a Hangout App's XML file into a more structured format.

var readXml = module.exports = {};

var assert = require('assert');
var xml2js = require('xml2js');

// Reads a Hangout App's .xml file and returns stuctured data.
readXml.parseHangoutXml = function(input, callback) {
  var xml = input.toString();  // it often comes in as a buffer

  // Extract lonely options.
  var opts = {};
  var start_mark = '<!-- lonely';
  var end_mark = '-->';
  var comment_start = xml.indexOf(start_mark);
  if (comment_start != -1) {
    comment_start += start_mark.length;
    var comment_end = xml.indexOf(end_mark, comment_start);
    // TODO(danvk): this should trigger error callbacks, not assertions.
    assert.notEqual(-1, comment_end, 'Must end <!-- lonely --> comment.');

    var lonely_json = xml.substr(comment_start, comment_end - comment_start);

    // surely there is a better way...
    // Using JSON requires double-quotes around all keys, which is not nice.
    lonely_json = 'opts = ' + lonely_json;
    opts = eval('(function(){ return ' + lonely_json + '; }())');
    assert.ok(opts);
  }

  var parser = new xml2js.Parser({
    normalize: false,
    // trim: true
  });

  parser.parseString(xml, function(e, data) {
    if (e) {
      callback(e);
      return;
    }

    // TODO(danvk): these should trigger error callbacks, not assertions.
    assert.ok(data.ModulePrefs);
    assert.ok(data.ModulePrefs['@'].title);
    assert.ok(data.Content['#']);

    var content = StripProdCode(data.Content['#']);

    var result = {
      title: data.ModulePrefs['@'].title,
      content: content,
      lonelyOpts: opts
    };

    callback(null, result);
  });
};


// Applies any rewrites specified in lonelyOps to the data.
// Returns the transformed data.
readXml.applyTransforms = function(data, lonelyOpts) {
  if (!lonelyOpts.rewrites) return data;

  for (var i = 0; i < lonelyOpts.rewrites.length; i++) {
    var rewrite = lonelyOpts.rewrites[i];
    assert.ok('from' in rewrite);
    assert.ok('to' in rewrite);

    // TODO(danvk): Do a plain-string (not RE) replace all.
    data = data.replace(new RegExp(rewrite.from, 'g'), rewrite.to);
  }

  return data;
}

// Removes code inside
//
//   <!-- lonely <prodonly> -->
//   ...
//   <!-- lonely </prodonly> -->
//
// blocks
//
function StripProdCode(html) {
  var start_mark = '<!-- lonely <prodonly> -->';
  var end_mark = '<!-- lonely </prodonly> -->';

  while (1) {
    var prod_start = html.indexOf(start_mark);
    if (prod_start == -1) break;

    var prod_end = html.indexOf(end_mark, prod_start + start_mark.length);
    // TODO(danvk): this should trigger error callbacks, not assertions.
    assert.notEqual(-1, prod_end, 'Must end <!-- lonely <prodonly> --> comment.');

    html = html.substr(0, prod_start - 1) + html.substr(prod_end + end_mark.length);
  }

  return html;
}


// Converts a Hangout App's parsed data into HTML which uses the fake server.
// This takes care of adding appropriate headers, etc.
readXml.createFakeHtml = function(hangoutData, is_local) {
  var html = hangoutData.content;

  html = readXml.applyTransforms(html, hangoutData.lonelyOpts);

  // Insert fake api scripts right after "<html>"
  if (is_local) {
    return html.replace(/<html>/i,
        '<html>\n<script src="/fake-api.js"></script>');
  } else {
    return html.replace(/<html>/i,
        '<html>\n' +
        '<script src="/xsocket.io.min.js"></script>' +
        '<script src="/fake-socket-api.js"></script>');
  }
}
