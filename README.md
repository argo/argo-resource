# Argo Resource

This porject helps you create API resources quickly and easily for use with Argo.

## Installation
```
npm install argo-resource
```

## Usage
```javascript
var argo = require('argo');
var resource = require('argo-resource');
var MyResource = require('./my-resource');


argo()
  .use(resource(MyResource))
  .listen(1337);
```

## Creating a resource

Resources use a specific class based implementation in JavaScript. Here is an example of a resource.

Resources are configured in the `init()` function. A configuration object is injected that allows you to configure all the necessary things about the API resource. 

The configuration object has different methods that can be called on it.

* [path](#path)
* [produces](#produces)
* [consumes](#consumes)
* [get](#get)
* [post](#post)
* [patch](#patch)
* [put](#put)
* [del](#del)
* [options](#options)
* [trace][#trace]

<a name="path"/>
### path(apiPath)

* `apiPath`: String with the API path for the resource

<a name="produces"/>
### produces(mediaType)

* `mediaType`: String with the media IANA media type that the resource responds with.

<a name="consumes"/>
### consumes(mediaType)

* `mediaType`: String with the media IANA media type that the resource accepts.

<a name="get"/>
### get(route, handlerFunction)

* `route`: String that represents the particular route 

* `handlerFunction`: A response callback. `env` is an environment context that is passed to every handler, and `next` is a reference to the next function in the pipeline.

This function combines the resource path, and the route to create a path that will respond to GET requests.

<a name="post"/>
### post(route, handlerFunction)

* `route`: String that represents the particular route 

* `handlerFunction`: A response callback. `env` is an environment context that is passed to every handler, and `next` is a reference to the next function in the pipeline.

This function combines the resource path, and the route to create a path that will respond to POST requests.

<a name="put"/>
### put(route, handlerFunction)

* `route`: String that represents the particular route 

* `handlerFunction`: A response callback. `env` is an environment context that is passed to every handler, and `next` is a reference to the next function in the pipeline.

This function combines the resource path, and the route to create a path that will respond to PUT requests.

<a name="patch"/>
### patch(route, handlerFunction)

* `route`: String that represents the particular route 

* `handlerFunction`: A response callback. `env` is an environment context that is passed to every handler, and `next` is a reference to the next function in the pipeline.

This function combines the resource path, and the route to create a path that will respond to PATCH requests.

<a name="delete"/>
### delete(route, handlerFunction)

* `route`: String that represents the particular route 

* `handlerFunction`: A response callback. `env` is an environment context that is passed to every handler, and `next` is a reference to the next function in the pipeline.

This function combines the resource path, and the route to create a path that will respond to DELETE requests.

<a name="trace"/>
### trace(route, handlerFunction)

* `route`: String that represents the particular route 

* `handlerFunction`: A response callback. `env` is an environment context that is passed to every handler, and `next` is a reference to the next function in the pipeline.

This function combines the resource path, and the route to create a path that will respond to TRACE requests.

<a name="options"/>
### options(route, handlerFunction)

* `route`: String that represents the particular route 

* `handlerFunction`: A response callback. `env` is an environment context that is passed to every handler, and `next` is a reference to the next function in the pipeline.

This function combines the resource path, and the route to create a path that will respond to OPTIONS requests.

```javascript
var MyResource = module.exports = function() {}

MyResource.prototype.init = function(config) {
   config
    .path('/myresource')
    .produces('application/json')
    .consumes('application/json')
    .post('/hello', this.postHello)
    .get('/hello', this.getHello)
};

MyResource.prototype.postHello = function(env, next) {
  env.response.statusCode = 200;
  env.response.body = { 'hello': 'world!' };  
  next(env);
};

MyResource.prototype.getHello = function(env, next) {
  env.repsonse.statusCode = 200;
  env.response.body = { 'hello': 'world!' };  
  next(env);
};

```

## License
```
Copyright (c) 2014-2015 Apigee and Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
