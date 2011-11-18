# APIeasy [![Build Status](https://secure.travis-ci.org/flatiron/api-easy.png)](http://travis-ci.org/flatiron/api-easy)

A fluent (i.e. chainable) syntax for generating vows tests against RESTful APIs.

## Installation

### Installing npm (node package manager)
``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing APIeasy
``` bash
  $ [sudo] npm install api-easy
```

## Purpose
APIeasy is designed to be a simple way to test RESTful APIs in [node.js][0] and Javascript. The primary design goal was to reduce the number of lines of test code required to fully cover all primary and edge use cases of a given API over HTTP. 

## Getting Started
Most of the documentation for this library is available through the [annotated source code, available here][1] thanks to [jashkenas][2] and [docco][3]. If you're not feeling up for that, just keep reading here. tldr;? [Read how to use APIeasy in your own projects][4]

If you're going to use APIeasy (and I hope you do), it's worth taking a moment to understand the way that [vows][5] manages flow control. Read up here on [vowsjs.org][5] (Under "Structure of a test suite"), or just remember vows uses this grammatical structure:

```
  Suite   → Batch*
  Batch   → Context*
  Context → Topic? Vow* Context*
```

Got it? Good. There is a 1-to-1 relationship between a APIeasy suite and a vows suite; APIeasy is essentially a simpler syntax to manage a particular set of vows-based tests that conform to this pattern:

1. Tests are performed by making HTTP requests against an API server
2. Assertions are made against the HTTP response and JSON response body
3. Rinse. Repeat.

Here's a sample of the boilerplate code that APIeasy eliminates:

``` js
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
```

This same code can be implemented like this using APIeasy:

``` js
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
```

<a name="using-api-easy">
## Using APIeasy in your own project
There are two ways to use APIeasy in your own project:

1. Using npm
2. Using vows directly

### Using APIeasy with npm
If you've used the `npm test` command in [npm][7] before, this should be nothing new. You can read more about the [npm test command here][8]. All you need to do is add the following to your `package.json` file:

``` js
 {
   "dependencies": {
     "api-easy": "0.2.x"
   },
   "scripts": {
     "test": "vows test/*-test.js"
   }
 }
```

**Note:** `test/*-test.js` is at your discretion. It's just an expression for all test files in your project. 

After adding this to your `package.json` file you can run the following to execute your tests:

``` bash
  $ cd path/to/your/project
  $ npm install
  $ npm test
```

There is also a full working sample of how to use this approach [here][9].

### Using APIeasy with vows
When you install APIeasy or take it as a dependency in your `package.json` file it will not install [vows][5] globally, so to use vows you must install it globally.

``` bash
  $ [sudo] npm install vows -g
```

After installing vows you can simply run it from inside your project:

``` bash
  $ cd /path/to/your/project
  $ vows
```

## Roadmap

1. [Get feedback][6] on what else could be exposed through this library.
2. Improve it.
3. Repeat (1) + (2).

## Run Tests
<pre>
  npm test
</pre>

#### Author: [Charlie Robbins](http://nodejitsu.com)

[0]: http://nodejs.org
[1]: http://indexzero.github.com/api-easy
[2]: http://github.com/jashkenas
[3]: http://github.com/jashkenas/docco
[4]: #using-api-easy
[5]: http://vowsjs.org
[6]: http://github.com/indexzero/api-easy/issues
[7]: http://npmjs.org
[8]: https://github.com/isaacs/npm/blob/master/doc/test.md
[9]: https://gist.github.com/1039425
