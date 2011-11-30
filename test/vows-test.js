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

vows.describe('api-easy/vows').addBatch({
  "When using APIeasy": {
    topic: apiEasy.describe('test/api').discuss('When using the Test API'),
    "it should have the correct methods set": function () {
      assert.isFunction(apiEasy.describe);
      assert.lengthOf(Object.keys(apiEasy), 2);
    },
    "and a valid suite": {
      "should have the addBatch method": function (suite) {
          assert.isFunction(suite['addBatch']);
      },
      "the addBatch() method": {
        "should return the vows suite with the appropriate methods": function (suite) {
          var vows = suite.addBatch({
            topic: function () {
              return 1 + 1;
            },
            "test": function (result) {
              assert.equal(result, 2);
            }
          });

          ['addBatch', 'get', 'put', 'post', 'del', 'head', 'uploadFile'].forEach(function (method) {
            assert.isFunction(vows[method], method + ' is missing');
          });
        }, 
        "and the vows suite's get, put, post, del, head, uploadFile method": {
          "should return back the APIEasy suite": function (suite) {
            ['get', 'put', 'post', 'del', 'head', 'uploadFile'].forEach(function (method) {
              var easy = suite[method]();
              assert.isObject(easy);
              ['discuss', 'use', 'setHeaders', 'path', 'unpath', 'root', 'get', 'put', 
               'post', 'del', 'expect', 'next', 'export', 'exportTo', '_request', '_currentTest', 'addBatch'].forEach(function (key) {
                assert.isFunction(easy[key]);
              });
            });
          }
        }
      }
    }
  }
}).export(module);
