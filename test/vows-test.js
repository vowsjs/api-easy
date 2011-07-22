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

var scopes = ['When using the Test API', 'the Test Resource'];

vows.describe('api-easy/vows').addBatch({
  "When using APIeasy": {
    topic: apiEasy.describe('test/api').discuss('When using the Test API'),
    "it should have the correct methods set": function () {
      assert.isFunction(apiEasy.describe);
      assert.length(Object.keys(apiEasy), 2);
    },
    "and a valid suite": {
      "should have the vows method": function (suite) {
          assert.isFunction(suite['vows']);
      },
      "the vows() method": {
        "should return the vows suite with easy method": function (suite) {
          var vows = suite.vows();
          assert.isFunction(vows['addBatch']);
          assert.isFunction(vows['easy']);
        }, 
        "and the vows' easy() method": {
            "should return back the APIEasy suite": function (suite) {
              var easy = suite.vows().easy();
              assert.isObject(easy);
              ['discuss', 'use', 'setHeaders', 'path', 'unpath', 'root', 'get', 'put', 
               'post', 'del', 'expect', 'next', 'export', '_request', '_currentTest', "vows"].forEach(function (key) {
                assert.isFunction(easy[key]);
              });
            }
        }
      }
    }
  }
}).export(module);
