var argo = require('argo');
var resource = require('../');
var router = require('argo-url-router');
var authorization = require('./resource_authorization');
var basicAuthSetup = require('./basic_auth_setup');
var basicAuth = require('./basic_auth');

var Products = require('./products');
var Locations = require('./locations');

argo()
  .use(router)
  .use(basicAuthSetup)
  .use(basicAuth)
  .use(authorization)
  .use(resource(Products))
  .use(resource(Locations))
  .listen(3000);
