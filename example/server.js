var argo = require('argo');
var resource = require('../');
var router = require('argo-url-router');

var Products = require('./products');

argo()
  .use(router)
  .use(resource.of(Products, [{ id: 1, name: 'Shinola Fanny Pack' }]))
  .listen(3000);
