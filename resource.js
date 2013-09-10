var SupportedMethods = ['get','put','patch','post','del','options','trace'];

var ResourceConfig = function() {
  this.$path = null;
  this.$maps = [];

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

    return {
      name: 'ResourceConfig',
      install: function() {
        argo
          .map(config.$path, function(server) {
            config.$maps.forEach(function(obj) {
              var thisArg = obj.thisArg || config.thisArg;
              console.log(config.thisArg);
              server.map(obj.path, { methods: obj.methods }, obj.handler.bind(thisArg));
            });

            SupportedMethods.forEach(function(m) {
              var key = '$' + m + 's';
              config[key].forEach(function(obj) {
                var thisArg = obj.thisArg || config.thisArg;
                var isHandler = (obj.handler.length === 1)/* function(handle) */;
                if (isHandler) {
                  server[m](obj.path, obj.handler.bind(thisArg));
                } else {
                  server[m](obj.path, function(handle) {
                    handle('request', obj.handler.bind(thisArg));
                  });
                }
              });
            });
          });
      }
    };
  };

  return { package: pkg };
};
