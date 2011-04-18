# APIeasy

A fluent (i.e. chainable) syntax for generating vows tests against RESTful APIs.

## Installation

### Installing npm (node package manager)
<pre>
  curl http://npmjs.org/install.sh | sh
</pre>

### Installing APIeasy
<pre>
  [sudo] npm install api-easy
</pre>

## Purpose
APIeasy is designed to be a simple way to test RESTful APIs in [node.js][0] and Javascript. The primary design goal was to reduce the number of lines of test code required to fully cover all primary and edge use cases of a given API over HTTP. 

## Getting Started
Most of the documentation for this library is available through the [annotated source code, available here][1] thanks to [jashkenas][2] and [docco][3]. If you're not feeling up for that, just keep reading here. 

If you're going to use APIeasy (and I hope you do), it's worth taking a moment to understand the way that [vows][4] manages flow control. Read up here on [vowsjs.org][4] (Under "Structure of a test suite"), or just remember vows uses this grammatical structure:

<pre>
  Suite   → Batch*
  Batch   → Context*
  Context → Topic? Vow* Context*
</pre> 

Got it? Good. There is a 1-to-1 relationship between a APIeasy suite and a vows suite; APIeasy is essentially a simpler syntax to manage a particular set of vows-based tests that conform to this pattern:

1. Tests are performed by making HTTP requests against an API server
2. Assertions are made against the HTTP response and JSON response body
3. Rinse. Repeat.

Here's a sample of the boilerplate code that APIeasy eliminates:

<pre>
  var request = require('request'),
      vows = require('vows'),
      assert = require('assert');
  
  vows.describe('your/awesome/api').addBatch({
    "When using your awesome api": {
      "and your awesome resource": {
        "A POST to /awesome": {
          topic: function () {
            request({
              uri: 'http://localhost:8080/awesome',
              method: 'POST',
              body: JSON.stringify({ test: 'data' }),
              headers: {
                'Content-Type': 'application/json'
              }
            }, this.callback)
          },
          "should respond with 200": function (err, res, body) {
            assert.equal(res.statusCode, 200);
          },
          "should respond with ok": function (err, res, body) {
            var result = JSON.parse(body);
            assert.equal(result.ok, true);
          },
          "should respond with x-test-header": function (err, res, body) {
            assert.include(res.headers, 'x-test-header');
          }
        }
      }
    }
  }).export(module);
</pre>

This same code can be implemented like this using APIeasy:

<pre>
  var APIeasy = require('api-easy'),
      assert = require('assert');
      
  var suite = APIeasy.describe('your/awesome/api');
  
  suite.discuss('When using your awesome API')
       .discuss('and your awesome resource')
       .use('localhost', 8080)
       .setHeader('Content-Type', 'application/json')
       .post({ test: 'data' })
         .expect(200, { ok: true })
         .expect('should respond with x-test-header', function (err, res, body) {
           assert.include(res.headers, 'x-test-header');
         })
       .export(module);
</pre>

## Roadmap

1. [Get feedback][5] on what else could be exposed through this library.
2. Improve it.
3. Repeat (1) + (2).

## Run Tests
<pre>
  vows test/*-test.js --spec
</pre>

#### Author: [Charlie Robbins](http://nodejitsu.com)

[0]: http://nodejs.org
[1]: http://indexzero.github.com/api-easy
[2]: http://github.com/jashkenas
[3]: http://github.com/jashkenas/docco
[4]: http://vowsjs.org
[5]: http://github.com/indexzero/api-easy/issues
