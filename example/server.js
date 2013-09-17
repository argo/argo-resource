var argo = require('argo');
var resource = require('../');
var router = require('argo-url-router');
var basicAuth = require('./basic_auth');

var Products = require('./products');
var Locations = require('./locations');

argo()
  .use(router)
  .use(basicAuth)
  .use(function(handle) {
    handle('resource:request:before', function(env, next) {
      var operation = env.resource.current.operation;

      if (!env.auth.isAuthenticated) {
        env.resource.skip(true);
        next(env);
      } else if (operation && env.auth.user) {
        if (env.auth.user.operations.indexOf(operation) === -1) {
          env.resource.skip(true);

          env.response.statusCode = 403;
          env.response.body = { failedOperation: operation };
          next(env);
        } else {
          next(env);
        }
      } else {
        next(env);
      }
    });
    handle('resource:request:after', function(env, next) {
      next(env);
    });
  })
  .use(resource(Products))
  .use(resource(Locations))
  .listen(3000);
