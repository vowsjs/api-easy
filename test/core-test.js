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
    restEasy = require('rest-easy'),
    helpers = require('./helpers');

var scopes = ['When using the Test API', 'the Foo Resource'];

vows.describe('rest-easy/core').addBatch({
  "When using RESTeasy": {
    topic: restEasy.describe('test/api').discuss('When using the Test API'),
    "it should have the correct methods set": function () {
      assert.isFunction(restEasy.describe);
      assert.length(Object.keys(restEasy), 1);
    },
    "and a valid suite": {
      topic: function (suite) {
        return suite.discuss('the Foo Resource')
          .use('localhost', 8080)
          .setHeaders({ 'Content-Type': 'application/json' })
          .path('/tests');
      },
      "it should have the correct methods set": function (suite) {
        ['discuss', 'use', 'setHeaders', 'path', 'unpath', 'root', 'get', 'put', 
          'post', 'del', 'expect', 'next', 'export', '_request', '_currentTest'].forEach(function (key) {
          assert.isFunction(suite[key]);
        });
      },
      "the path() method": {
        "should append the path to the suite": function (suite) {
          var length = suite.paths.length;
          suite.path('/more-tests');
          assert.length(suite.paths, length + 1);
          assert.equal('/more-tests', suite.paths[suite.paths.length - 1]);
        }
      },
      "the unpath() method": {
        "should remove the path from the suite": function (suite) {
          var length = suite.paths.length;
          suite.unpath();
        }
      },
      "a GET test": {
        "with no path": {
          topic: function (suite) { 
            return suite.get()
                        .expect(200, { available: true })
                        .expect('should do something custom', function (res, body) {
                          assert.isTrue(true);
                        }).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A GET to /tests', {
            uri: 'http://localhost:8080/tests',
            headers: {
              'Content-Type': 'application/json'
            },
            length: 4
          })
        },
        "with an additional path": {
          topic: function (suite) {
            return suite.get('/path-test').expect(200).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A GET to /tests/path-test', {
            uri: 'http://localhost:8080/tests/path-test',
            headers: {
              'Content-Type': 'application/json'
            },
            length: 2
          })
        },
        "with an additional path and parameters": {
          topic: function (suite) {
            return suite.get('/path-test', { foo: 1, bar: 2 }).expect(200).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A GET to /tests/path-test?foo=1&bar=2', {
            uri: 'http://localhost:8080/tests/path-test?foo=1&bar=2',
            headers: {
              'Content-Type': 'application/json'
            },
            length: 2
          })
        }
      }
    }
  }
}).export(module);