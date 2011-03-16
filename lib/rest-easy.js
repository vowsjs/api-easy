/*
 * rest-easy.js: Top-level include for the rest-easy module.
 *
 * (C) 2011, Charlie Robbins
 *
 */

var qs = require('querystring'),
    request = require('request'),
    vows = require('vows'),
    assert = require('assert');

var restEasy = exports;

function clone (obj) {
  var copy = {};
  for (var i in obj) {
    if (Array.isArray(obj[i])) {
      copy[i] = obj[i].slice(0);
    }
    else {
      clone[i] = obj[i] instanceof Object ? clone(obj[i]) : obj[i];
    }
  }

  return copy;
};

function distillPath (paths) {
  return paths.join('');
}

restEasy.describe = function (text) {
  return {
    suite: vows.describe(text),
    discussion: [],
    options: {},
    paths: [],
    batch: {},
    batches: [],
    
    discuss: function (text) {
      this.discussion.push(text);
      return this;
    },
    
    use: function (host /* [port, options] */) {
      var args = Array.prototype.slice.call(arguments),
          options = typeof args[args.length - 1] === 'object' && args.pop(),
          port = args[0] || 80;

      this.options.host = host;
      this.options.port = port;

      //
      // TODO (indexzero): Setup `options` here (i.e. options for the SUITE, not the REQUEST)
      //

      return this;
    },
    
    setHeaders: function (headers) {
      this.options.headers = headers;
      return this;
    }, 
    
    path: function (uri) {
      this.paths.push(uri);
      return this;
    },
    
    unpath: function (length) {
      length = length || 1;
      this.paths.splice(-1 * length, length);
      return this;
    },
    
    root: function (path) {
      this.path = [path];
      return this;
    },
    
    _currentTest: function (text) {
      var last = this.batch;
      
      // Nest into the batch JSON structure using the current `discussion` text. 
      this.discussion.forEach(function (text) {
        if (typeof last[text] !== 'object') {
          last[text] = {};
        }
        
        // Capture the nested object
        last = last[text];
      });
      
      return text ? last[text] : last;
    },
    
    request: function (method /* [uri, params, data] */) {
      var args = Array.prototype.slice.call(arguments),
          data = typeof args[args.length - 1] === 'object' && args.pop(),
          params = typeof args[args.length - 1] === 'object' && args.pop(),
          uri = args[1],
          last = this.batch, 
          options = clone(options),
          fullUri, context;
      
      // Update the fullUri for this request with the passed uri
      // and the query string parameters (if any).
      fullUri = distillPath(uri ? this.paths.concat[uri] : this.paths);
      if (params) {
        fullUri += '?' + qs.stringify(params);
      }
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      // Create the description for this test.
      options.uri = 'http://' + this.options.host + fullUri;
      this.current = ['A', method.toUpperCase(), 'to', fullUri].join(' ');
      context = this._currentTest();
      
      context[this.current] = {
        topic: function () {
          request(options, this.callback);
        }
      };

      context[this.current].topic.options = options;
      return this;
    },
    
    get: function (/* [uri, params] */) {
      var args = Array.prototype.slice.call(arguments);
      return this.request.apply(this, ['get'].concat(args));
    },
    
    put: function (/* [uri, params, data] */) {
      var args = Array.prototype.slice.call(arguments);
      return this.request.apply(this, ['put'].concat(args));
    },
    
    post: function (/* [uri, params, data] */) {
      var args = Array.prototype.slice.call(arguments);
      return this.request.apply(this, ['post'].concat(args));
    },
    
    del: function (/* [uri, params, data] */) {
      var args = Array.prototype.slice.call(arguments);
      return this.request.apply(this, ['delete'].concat(args));
    },
    
    expect: function (/* [text, code, result, assert] */) {
      var args = Array.prototype.slice.call(arguments),
          text, code, result, test, context;
      
      args.forEach(function (arg) {
        switch (typeof(arg)) {
          case 'number': code = arg; break;
          case 'string': text = arg; break;
          case 'object': result = arg; break;
          case 'function': test = arg; break;
        }
      });
      
      context = this._currentTest(this.current);
      
      if (text && !test || test && !text) {
        throw new Error('Both description and a custom test are required.')
      }
      
      if (text && test) {
        context[text] = function (err, res, body) {
          assert.isNull(err);
          test.apply(context, arguments);
        }
      }
      
      if (code) {
        context['should respond with ' + code] = function (err, res, body) {
          assert.isNull(err);
          assert.equal(res.statusCode, code);
        }
      }
      
      if (result) {
        context['should respond with ' + Object.keys(result).join(', ')] = function (err, res, body) {
          try {
            assert.isNull(err);
            var testResult = JSON.parse(body);
            assert.deepEqual(result, testResult)
          }
          catch (ex) {
            //
            // TODO (indexzero): Something better here
            //
            assert.equal('Error parsing JSON returned', 'There was an');
          }
        }
      }
      
      return this;
    },
    
    next: function () {
      this.suite.addBatch(this.batch);
      this.batches.push(this.batch);
      this.batch = {};
      this.current = '';
    },
    
    export: function (target) {
      if (this.batch) {
        this.next();
      }
      
      this.suite.export(target);
      return this;
    }
  }
}