module.exports = function(handle) {
  handle('resource:request:before', function(env, next) {
    var operation = env.resource.current.operation;

    if (!env.auth.isAuthenticated) {
      env.resource.skip(true);
      next(env);
    } else if (operation && env.auth.user) {
      if (!env.auth.user.operations
          || env.auth.user.operations.indexOf(operation) === -1) {
        env.resource.skip(true);

        env.response.statusCode = 403;
        env.resource.forbidden = operation;
        next(env);
      } else {
        next(env);
      }
    } else {
      next(env);
    }
  });
};
