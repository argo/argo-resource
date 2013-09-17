module.exports = function(handle) {
  handle('request', function(env, next) {
    var auth;

    env.auth = env.auth || {};

    var authHeader = env.request.headers['authorization'];
    if (authHeader) {
      auth = authHeader.split(/\s/);
    }

    if (!auth || auth[0].toLowerCase() !== 'basic') {
      setError(env);
      next(env);
    } else {
      var credentials = new Buffer(auth[1], 'base64').toString().split(':');
      var username = credentials[0];
      var password = credentials[1];

      if (username === 'kevin' && password === 'swiber') {
        env.auth.user = {
          username: username,
          operations: ['rest.products.list', 'rest.products.item.remove', 'rest.products.create']
        };

        env.auth.isAuthenticated = true;

        next(env);
      } else {
        setError(env);
        next(env);
      }
    }
  });
};

function setError(env) {
  env.auth.isAuthenticated = false;
  env.response.statusCode = 401;
  env.response.setHeader('WWW-Authenticate', 'Basic Realm="Realm"');
};
