module.exports = function(handle) {
  handle('request', function(env, next) {
    env.auth = env.auth || {};
    env.auth.realm = 'Store';
    env.auth.authenticate = function(username, password, cb) {
      if (username === 'kevin' && password === 'swiber') {
        var operations = {
          listProducts: 'rest.products.list',
          removeProduct: 'rest.products.item.remove',
          createProduct: 'rest.products.create'
        };

        var user = {
          username: username,
          operations: [operations.listProducts, operations.createProduct]
        };

        cb(null, user);
      } else {
        cb();
      }
    };

    next(env);
  });
};
