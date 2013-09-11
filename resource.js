var Negotiator = require('negotiator');

var SupportedMethods = ['get','put','patch','post','del','options','trace'];

var ResourceConfig = function() {
  this.$path = null;
  this.$maps = [];
  this.$produces = [];
  this.$consumes = [];

  var self = this;
  SupportedMethods.forEach(function(m) {
    var key = '$' + m + 's';
    self[key] = [];
  });

  this.thisArg = null;
};

ResourceConfig.prototype.path = function(path) {
  if (path[0] !== '/') {
    path = '/' + path;
  }

  this.$path = path;
  return this;
};

ResourceConfig.prototype.map = function(path, fn, methods, thisArg) {
  if (typeof path === 'function') {
    fn = path;
    options = fn;
    thisArg = options;
    path = '/';
  }

  if (!Array.isArray(methods)) {
    thisArg = methods;
    methods = ['GET'];
  }

  if (path[0] !== '/') {
    path = '/' + path;
  }

  this.$maps.push({ path: path, methods: methods, thisArg: thisArg, handler: fn });
  return this;
};

SupportedMethods.forEach(function(m) {
  ResourceConfig.prototype[m] = function(path, fn, thisArg) {
    var consumes = [];
    var produces = [];

    if (typeof path === 'function') {
      thisArg = fn;
      fn = path;
      path = '/';
    } else if (typeof path === 'object') {
      var options = path;
      fn = options.handler;
      thisArg = options.bind;
      consumes = options.consumes || [];
      produces = options.produces || [];
      path = options.path || '/';
    }

    if (typeof fn === 'object') {
      var options = fn;
      consumes = options.consumes || [];
      produces = options.produces || [];
      thisArg = options.bind;
      fn = options.handler;
    }

    if (path[0] !== '/') {
      path = '/' + path;
    }

    var key = '$' + m + 's';

    this[key].push({
      path: path,
      consumes: consumes,
      produces: produces,
      thisArg: thisArg,
      handler: fn });

    return this;
  };
});

ResourceConfig.prototype.produces = function(mediaTypes) {
  if (typeof mediaTypes === 'string') {
    this.$produces.push(mediaTypes);
  } else if (Array.isArray(mediaTypes)) {
    this.$produces.concat(mediaTypes);
  }

  return this;
};

ResourceConfig.prototype.consumes = function(mediaTypes) {
  if (typeof mediaTypes === 'string') {
    this.$consumes.push(mediaTypes);
  } else if (Array.isArray(mediaTypes)) {
    this.$consumes.concat(mediaTypes);
  }

  return this;
};

ResourceConfig.prototype.bind = function(thisArg) {
  this.thisArg = thisArg
  return this;
};

ResourceConfig.create = function(cons) {
  return new ResourceConfig();
};

var ResourceInstaller = function(config, obj) {
  this.config = config;
  this.obj = obj;
};

ResourceInstaller.prototype.install = function(argo) {
  var config = this.config;
  var obj = this.obj;

  argo
    .map(config.$path, function(server) {
      server.use(function(handle) {
        handle('request', function(env, next) {
          env.resource = { skipHandler: false };
          next(env);
        });
      });

      config.$maps.forEach(function(obj) {
        var thisArg = obj.thisArg || config.thisArg;
        server.map(obj.path, { methods: obj.methods }, obj.handler.bind(thisArg));
      });

      SupportedMethods.forEach(function(m) {
        var key = '$' + m + 's';
        config[key].forEach(function(obj) {
          var thisArg = obj.thisArg || config.thisArg;
          var consumes = obj.consumes.length ? obj.consumes : config.$consumes;
          var produces = obj.produces.length ? obj.produces : config.$produces;
          var handler = obj.handler.bind(thisArg);

          var isHandler = (obj.handler.length === 1)/* function(handle) */;

          if (isHandler) {
            var hijacker = function(handle) {
              handler(function(type, options, fn) {
                if (typeof options === 'function') {
                  fn = options;
                  options = null;
                }

                if (type === 'request') {
                  var wrapper = function(env, next) {
                    if (!env.resource.mediaTypes) {
                      var negotiator = new Negotiator(env.request);
                      var preferred = negotiator.preferredMediaTypes(produces);
                      env.resource.mediaTypes = preferred;
                    }

                    var methods = ['PUT', 'POST', 'PATCH'];
                    if (methods.indexOf(env.request.method) !== -1) {
                      if (env.request.headers['content-type'] && consumes
                          && consumes.indexOf(env.request.headers['content-type']) == -1) {
                        env.response.statusCode = 415;
                        env.resource.error = { message: 'Unsupported Media Type', supported: consumes };
                        env.resource.skipHandler = true;
                        return next(env);
                      } else {
                        env.resource.requestType = env.request.headers['content-type'];

                        fn(env, next);
                      }
                    }
                  };

                  handle(type, options, wrapper);
                } else {
                  handle(type, options, fn);
                }
              });
            };

            server[m](obj.path, hijacker);
          } else {
            server[m](obj.path, function(handle) {
              handle('request', function(env, next) {
                var negotiator = new Negotiator(env.request);
                var preferred = negotiator.preferredMediaTypes(produces);
                env.resource.mediaTypes = preferred;

                var methods = ['PUT', 'POST', 'PATCH'];
                if (methods.indexOf(env.request.method) !== -1) {
                  if (env.request.headers['content-type'] && consumes
                      && consumes.indexOf(env.request.headers['content-type']) == -1) {
                    env.response.statusCode = 415;
                    env.resource.error = { message: 'Unsupported Media Type', supported: consumes };

                    return next(env);
                  } else {
                    env.resource.requestType = env.request.headers['content-type'];
                  }
                  
                }

                handler(env, next);
              });
            });
          }
        });
      });
    });
};

module.exports = function(/* constructor, ...constructorArgs */) {
  var args = Array.prototype.slice.call(arguments);

  var constructor = args[0];
  var constructorArgs = args.length > 1 ? args.slice(1) : undefined;

  var pkg = function(argo) {
    var obj = Object.create(constructor.prototype);
    obj.constructor.apply(obj, constructorArgs);

    if (!obj.init) {
      throw new Error('Resource is missing an init function.');
    }

    var config = ResourceConfig.create();
    obj.init(config);

    var installer = new ResourceInstaller(config, obj);

    return {
      name: 'resource',
      install: installer.install.bind(installer, argo)
    };
  };

  return { package: pkg };
};
