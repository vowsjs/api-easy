/*
 * api-easy.js: Top-level include for the api-easy module.
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    qs = require('querystring'),
    request = require('request'),
    vows = require('vows');

//
// ### Check for version info in `package.json`
//
require('pkginfo')(module, 'version');

//
// ## APIeasy.describe(text, vowsSuite)
// This is the main (and sole) entry point for APIeasy.
// It responds with an object literal that manages an 
// underlying vows suite. Each call to `APIeasy.describe()` 
// will create a vows suite, with the corresponding `text` 
// passed to this method.
//
exports.describe = function (text) {
  return {
    //
    // ### State / Context management:
    //
    // * `suite`: The underlying vows suite
    // * `discussion`: Ordered list containing the set of text to use before each test
    // * `outgoing`: Shared options to be passed to the `request` module on each test.
    // * `befores`: Mapping of named functions to execute before each test to modify the 
    //             outgoing request options.
    // * `options`: Various configuration options for managing nuances of state / scope.
    // * `paths`: The set of paths representing the location of the current resource / 
    //            API method being tested by this object.
    // * `batch`: The object literal representing the current batch of vows tests to 
    //            eventually be pass to vows `.addBatch()`.
    // * `batches`: The set of all batches that have been added to the vows `suite` 
    //              associated with this object.
    //
    suite: vows.describe(text),
    discussion: [],
    outgoing: {
      headers: {}
    },
    befores: {},
    options: {},
    paths: [],
    batch: {},
    batches: [],
    
    //
    // ### Add and Remove BDD Discussion
    // Simple pathing for adding contextual description to sets of tests. 
    // Each call to discuss will create an object in the nested vows 
    // structure which has that text as the key in the parent. **e.g.:**
    //
    //     APIeasy.describe('your/awesome/api')
    //             .use('localhost', 8080)
    //             .discuss('When using your awesome API')
    //               .discuss('and an awesome resource')
    //               .path('/awesome-resource')
    //                 .get().expect(200)
    //               .undiscuss().unpath()
    //               .discuss('and a super resource')
    //               .path('/super-resource')
    //                 .get().expect(404);
    //
    discuss: function (text) {
      this.discussion.push(text);
      return this;
    },
    undiscuss: function (length) {
      length = length || 1;
      this.discussion.splice(-1 * length, length);
      return this;
    },
    
    //
    // ### Setup Remote API Location / Options
    // Configure the remote `host`, `port`, and miscellaneous
    // `options` of the API that this suite is testing.
    //
    use: function (host /* [port, options] */) {
      var args = Array.prototype.slice.call(arguments),
          options = typeof args[args.length - 1] === 'object' ? args.pop() : {},
          port = args[1];

      this.host   = host || 'localhost';
      this.port   = port || 80;
      this.secure = options.secure || false;

      //
      // **TODO _(indexzero)_:** Setup `this.options` here (i.e. options for the SUITE, not the REQUEST)
      // _What are useful options to expose?_
      //

      return this;
    },
    
    //
    // ### Configure Headers
    // Manipulate the HTTP headers that are sent to your API using these methods. 
    // They are designed to mimic the node.js core HTTP APIs.
    //
    setHeaders: function (headers) {
      this.outgoing.headers = headers;
      return this;
    },
    setHeader: function (key, value) {
      this.outgoing.headers[key] = value;
      return this;
    },
    removeHeader: function (key, value) {
      delete this.outgoing.headers[key];
      return this;
    },
    
    //
    // ### Manipulate Base Path 
    // Control the base path used for a given test in this suite. Append a path
    // by calling `.path()`. Remove the last `num` paths from the suite by calling 
    // `.unpath(num)`. Set the root path using `.root(path)` 
    //
    path: function (uri) {
      this.paths.push(uri.replace(/^\/|\/$/ig, ''));
      return this;
    },
    unpath: function (length) {
      length = length || 1;
      this.paths.splice(-1 * length, length);
      return this;
    },
    root: function (path) {
      this.paths = [path];
      return this;
    },
    
    //
    // ### Dynamically set Outgoing Request Options
    // Often it is necessary to set some HTTP options conditionally or based on 
    // results of a dynamic and/or asynchronous operation. A call to `.before()` 
    // will enqueue a function that will modify the outgoing request options 
    // before the request is made for all tests on the suite.      
    //
    before: function (name, fn) {
      this.befores[name] = fn;
      return this;
    },
    unbefore: function (name) {
      delete this.befores[name];
      return this;
    },
    
    //
    // ### Add HTTP Request-based Tests
    // The `.get()`, `.post()`, `.put()`, `.del()`, and `.head()` 
    // methods add a new context and topic to the vows structure maintained
    // by this APIeasy suite. The nuts and bolts of this are in the "private"
    // method `_request()`.
    //
    // Each method invocation returns the suite itself so that 
    //`.expect()` and other assertion method(s) can be called 
    // afterwards to add assertions to this context.
    //
    get: function (/* [uri, params] */) {
      var args = Array.prototype.slice.call(arguments);
      args.splice(1, -1, null);
      return this._request.apply(this, ['get'].concat(args));
    },
    post: function (/* [uri, data, params] */) {
      var args = Array.prototype.slice.call(arguments);
      return this._request.apply(this, ['post'].concat(args));
    },
    put: function (/* [uri, data, params] */) {
      var args = Array.prototype.slice.call(arguments);
      return this._request.apply(this, ['put'].concat(args));
    },
    del: function (/* [uri, data, params] */) {
      var args = Array.prototype.slice.call(arguments);
      return this._request.apply(this, ['delete'].concat(args));
    },
    head: function (/* [uri, params] */) {
      var args = Array.prototype.slice.call(arguments);
      args.splice(1, -1, null);
      return this._request.apply(this, ['head'].concat(args));
    },
    uploadFile: function (/* [uri, filepath, filePartName] */) {
      var args = Array.prototype.slice.call(arguments),
          filepath = args.splice(1, 1),
          filePartName = args.splice(1, 1),
          filename = path.basename(filepath);
          
      args.push(function (outgoing, callback) {
        //
        // TODO replace request/multipart with better implementation with
        // low memory consumption
        //
        fs.readFile(filepath[0], function (err, fileData) {
          outgoing.multipart = [{
              'content-type': 'application/octet-stream',
              'Content-Transfer-Encoding': 'binary',
              'Content-Disposition': 'form-data; name="' + filePartName + '"; filename="' + filename + '"',
              'body': fileData
          }];
          
          request(outgoing, callback);  
        });
      });
      
      return this._request.apply(this, ['post'].concat(args));
    },
    
    //
    // ### Add Test Assertions
    // Add test assertions with `.expect()`. There are a couple of options here:
    //
    // 1. Assert a response code: `suite.expect(200)`
    // 2. Assert a JSON result: `suite.expect({ some: 'value' })`
    // 3. Use a custom assertion: `suite.expect('should be custom', function (err, res, body) { ... })`
    //
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
      
      // When using a custom test assertion function, both the assertion function
      // and a description are required or else we have no key in the JSON structure to use.
      if (text && !test || test && !text) {
        throw new Error('Both description and a custom test are required.');
      }
      
      // Setup the custom test assertion if we have the appropriate arguments.
      if (text && test) {
        context[text] = function (err, res, body) {
          assert.isNull(err);
          test.apply(context, arguments);
        };
      }
      
      // Setup the response code test assertion if we have the appropriate arguments.
      if (code) {
        context['should respond with ' + code] = function (err, res, body) {
          assert.isNull(err);
          assert.equal(res.statusCode, code);
        };
      }
      
      // Setup the JSON response assertion if we have the appropriate arguments.
      if (result) {
        context['should respond with ' + JSON.stringify(result).substring(0, 50)] = function (err, res, body) {
          //
          // Pass any and all errors from parsing and asserting
          // the JSON returned to the underlying `vows` suite. 
          //
          assert.isNull(err);
          var testResult = JSON.parse(body);
          assert.deepEqual(testResult, result);
        };
      }
      
      return this;
    },
    
    //
    // Create some helper methods for setting important options
    // that will be later passed to `request`.
    //
    followRedirect: function (follow) {
      this.outgoing.followRedirect = follow;
      return this;
    },
    maxRedirects: function (max) {
      this.outgoing.maxRedirects = max;
      return this;
    },
    
    //
    // ### Perform Sequential Tests Easily
    // Since this object literal is designed to manage a single vows suite, 
    // we need a way to add multiple batches to that suite for performing
    // sequential tests. This is precisely what `.next()` does. It will:
    //
    // 1. Add the current batch (or 'vows'), `this.batch`, to the vows suite
    // 2. Add this same batch to the set of batches on `this.batches`
    // 3. Create a new empty object literal to use for `this.batch`.
    // 4. Reset the context for the `this.current` test. 
    //
    next: function () {
      this.suite.addBatch(this.batch);
      this.batches.push(this.batch);
      this.batch = {};
      this.current = '';
      return this;
    },
    
    //
    // ### Run Your Tests
    // Again, since we are managing a single vows suite in this object we 
    // should expose an easy way to export your tests to a given target without
    // needing to call `apiEasySuite.suite.export(module)`. You should only 
    // call this method once in a given test file.  
    //
    // The method exportTo(module) is provided as an alias to export(module)
    // if you want to avoid using the reserved JavaScript `export` word
    //
    // You can also call `.run()` which will run the specified suite just 
    // as if you were using vows directly.
    //
    export: function (target) {
      if (this.batch) {
        this.next();
      }
      
      this.suite.export(target);
      return this;
    },
    exportTo: function (target) {
      return this.export(target);
    },
    run: function (options, callback) {
      if (this.batch) {
        this.next();
      }
      
      if (!callback) {
        callback = options;
        options = {};
      }
      
      this.suite.run(options, callback);
      return this;
    },
    
    // ### Use Vows from APIeasy
    addBatch : function () {
      if (this.batch) {
        this.next();
      }
      
      //
      // injects `easy` methods into vows' suite to be able 
      // to switch back to APIEasy context
      //
      var self = this;
      ['get', 'post', 'del', 'put', 'head', 'uploadFile'].forEach(function (methodName) {
        if (typeof self.suite[methodName] === 'undefined') {    
          self.suite[methodName] = function () {
            return self[methodName].apply(self, arguments);
          }
        }  
      });
      
      return this.suite.addBatch.apply(this.suite, arguments);
    },
    
    //
    // ### Helpers and Utilities
    // `_request()` exists for the sake of DRY and simplicity and is designed to handle
    // a variety of interal usage(s) exposed indirectly through the `.get()`,
    // `.post()`, `.put()`, `.del()` and `.head()`. Nothing to see here unless you're 
    // interested in improving APIeasy itself.
    //
    _request: function (/* method [uri, data, params] */) {
      var self    = this,
          args    = Array.prototype.slice.call(arguments),
          method  = args.shift(),
          uri     = typeof args[0] === 'string' && args.shift(),
          data    = typeof args[0] === 'object' && args.shift(),
          params  = typeof args[0] === 'object' && args.shift(),
          
          // custom request implementation function (outgoing, callaback),
          // should invoke callback(err, response, body) once done
          requestImpl = typeof args[0] === 'function' && args.shift(),
          port    = this.port && this.port !== 80 ? ':' + this.port : '',
          outgoing = clone(this.outgoing),
          fullUri, context;
      
      //
      // Update the fullUri for this request with the passed uri
      // and the query string parameters (if any).
      //
      fullUri = distillPath(uri ? this.paths.concat([uri]) : this.paths);
      
      //
      // Append the query string parameters to the `fullUri`. It's worth mentioning
      // here that if only a single object is provided to `_request()` it will assume
      // that it is the request body, not the params hash.
      //
      if (params) {
        fullUri += '?' + qs.stringify(params);
      }
      
      //
      // If the user has provided data, assume that it is JSON 
      // and set it to the `body` property of the options. 
      //
      // **TODO _(indexzero)_**: Expose more properties available by the 
      // [request module](http://github.com/mikeal/request)
      //
      if (data) {
        if (this.outgoing.headers['Content-Type'] == 'application/x-www-form-urlencoded') {
          outgoing.body = qs.stringify(data);
        } 
        else {
          outgoing.body = JSON.stringify(data);
        }
      }
      
      //
      // Set the `uri` and `method` properties of the request options `outgoing`
      // using the information provided to this instance and `_request()`.
      //
      outgoing.uri = this.secure ? 'https://' : 'http://';
      outgoing.uri += this.host + port + fullUri;
      outgoing.method = method;
      
      //
      // Create the description for this test. This is currently static.
      // **Remark _(indexzero)_**: Do users care if these strings are configurable?
      //
      this.current = ['A', method.toUpperCase(), 'to', fullUri].join(' ');
      context = this._currentTest();
      
      //
      // Add the topic for the specified request to the context of the current
      // batch used by this suite. 
      //
      context[this.current] = {
        topic: function () {
          //
          // Before making the outgoing HTTP request for this topic, execute
          // all known before funtions available to this suite. These functions 
          // are by definition synchronous add vows before a given test if
          // this data is fetched asynchronously. 
          //
          Object.keys(self.befores).forEach(function (name) {
            outgoing = self.befores[name](outgoing);
          }); 
          
          if (requestImpl)
            requestImpl(outgoing, this.callback);
          else
            request(outgoing, this.callback);
        }
      };
      
      //
      // Set the outgoing request options and set of before functions on the topic. 
      // This is used for test assertions, general consistency, and basically 
      // just knowing what every topic does explicitly.
      //
      context[this.current].topic.outgoing = outgoing;
      context[this.current].topic.before   = this.befores;
      return this;
    },
    
    //
    // The vows data structure is read as a sentence constructred by 
    // keys in a nested JSON structure. This helper method is designed to 
    // get the current test context (i.e. object) by nesting into the
    // JSON structure using this convention.
    //
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
    }
  };
};

//
// A simple function that performs a deep clone on the specified `obj`. 
// We use this in APIeasy to create multiple copies of the `options` 
// passed to `request` because they are considered mutable by `request`
// and we strive to make each request idempotent. 
//
function clone (obj) {
  var copy = {};
  for (var i in obj) {
    if (Array.isArray(obj[i])) {
      copy[i] = obj[i].slice(0);
    }
    else {
      copy[i] = obj[i] instanceof Object ? clone(obj[i]) : obj[i];
    }
  }

  return copy;
}

//
// Helper function used to join nested paths created by 
// multiple calls to `.path()`.
//      
//     suite.path('/a-path')
//          .path('/hey-another-path')
//          .path(...)
//
function distillPath (paths) {
  return '/' + paths.map(function (p) {
    return p.replace(/^\/|\/$/ig, '');
  }).join('/');
}
