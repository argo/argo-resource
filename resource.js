var ResourceConfig = function() {
  this.$path = null;
  this.$gets = [];
  this.$posts = [];
  this.thisArg = null;
};

ResourceConfig.prototype.path = function(path) {
  if (path[0] !== '/') {
    path = '/' + path;
  }

  this.$path = path;
  return this;
};

ResourceConfig.prototype.get = function(path, fn, thisArg) {
  if (typeof path === 'function') {
    thisArg = fn;
    fn = path;
    path = '/';
  }

  if (path[0] !== '/') {
    path = '/' + path;
  }

  this.$gets.push({ path: path, thisArg: thisArg, handler: fn });
  return this;
};

ResourceConfig.prototype.post = function(path, fn, thisArg) {
  if (typeof path === 'function') {
    thisArg = fn;
    fn = path;
    path = '/';
  }

  if (path[0] !== '/') {
    path = '/' + path;
  }

  this.$posts.push({ path: path, thisArg: thisArg, handler: fn });
  return this;
};

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
            config.$gets.forEach(function(get) {
              var thisArg = get.thisArg || config.thisArg;
              server.get(get.path, function(handle) {
                handle('request', get.handler.bind(thisArg));
              });
            });

            config.$posts.forEach(function(post) {
              var thisArg = post.thisArg || config.thisArg;
              server.post(post.path, function(handle) {
                handle('request', post.handler.bind(thisArg));
              });
            });
          });
      }
    };
  };

  return { package: pkg };
};
