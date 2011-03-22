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
    RESTeasy = require('rest-easy'),
    helpers = require('./helpers');

var scopes = ['When using the Test API', 'the Test Resource'];

vows.describe('rest-easy/run').addBatch({
  "When using a RESTeasy suite": {
    "a suite of tests against a local test server": {
      topic: function () {
        helpers.startServer(8000);

        var suite = RESTeasy.describe('api/test');

        scopes.forEach(function (text) {
          suite.discuss(text);
        });

        // Mock the underlying vows suite reporter to silence it
        suite.suite.reporter = { 
          report: function () { 
          }
        }

        suite.use('localhost', 8000)
             .setHeader('Content-Type', 'application/json')
             .get('/tests')
               .expect(200, { ok: true })
             .post('/tests', { dynamic: true })
               .expect(200, { dynamic: true })
             .get('/login')
               .expect(200)
               .expect('should respond with the authorize token', function (err, res, body) {
                 var result = JSON.parse(body);
                 assert.isNotNull(result.token);

                 suite.before('setAuth', function (outgoing) {
                   outgoing.headers['x-test-authorized'] = result.token;
                   return outgoing;
                 });
               })
             .next()
             .get('/restricted')
               .expect(200, { authorized: true })
             .run(this.callback.bind(null, null));
      },
      "should run and respond with no errors": function (ign, results) {
        assert.equal(results.errored, 0);
        assert.equal(results.broken, 0);
        assert.equal(results.pending, 0);
        assert.equal(results.honored, 8);
        assert.equal(results.total, 8);
      }
    }
  }
}).export(module);