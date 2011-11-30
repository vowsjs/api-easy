/*
 * core-test.js: Tests for core functionality of APIeasy.
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    apiEasy = require('../lib/api-easy'),
    helpers = require('./helpers');

var scopes = ['When using the Test API', 'the Test Resource'];

vows.describe('api-easy/core').addBatch({
  "When using APIeasy": {
    topic: apiEasy.describe('test/api').discuss('When using the Test API'),
    "it should have the correct methods set": function () {
      assert.isFunction(apiEasy.describe);
      assert.lengthOf(Object.keys(apiEasy), 2);
    },
    "and a valid suite": {
      "it should have the correct methods set": function (suite) {
        ['discuss', 'use', 'setHeaders', 'path', 'unpath', 'root', 'get', 'put', 
          'post', 'del', 'expect', 'next', 'export', 'exportTo', '_request', '_currentTest'].forEach(function (key) {
          assert.isFunction(suite[key]);
        });
      },
      "the discuss() method": {
        "should append the text to the suite's discussion": function (suite) {
          var length = suite.discussion.length;
          suite.discuss('the Test Resource')
               .discuss('and something else worth mentioning');
          
          assert.lengthOf(suite.discussion, length + 2);
        }
      },
      "the undiscuss() method": {
        "should remove the last discussion text": function (suite) {
          var length = suite.discussion.length;
          suite.undiscuss();
          
          assert.lengthOf(suite.discussion, length - 1);
        }
      },
      "the use() method": {
        "should set the appropriate options": function (suite) {
          suite.use('localhost', 8080);
          assert.equal(suite.host, 'localhost');
          assert.equal(suite.port, 8080);
        }
      },
      "the setHeader() method": {
        "should set the header appropriately": function (suite) {
          var length = Object.keys(suite.outgoing.headers).length;
          suite.setHeader('x-test-header', true);
          assert.lengthOf(Object.keys(suite.outgoing.headers), length + 1);
        }
      },
      "the removeHeader() method": {
        "should remove the header appropriately": function (suite) {
          var length = Object.keys(suite.outgoing.headers).length;
          suite.removeHeader('x-test-header');
          assert.lengthOf(Object.keys(suite.outgoing.headers), length - 1);
        }
      },
      "the setHeaders() method": {
        "should set all headers appropriately": function (suite) {
          suite.setHeader('x-test-header', true);
          suite.setHeaders({ 'Content-Type': 'application/json' });
          assert.lengthOf(Object.keys(suite.outgoing.headers), 1);
          assert.equal(suite.outgoing.headers['Content-Type'], 'application/json');
        }
      },
      "the path() method": {
        "should append the path to the suite": function (suite) {
          suite.path('/tests');
          var length = suite.paths.length;
          suite.path('/more-tests');
          assert.lengthOf(suite.paths, length + 1);
          assert.equal('more-tests', suite.paths[suite.paths.length - 1]);
        }
      },
      "the unpath() method": {
        "should remove the path from the suite": function (suite) {
          var length = suite.paths.length;
          suite.unpath();
        }
      },
      "the before() method": {
        "should append the function to the set of before operations": function (suite) {
          suite.before('setAuth', function (outgoing) {
            outgoing.headers['x-test-is-authorized'] = true;
          });
          
          assert.isFunction(suite.befores['setAuth']);
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
            before: 1,
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
            before: 1,
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
            before: 1,
            length: 2
          })
        }
      },
      "A POST test": {
        "the unbefore() method": {
          "should remove the function from the set of before operations": function (suite) {
            suite.unbefore('setAuth');
            assert.lengthOf(Object.keys(suite.befores), 0);
          }
        },
        "with no path": {
          topic: function (suite) {
            return suite.post().expect(201).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A POST to /tests', {
            uri: 'http://localhost:8080/tests',
            method: 'post',
            headers: {
              'Content-Type': 'application/json'
            },
            length: 2,
            before: 0
          })
        },
        "with no path and a request body": {
          topic: function (suite) {
            return suite.post({ test: 'data' })
                        .expect(201).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A POST to /tests', {
            uri: 'http://localhost:8080/tests',
            method: 'post',
            body: JSON.stringify({ test: 'data' }),
            headers: {
              'Content-Type': 'application/json'
            },
            length: 2,
            before: 0
          })
        },
        "with no path, a request body, and params": {
          topic: function (suite) {
            return suite.post({ test: 'data' }, { foo: 1, bar: 2 })
                        .expect(201).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A POST to /tests?foo=1&bar=2', {
            uri: 'http://localhost:8080/tests?foo=1&bar=2',
            method: 'post',
            body: JSON.stringify({ test: 'data' }),
            headers: {
              'Content-Type': 'application/json'
            },
            length: 2,
            before: 0
          })
        },
        "with a path, request body, and params": {
          topic: function (suite) {
            return suite.post('create', { test: 'data' }, { foo: 1, bar: 2 })
                        .expect(201).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A POST to /tests/create?foo=1&bar=2', {
            uri: 'http://localhost:8080/tests/create?foo=1&bar=2',
            method: 'post',
            body: JSON.stringify({ test: 'data' }),
            headers: {
              'Content-Type': 'application/json'
            },
            length: 2,
            before: 0
          })
        }
      }
    }
  }
}).export(module);
