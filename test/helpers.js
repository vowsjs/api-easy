/*
 * helpers.js: Test macros for APIeasy.
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    http = require('http'),
    director = require('director');
 
var helpers = exports, 
    reservedOptions;

reservedOptions = {
  'length': function (batch, length) {
    assert.lengthOf(Object.keys(batch), length);
  },
  'before': function (batch, length) {
    assert.lengthOf(Object.keys(batch.topic.before), length);
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

//
// Replace deprecated `res.send` method in `journey` with a 
// simple helper, `res.json`.
//
http.ServerResponse.prototype.json = function (code, headers, data) {
  if (!data && typeof headers === 'object') {
    data = headers;
    headers = null;
  }
  
  if (headers && Object.keys(headers).length) {
    for (var key in headers) {
      this.setHeader(key, headers[key]);
    }
  }
  
  this.writeHead(code);
  this.end(data ? JSON.stringify(data) : '');
};

helpers.startServer = function (port) {
  var token, router = new director.http.Router().configure({ 
    strict: false,
    async: true
  });
  
  router.get('/tests', function () {
    this.res.json(200, {}, { ok: true });
  });
  
  router.post('/tests', function () {
    this.res.json(200, {}, this.req.body);
  });
  
  router.post('/redirect', function () {
    this.res.json(302, { 'Location': 'http://localhost:8000/login' }, this.req.body);
  });
  
  router.post('/upload', function () {
    this.res.json(200, {}, this.req.body);
  });
  
  router.get('/login', function () {
    if (!token) {
      token = Math.floor(Math.random() * 100);
    }
    
    this.res.json(200, {}, { token: token });
  });
  
  router.before('/restricted', function (next) {
    return parseInt(this.req.headers['x-test-authorized'], 10) !== token 
      ? next(new director.http.NotAuthorized())
      : next();
  });
  
  router.get('/restricted', function () {
    this.res.json(200, {}, { authorized: true });
  });
    
  http.createServer(function (req, res) {
    req.body = '';
    req.on('data', function (chunk) { req.body += chunk });
    router.dispatch(req, res, function (err) {
      if (err) {
        res.json(err.status, err.headers, err.body);
      }
    });
  }).listen(8000);
};

helpers.startFileEchoServer = function (port) {
  var formidable = require("formidable");
  var fs = require("fs");
  
  http.createServer(function (request, response) {
    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];
        
    form.uploadDir = __dirname+"/uploads";

    form
      .on('field', function (field, value) {
        fields.push([field, value]);
      })
      .on('file', function (field, file) {
        files.push([field, file]);
      })
      .on('end', function () {
        response.writeHead(200, {'content-type': request.headers['content-type']});
        response.end(fs.readFileSync(files[0][1].path));
      });
    form.parse(request);
  }).listen(8080);
};
