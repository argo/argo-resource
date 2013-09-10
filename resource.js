var SupportedMethods = ['get','put','patch','post','del','options','trace'];

var ResourceConfig = function() {
  this.$path = null;

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

SupportedMethods.forEach(function(m) {
  ResourceConfig.prototype[m] = function(path, fn, thisArg) {
    if (typeof path === 'function') {
      thisArg = fn;
      fn = path;
      path = '/';
    }

    if (path[0] !== '/') {
      path = '/' + path;
    }

    var key = '$' + m + 's';
    this[key].push({ path: path, thisArg: thisArg, handler: fn });
    return this;
  };
});

ResourceConfig.prototype.produces = function() {
  return this;
};

ResourceConfig.prototype.bind = function(thisArg) {
  this.thisArg = thisArg
  return this;
};

ResourceConfig.create = function(cons) {
  return new ResourceConfig();
};

exports.of = function(/* constructor, ...constructorArgs */) {
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

    return {
      name: 'ResourceConfig',
      install: function() {
        argo
          .map(config.$path, function(server) {
            SupportedMethods.forEach(function(m) {
              var key = '$' + m + 's';
              config[key].forEach(function(obj) {
                var thisArg = obj.thisArg || config.thisArg;
                server[m](obj.path, function(handle) {
                  handle('request', obj.handler.bind(thisArg));
                });
              });
            });
          });
      }
    };
  };

  return { package: pkg };
};
