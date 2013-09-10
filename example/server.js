var argo = require('argo');
var resource = require('../');
var router = require('argo-url-router');

var Products = require('./products');
var Locations = require('./locations');

argo()
  .use(router)
  .use(resource.of(Products))
  .use(resource.of(Locations))
  .listen(3000);
