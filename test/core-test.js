/*
 * core-test.js: Tests for core functionality of RESTeasy.
 *
 * (C) 2011, Charlie Robbins
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var vows = require('vows'),
    eyes = require('eyes'),
    assert = require('assert'),
    restEasy = require('rest-easy');

vows.describe('rest-easy/core').addBatch({
  "When using RESTeasy": {
    topic: restEasy.describe('test/api').discuss('When using the Test API'),
    "a GET test": {
      topic: function (suite) { 
        return suite.discuss('the Foo Resource')
          .use('localhost', 8080)
          .setHeaders({ 'Content-Type': 'application/json' })
          .path('/foo')
            .get()
              .expect(200, { available: true })
              .expect('should do something custom', function (res, body) {
                assert.isTrue(true);
              }).batch;
      },
      "should have the correct options": function (batch) {
        var scopes = ['When using the Test API', 'the Foo Resource', 'A GET to /foo'];
        
        scopes.forEach(function (scope) {
          assert.isObject(batch[scope]);
          batch = batch[scope];
        })
                        
        assert.equal(batch.topic.options.uri, 'http://localhost/foo')
      } 
    }
  }
}).export(module);
