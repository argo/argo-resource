var Negotiator = require('negotiator');
var pipeworks = require('pipeworks');

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
    var obj = {
      path: path,
      consumes: [],
      produces: [],
      thisArg: thisArg,
      handler: fn
    };

    if (typeof path === 'function') {
      obj.thisArg = fn;
      obj.handler = path;
      obj.path = '/';
    } else if (typeof path === 'object') {
      Object.keys(path).forEach(function(key) {
        if (path.hasOwnProperty(key)) {
          obj[key] = path[key];
        }
      });
      obj.thisArg = thisArg || obj.bind;
    }

    if (typeof fn === 'object') {
      Object.keys(fn).forEach(function(key) {
        if (path.hasOwnProperty(key)) {
          obj[key] = path[key];
        }
      });
      obj.thisArg = thisArg || obj.bind;
      obj.path = path;
    }

    if (obj.path[0] !== '/') {
      obj.path = '/' + obj.path;
    }

    var key = '$' + m + 's';

    this[key].push(obj);

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
          env.resource = {
            _skipHandler: false,
            current: null,
            _skip: false,
            skip: function(bool) { env.resource._skip = bool; }
          };
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
            /*var hijacker = function(handle) {
              handler(function(type, options, fn) {
                if (typeof options === 'function') {
                  fn = options;
                  options = null;
                }

                if (type === 'request') {
                  var wrapper = function(env, next) {
                    if (!env.resource.responseType) {
                      var negotiator = new Negotiator(env.request);
                      var preferred = negotiator.preferredMediaType(produces);
                      env.resource.responseType = preferred;
                    }

                    if (env.resource.requestType) {
                      return fn(env, next);
                    }

                    var methods = ['PUT', 'POST', 'PATCH'];
                    if (methods.indexOf(env.request.method) !== -1) {
                      if (env.request.headers['content-type'] && consumes
                          && consumes.indexOf(env.request.headers['content-type']) == -1) {
                        env.response.statusCode = 415;
                        env.resource.error = { message: 'Unsupported Media Type', supported: consumes };
                        env.resource._skipHandler = true;
                        return next(env);
                      } else {
                        env.resource.requestType = env.request.headers['content-type'];

                        fn(env, next);
                      }
                    } else {
                      fn(env, next);
                    }
                  };

                  handle(type, options, wrapper);
                } else {
                  handle(type, options, fn);
                }
              });
            };

            server[m](obj.path, hijacker);*/
          } else {
            var oldObj = obj;
            server[m](obj.path, function(handle) {
              var obj = {};

              Object.keys(oldObj).forEach(function(key) {
                obj[key] = oldObj[key];
              });

              handle('request', function(env, next) {
                var pipeline = pipeworks()
                  .fit(function(context, next) {
                    context.env.resource.next = context.next;
                    context.env.resource.current = context.obj;
                    context.env.resource.handler = context.handler;

                    var pre = context.env.pipeline('resource:request:before');
                    if (pre) {
                      pre.siphon(context.env, function(env) {
                        context.env = env;
                        context.obj = env.resource.current;
                        context.next = env.resource.next;
                        context.handler = env.resource.handler;
                        next(context);
                      });
                    } else {
                      next(context);
                    }
                  })
                  .fit(function(context, next) {
                    if (context.env.resource._skip) {
                      return next(context);
                    }

                    if (!context.env.resource.responseType) {
                      var negotiator = new Negotiator(context.env.request);
                      var preferred = negotiator.preferredMediaType(produces);
                      context.env.resource.responseType = preferred;
                    }

                    if (context.env.resource.requestType) {
                      return context.handler(context.env, function(env) {
                        context.env = env;
                        context.obj = env.resource.current;
                        context.next = env.resource.next;
                        context.handler = env.resource.handler;
                        next(context);
                      });
                    }

                    var methods = ['PUT', 'POST', 'PATCH'];
                    if (methods.indexOf(context.env.request.method) !== -1) {
                      if (context.env.request.headers['content-type'] && consumes
                          && consumes.indexOf(context.env.request.headers['content-type']) == -1) {
                        context.env.response.statusCode = 415;
                        context.env.resource.error = { message: 'Unsupported Media Type', supported: consumes };

                        return next(context);
                      } else {
                        context.env.resource.requestType = env.request.headers['content-type'];
                      }
                    }

                    context.handler(context.env, function(env) {
                      context.env = env;
                      context.obj = env.resource.current;
                      context.next = env.resource.next;
                      context.handler = env.resource.handler;
                      next(context);
                    });
                  })
                  .fit(function(context, next) {
                    var post = context.env.pipeline('resource:request:after');
                    if (post) {
                      post.siphon(context.env, function(env) {
                        context.env = env;
                        context.obj = env.resource.current;
                        context.next = env.resource.next;
                        context.handler = env.resource.handler;
                        next(context);
                      });
                    } else {
                      next(context);
                    }
                  })
                  .fit(function(context, next) {
                    context.next(context.env);
                  });

                var context = { env: env, next: next, obj: obj, handler: handler };
                pipeline.flow(context);
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
