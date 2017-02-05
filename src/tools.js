var User = require('../models/user');
var Follow = require('../models/follow');

function error(res,err) {
  res.json({err: err});
}

var models = {
  User: User,
};

function confirm(id, type, cb) {
  var model = models[type];
  if (!model) {
    return cb("Model '" + type + "' not found");
  }
  model.findById(id, function (err, item) {
    if (err) throw err;
    if (!item) {
      return cb(type + " '" + id + "' does not exist.");
    }
    cb();
  });
}

module.exports = {error,confirm};