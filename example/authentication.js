module.exports = function(handle) {
  handle('auth:basic:setup', function(env, next) {
    env.auth = env.auth || {};
    env.auth.realm = 'Store';
    env.auth.authenticate = function(username, password, cb) {
      if (username === 'kevin' && password === 'swiber') {
        var operations = {
          listProducts: 'rest.products.list',
          removeProduct: 'rest.products.remove',
          createProduct: 'rest.products.create',
          updateProduct: 'rest.products.update',
          showProduct: 'rest.products.show'
        };

        var user = {
          username: username,
          operations: [operations.listProducts, operations.createProduct, operations.showProduct]
        };

        cb(null, user);
      } else {
        cb();
      }
    };

    next(env);
  });
};
