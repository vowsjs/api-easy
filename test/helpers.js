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
  }
};

helpers.assertOptions = function (scopes, local, options) {
  return function (batch) {
    var localScope = scopes.concat(local);
    
    localScope.forEach(function (scope) {
      assert.isObject(batch[scope]);
      batch = batch[scope];
    });
    
    assert.isFunction(batch.topic);
    assert.isObject(batch.topic.options);
    
    Object.keys(options).forEach(function (key) {
      if (reservedOptions[key]) {
        reservedOptions[key](batch, options[key]);
      }
      else {
        assert.deepEqual(batch.topic.options[key], options[key]);
      }
    });
  };
};
 
