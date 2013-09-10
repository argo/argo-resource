var path = require('path');
var url = require('url');

var Products = module.exports = function(products) {
  this.products = products ||
    [{ id: 1, name: 'Shinola Fanny Pack' }];
};

Products.prototype.init = function(config) {
  config
    /* root */
    .path('/store/products')
    .produces('application/json')
    /* collection */
    .get(this.list)
    .post({
      consumes: ['application/json'],
      handler: this.create
    })
    /* item */
    .get('/{id}', this.show)
    .put('/{id}', {
      consumes: ['application/json'],
      handler: this.update,
    })
    .del('/{id}', this.remove)
    /* function binding */
    .bind(this);
};

Products.prototype.list = function(env, next) {
  env.response.body = this.products;
  next(env);
};

Products.prototype.create = function(env, next) {
  var self = this;
  env.request.getBody(function(err, body) {
    if (err || !body) {
      env.response.statusCode = 400;
      return next(env);
    }

    var obj = JSON.parse(body.toString());
    self.products.push(obj);
    
    var parsed = url.parse(env.argo.uri());
    parsed.pathname = path.join(parsed.pathname, obj.id.toString());
    parsed.search = parsed.hash = parsed.auth = '';
    
    var location = url.format(parsed);

    env.response.statusCode = 201;
    env.response.setHeader('Location', location);

    next(env);
  });
};

Products.prototype.show = function(env, next) {
  var key = parseInt(env.request.params.id);

  var filtered = this.products.filter(function(p) {
    return p.id === key;
  });

  if (filtered.length) {
    env.response.body = filtered[0];
  } else {
    env.response.statusCode = 404;
  }

  next(env);
};

Products.prototype.update = function(env, next) {
  var key = parseInt(env.request.params.id);

  var index;
  this.products.forEach(function(p, i) {
    if (p.id === key) {
      index = i;
    }
  });

  if (index) {
    var self = this;
    env.request.getBody(function(err, body) {
      if (err || !body) {
        env.response.statusCode = 400;
      } else {
        self.products[index] = JSON.parse(body);
        env.response.statusCode = 200;
        env.response.body = self.products[index];
      }

      next(env);
    });
  } else {
    env.response.statusCode = 404;
    next(env);
  }
};

Products.prototype.remove = function(env, next) {
  var key = parseInt(env.request.params.id);

  var index;

  for (var i = 0; i < this.products.length; i++) {
    if (this.products[i].id === key) {
      index = i;
    }
  }

  if (index) {
    this.products.splice(index, 1);
    env.response.statusCode = 204;
  } else {
    env.response.statusCode = 404;
  }

  next(env);
};
