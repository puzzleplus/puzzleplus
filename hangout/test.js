// var process = require('process');

var assert = require('assert');
var readXml = require('./read-xml.js');
var fs = require('fs');
var program = require('commander');

program
  .option('-s, --single', 'Run in singleplayer mode (for easier testing).')
  .parse(process.argv);

assert.equal(1, program.args.length,
    'Usage: node ' + process.argv[1] + ' foo.xml');

var filename = program.args[0];


fs.readFile(filename, function(err, data) {
  assert.ifError(err);
  console.log('Read ' + data.length + ' bytes of XML.');

  readXml.parseHangoutXml(data, function(e, hangout_data) {
    assert.ifError(e);

    console.log('Title: ' + hangout_data.title);

    console.log('Output:');
    console.log(readXml.createFakeHtml(hangout_data, true));
  });
});
