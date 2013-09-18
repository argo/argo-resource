var argo = require('argo');
var resource = require('../');
var router = require('argo-url-router');
var authentication = require('./authentication');
var authorization = require('./authorization');
var basicAuth = require('./basic_auth');

var Products = require('./products');
var Locations = require('./locations');

argo()
  .use(router)
  .use(basicAuth)
  .use(authentication)
  .use(authorization)
  .map('/store', function(server) {
    server
      .use(resource(Products))
      .use(resource(Locations));
  })
  .listen(3000);
