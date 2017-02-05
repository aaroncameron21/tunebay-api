var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend');

mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;
bcrypt = require('bcrypt');
SALT_WORK_FACTOR = 10;
MAX_LOGIN_ATTEMPTS = 5,
LOCK_TIME = 2 * 60 * 60 * 1000;

var userSchema = new Schema({

    username: {type: String, required: true, index: {unique: true}},
    email:    {type: String, required: true, index: {unique: true}},
    password: {type: String, required: true},

    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Number },

    dateCreated:  {type: Date, required: true},
    dateModified: {type: Date, required: true}

});


userSchema.methods.loadData = function(data) {

    this.username = data.username;
    this.email = data.email;
    this.password = data.password;

    var currentDate = new Date();
    this.dateModified = currentDate;
    this.dateCreated = this.dateCreated || currentDate;

};

userSchema.path('username').validate(function (value) {
    return (value.length <= 20 && value.length >= 4);
});

userSchema.methods.toPublic = function() {
    var user = this.toObject();
    delete user.loginAttempts;
    delete user.lockUntil;
    delete user.password;
    return user;
};

userSchema.statics.random = function(callback) {
  this.count(function(err, count) {
    if (err) {
      return callback(err);
    }
    var rand = Math.floor(Math.random() * count);
    this.findOne().skip(rand).exec(callback);
  }.bind(this));
};

userSchema.virtual('isLocked').get(function() {
    // check for a future lockUntil timestamp
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incLoginAttempts = function(callback) {
    // if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }, callback);
    }
    // otherwise we're incrementing
    var updates = { $inc: { loginAttempts: 1 } };
    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    }
    return this.update(updates, callback);
};

userSchema.methods.comparePassword = function(givenPassword, callback) {
  bcrypt.compare(givenPassword, this.password, function(err, isMatch) {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

userSchema.statics.reasons = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
};

var reasons = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
};

userSchema.statics.authenticate = function(email, password, callback) {
    this.findOne({ email: email }, function(err, user) {
        if (err) return callback(err);

        // make sure the user exists
        if (!user) {
            return callback(null, null, reasons.NOT_FOUND);
        }

        // check if the account is currently locked
        if (user.isLocked) {
            // just increment login attempts if account is already locked
            return user.incLoginAttempts(function(err) {
                if (err) return callback(err);
                return callback(null, null, reasons.MAX_ATTEMPTS);
            });
        }

        // test for a matching password
        user.comparePassword(password, function(err, isMatch) {
            if (err) return callback(err);

            // check if the password was a match
            if (isMatch) {
                // if there's no lock or failed attempts, just return the user
                if (!user.loginAttempts && !user.lockUntil) return callback(null, user);
                // reset attempts and lock info
                var updates = {
                    $set: { loginAttempts: 0 },
                    $unset: { lockUntil: 1 }
                };
                return user.update(updates, function(err) {
                    if (err) return callback(err);
                    return callback(null, user);
                });
            }

            // password is incorrect, so increment login attempts before responding
            user.incLoginAttempts(function(err) {
                if (err) return callback(err);
                return callback(null, null, reasons.PASSWORD_INCORRECT);
            });
        });
    });
};

userSchema.pre('save',function(next) {
    var user = this;
    if (!user.isModified('password')) return next();
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
        // hash the password along with our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    })
});

var User = mongoose.model('User',userSchema);

module.exports = User;
