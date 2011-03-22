/*
 * helpers.js: Test macros for RESTeasy.
 *
 * (C) 2011, Charlie Robbins
 *
 */
 
var assert = require('assert');
 
var helpers = exports, 
    reservedOptions;

reservedOptions = {
  'length': function (batch, length) {
    assert.length(Object.keys(batch), length);
  },
  'before': function (batch, length) {
    assert.length(batch.topic.before, length);
  }
};

helpers.assertOptions = function (scopes, local, outgoing) {
  return function (batch) {
    var localScope = scopes.concat(local);
    
    localScope.forEach(function (scope) {
      assert.isObject(batch[scope]);
      batch = batch[scope];
    });
    
    assert.isFunction(batch.topic);
    assert.isObject(batch.topic.outgoing);
    
    Object.keys(outgoing).forEach(function (key) {
      if (reservedOptions[key]) {
        reservedOptions[key](batch, outgoing[key]);
      }
      else {
        assert.deepEqual(batch.topic.outgoing[key], outgoing[key]);
      }
    });
  };
};
 
