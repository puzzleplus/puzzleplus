// var process = require('process');

var assert = require('assert');
var readXml = require('./read-xml.js');
var fs = require('fs');

assert.equal(3, process.argv.length,
    'Usage: node ' + process.argv[1] + ' foo.xml');

var filename = process.argv[2];


fs.readFile(filename, function(err, data) {
  assert.ifError(err);
  console.log('Read ' + data.length + ' bytes of XML.');

  readXml.parseHangoutXml(data, function(e, hangout_data) {
    assert.ifError(e);

    console.log('Title: ' + hangout_data.title);

    console.log('Output:');
    console.log(readXml.applyTransforms(hangout_data.content, hangout_data.lonelyOpts));
  });
});
