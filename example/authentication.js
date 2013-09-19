module.exports = function(handle) {
  handle('auth:basic:setup', function(env, next) {
    env.auth = env.auth || {};
    env.auth.realm = 'Store';
    env.auth.authenticate = function(username, password, cb) {
      if (username === 'kevin' && password === 'swiber') {
        var user = {
          username: username,
          operations: ['products:list', 'products:create', 'products:show']
        };

        cb(null, user);
      } else {
        cb();
      }
    };

    next(env);
  });
};
