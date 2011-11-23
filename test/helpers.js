/*
 * helpers.js: Test macros for APIeasy.
 *
 * (C) 2011, Charlie Robbins
 *
 */
 
var assert = require('assert'),
    http = require('http'),
    journey = require('journey');
 
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

helpers.startServer = function (port) {
  var token, router = new journey.Router({ 
    strict: false,
    strictUrls: false,
    api: 'basic'
  });
  
  function isAuthorized (req, body, next) {
    return parseInt(req.headers['x-test-authorized'], 10) === token ? next() : next(new journey.NotAuthorized());
  }
  
  router.get('/tests').bind(function (res) {
    res.send(200, {}, { ok: true });
  });
  
  router.post('/tests').bind(function (res, data) {
    res.send(200, {}, data);
  });
  
  router.post('/redirect').bind(function (res, data) {
    res.send(302, { 'Location': 'http://localhost:8000/login' }, data);
  });
  
  router.post('/upload').bind(function (res, data) {
    res.send(200, {}, data);
  });
  
  router.get('/login').bind(function (res) {
    if (!token) {
      token = Math.floor(Math.random() * 100);
    }
    
    res.send(200, {}, { token: token });
  });
  
  router.filter(isAuthorized, function () {
    this.get('/restricted').bind(function (res) {
      res.send(200, {}, { authorized: true });
    });
  });
  
  http.createServer(function (request, response) {
    var body = "";

    request.addListener('data', function (chunk) { body += chunk });
    request.addListener('end', function () {
      //
      // Dispatch the request to the router
      //
      router.handle(request, body, function (result) {
        response.writeHead(result.status, result.headers);
        response.end(result.body);
      });
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
