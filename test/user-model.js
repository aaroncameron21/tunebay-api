var expect = require('chai').expect;
var request = require('supertest');

var User = require('../models/user');
var Follow = require('../models/follow');
var Project = require('../models/project');

describe('User model', function () {

    // beforeEach(function () {
    //     server = require('../server');
    // });
    // afterEach(function () {
    //     server.close();
    // });
    
    process.test = true;
    var server = require('../server');

    describe('authenticate', function () {

        it('passes true if correct password', function() {

            var user = new User();
            user.loadData({
                username: 'authuser',
                email: 'authuser@test.com',
                password: 'password'
            });
            user.save().then(
                function(newUser) {
                    user = newUser;
                    user.authenticate('authuser@test.com','password',function(err,isMatch) {
                        if (err) throw err;
                        expect(isMatch).to.be.true;
                    });
                },
                function(err) {
                    throw err;
                }
            );
        });

        it('passes false if incorrect password', function() {

            var user = new User();
            user.loadData({
                username: 'authuser2',
                email: 'authuser2@test.com',
                password: 'password'
            });
            user.save().then(
                function(newUser) {
                    user = newUser;
                    user.authenticate('authuser2@test.com','incorrect',function(err,isMatch) {
                        if (err) throw err;
                        expect(isMatch).to.be.false;
                    });
                },
                function(err) {
                    throw err;
                }
            );
        });

    });

    server.close();

});