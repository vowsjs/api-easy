/*
 * core-test.js: Tests for core functionality of APIeasy.
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('../lib/api-easy'),
    helpers = require('./helpers');

var scopes = ['When using the Test API', 'the Test Resource'];

vows.describe('api-easy/run').addBatch({
  "When using a APIeasy suite": {
    "a suite of tests against a local test server": {
      topic: function () {
        helpers.startServer(8000);

        var suite = APIeasy.describe('api/test');

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
             .followRedirect(false)
             .get('/tests')
               .expect(200, { ok: true })
             .post('/tests', { dynamic: true })
               .expect(200, { dynamic: true })
             .post('/redirect', { dynamic: true })
               .expect(302, { dynamic: true })
             .get('restricted')
               .expect(401)
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
        assert.equal(results.honored, 11);
        assert.equal(results.total, 11);
      }
    }
  }
}).export(module);