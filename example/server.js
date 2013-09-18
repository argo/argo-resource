var argo = require('argo');
var resource = require('../');
var router = require('argo-url-router');
var authorization = require('./resource_authorization');
var basicAuthSetup = require('./basic_auth_setup');
var basicAuth = require('./basic_auth');

var Products = require('./products');
var Locations = require('./locations');

argo()
  .use(function(handle) {
    handle('request', function(env, next) {
      env.request.body = 'Hello, world!';
      next(env);
    });
  })
  .use(router)
  .use(basicAuthSetup)
  .use(basicAuth)
  .use(authorization)
  .map('/store', function(server) {
    server.use(resource(Products));
    server.use(resource(Locations));
  })
  .use(resource(Locations))
  .listen(3000);
