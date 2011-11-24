/*
 * core-test.js: Tests for core functionality of APIeasy.
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    mkdirp = require('mkdirp'),
    APIeasy = require('../lib/api-easy'),
    helpers = require('./helpers');

var scopes = ['When using the Test API', 'the Test Resource'];

vows.describe('api-easy/upload').addBatch({
  "Before tests begin": {
    "test/uploads should be created": function () {
      mkdirp.sync(path.join(__dirname, 'uploads'), 0777);
    }
  }
}).addBatch({
  "When using a APIeasy suite": {
    "an upload test against a local test server": {
      topic: function () {
        helpers.startFileEchoServer(8000);

        var suite = APIeasy.describe('api/test');

        scopes.forEach(function (text) {
          suite.discuss(text);
        });

        // Mock the underlying vows suite reporter to silence it
        suite.suite.reporter = { 
          report: function () { 
          }
        }

        suite.use('localhost', 8080)
             .followRedirect(false)
             .setHeader("content-type", 'multipart/form-data')
             .uploadFile('/upload', __dirname + "/file.txt", 'file')
               .expect(200)
               .expect("should return file", function (err, res, body) {
                  assert.equal('TEST FILE CONTENT HERE', body);
               })
             .run(this.callback.bind(null, null));
      },
      "should run and respond with no errors": function (ign, results) {
        assert.equal(results.errored, 0);
        assert.equal(results.broken, 0);
        assert.equal(results.pending, 0);
        assert.equal(results.honored, 2);
        assert.equal(results.total, 2);
      }
    }
  }
}).export(module);
