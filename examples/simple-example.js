var vows = require('vows'),
    assert = require('assert'),
    APIeasy = require('../lib/api-easy'),
    helpers = require('../test/helpers');

var scopes = ['When using the Test API', 'the Test Resource'];

helpers.startServer(8000);

var suite = APIeasy.describe('api/test');

scopes.forEach(function (text) {
  suite.discuss(text);
});

suite.use('localhost', 8000)
     .setHeader('Content-Type', 'application/json')
     .followRedirect(false)
     .get('/tests')
       .expect(200, { ok: true })
     .post('/tests', { dynamic: true })
       .expect(200, { dynamic: true })
     .post('/redirect', { dynamic: true })
       .expect(302, { dynamic: true })
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
     .export(module);