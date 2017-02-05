var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var csurf = require('csurf');
var express = require('express');
var extend = require('xtend');
var xlsx = require('xlsx');
const objectAssign = require('object-assign');
var async = require('async');

var User = require('../models/user');
var Follow = require('../models/follow');

function error(err) {
  _res.json({err: err});
}

var models = {
  User: User,
};

function confirm(user_id, type, cb) {
  var model = models[type];
  if (!model) {
    return error("Model '" + type + "' not found");
  }
  model.findById(user_id, function (err, user) {
    if (err) throw err;
    if (!user) {
      return cb(type + " '" + user_id + "' does not exist.");
    }
    cb();
  });
}

var _req,_res;
module.exports = function profile() {

  var router = express.Router();
  router.use(cookieParser());
  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json());
  // router.use(csurf({ cookie: true }));
  router.use(function(req,res,next) {
    _req = req;
    _res = res;
    next();
  });

  router.get('/', function(req, res) {
    res.json({
      err: 'Incorrect usage of user endpoint'
    });
  });

  router.get('/all', function(req, res) {
    User.find({},
      {
        password: false,
        loginAttempts: false,
        lockUntil: false
      },
      function (err, users) {
        if (err) throw err;
        res.json(users);
      });
  });

  router.get('/:user_id/followers', function(req, res) {
    Follow.find({ to: { $eq: req.params.user_id } })
      .populate('from', { password: false, loginAttempts: false, lockUntil: false })
      .exec(function (err, follows) {
        if (err) throw err;
        res.json(follows);
      });
  });

  router.get('/:user_id/following', function(req, res) {
    Follow.find({ from: { $eq: req.params.user_id } })
      .populate('to', { password: false, loginAttempts: false, lockUntil: false })
      .exec(function (err, follows) {
        if (err) throw err;
        res.json(follows);
      });
  });

  router.get('/:user_id', function(req, res) {
    User.findById(req.params.user_id, function (err, user) {
      if (err) throw err;
      res.json(user.toPublic());
    });
  });

  router.post('/:user_id/follow', function(req, res) {
    async.parallel([
      function (cb) {
        confirm(req.params.user_id, 'User', cb);
      },
      function (cb) {
        confirm(req.body.follow_id, req.body.type, cb);
      },
      function (cb) {
        Follow.findOne({
          from: { $eq: req.params.user_id },
          to: { $eq: req.body.follow_id },
          type: { $eq: req.body.type }
        }, function (err, follow) {
          if (err) throw err;
          if (follow) {
            return cb("follow already exists");
          }
          cb();
        });
      },
    ], function (err) {
      if (err) return error(err);
      var follow = new Follow();
      follow.loadData({
        from: req.params.user_id,
        to: req.body.follow_id,
        type: req.body.type
      });
      follow.save().then(
        function (follow) {
          res.json(follow);
        },
        function (reason) {
          res.json('Could not create follow: ' + reason);
        }
      );
    });
  });

  router.post('/:user_id/unfollow', function(req, res) {
    Follow.findOne({
      from: { $eq: req.params.user_id },
      to: { $eq: req.body.follow_id },
      type: { $eq: req.body.type }
    })
      .remove()
      .exec(
        function (err, follow) {
          if (err) throw err;
          if (!follow) {
            return error("could not delete follow");
          }
          res.json(follow);
        }
      );
  });

  router.post('/',function(req, res) {
    var user = new User();
    user.loadData(req.body);
    user.save().then(
      function(user) {
        return res.json(user.toPublic());
      },
      function(err) {
        return res.json(err);
      }
    );
  });

  router.post('/:user_id',function(req, res) {
    User.findById(req.params.user_id,function(err,user) {
      user.loadData(req.body);
      user.save().then(
        function(user) {
          return res.json(user.toPublic());
        },
        function(err) {
          return res.json(err);
        }
      );
    });
  });

  // router.use(soa.handleCSRF(soa.respond));
  return router;
};
