/*
 * core-test.js: Tests for core functionality of APIeasy.
 *
 * (C) 2011, Charlie Robbins
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    apiEasy = require('../lib/api-easy'),
    helpers = require('./helpers');

var scopes = ['When using the Test API'];

vows.describe('api-easy/vows').addBatch({
  "When using APIeasy": {
    topic: apiEasy.describe('test/api').discuss('When using the Test API'),
    "it should have the correct methods set": function () {
      assert.isFunction(apiEasy.describe);
      assert.length(Object.keys(apiEasy), 2);
    },
    "and a valid suite": {
      "should have the vows method": function (suite) {
          ['discuss', 'use', 'setHeaders', 'path', 'unpath', 'root', 'get', 'put', 
          'post', 'del', 'expect', 'next', 'export', '_request', '_currentTest'].forEach(function (key) {
            assert.isFunction(suite[key]);
          });
      },
      "A POST test": {
        "with a path and requestImpl function": {
          topic: function (suite) {
            return suite.use("localhost",8080).post('/tests/upload', null, null, function(out, callback) { })
                        .expect(201).batch;
          },
          "should have the correct options": helpers.assertOptions(scopes, 'A POST to /tests/upload', {
            uri: 'http://localhost:8080/tests/upload',
            method: 'post',
            length: 2,
            before: 0
          })
        }
      }
    }
  }
}).export(module);
