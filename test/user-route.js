var expect = require('chai').expect;
var request = require('supertest');

var User = require('../models/user');
var Follow = require('../models/follow');
var Project = require('../models/project');

describe('User endpoints', function () {

    // beforeEach(function () {
    //     server = require('../server');
    // });
    // afterEach(function () {
    //     server.close();
    // });
    
    process.test = true;
    var server = require('../server');

    var userId;
    var userId2;

    it('POST /user creates user', function() {
        return request(server)
            .post('/user')
            .send({ username: 'username', email: 'test@email.com', password: 'test' })
            .expect(200)
            .then(response => {
                userId = response.body._id;
                expect(response.body.username).to.equal('username');
                expect(response.body.email).to.equal('test@email.com');
                expect(response.body.password).to.not.exist;
            });
    });

    it('POST /user does not create user if username exists', function() {
        return request(server)
            .post('/user')
            .send({ username: 'username', email: 'different@email.com', password: 'test' })
            .expect(200)
            .then(response => {
                expect(response.body.err).to.exist;
            });
    });

    it('POST /user does not create user if email exists', function() {
        return request(server)
            .post('/user')
            .send({ username: 'different', email: 'test@email.com', password: 'test' })
            .expect(200)
            .then(response => {
                expect(response.body.err).to.exist;
            });
    });

    it('GET /user/:userId gets user', function() {
        return request(server)
            .get('/user/' + userId)
            .expect(200)
            .then(response => {
                expect(response.body.username).to.equal('username');
                expect(response.body.email).to.equal('test@email.com');
                expect(response.body.password).to.not.exist;
            });
    });

    it('POST /user/:user_id updates user', function() {
        return request(server)
            .post('/user/' + userId)
            .send({ username: 'updated', email: 'updated@email.com', password: 'updated' })
            .expect(200)
            .then(response => {
                expect(response.body.username).to.equal('updated');
                expect(response.body.email).to.equal('updated@email.com');
                expect(response.body.password).to.not.exist;
            });
    });

    it('POST /user/:user_id returns error if validation fails', function() {
        return request(server)
            .post('/user/' + userId)
            .send({ username: 'abc', email: 'updated@email.com', password: 'updated' })
            .expect(200)
            .then(response => {
                expect(response.body.err).to.exist;
            });
    });

    it('POST /user/:userId/follow follows user', function(done) {
        var user = new User();
        user.loadData({ username: 'username2', email: 'test2@email.com', password: 'test' });
        user.save().then(
            function(user) {
                userId2 = user._id;
                request(server)
                    .post('/user/' + userId + '/follow')
                    .send({ follow_id: user._id, type: 'User' })
                    .expect(200)
                    .end(function(err, response) {
                        expect(response.body.from).to.equal(String(userId));
                        expect(response.body.to).to.equal(String(user._id));
                        done();
                    });       

            },function(err) {done(err);}
        );
    });

    it('POST /user/:userId/follow to return error if exists already', function(done) {
        request(server)
            .post('/user/' + userId + '/follow')
            .send({ follow_id: userId2, type: 'User' })
            .expect(200)
            .end(function(err, response) {
                expect(response.body.err).to.exist;
                done();
            });       
    });

    it('GET /user/:userId/following gets users that user is following', function(done) {
        request(server)
            .get('/user/' + userId + '/following')
            .expect(200)
            .end(function(err,response) {
                expect(response.body.length).to.equal(1);
                expect(response.body[0].from).to.equal(String(userId));
                expect(response.body[0].to._id).to.equal(String(userId2));
                done();
            });
    });

    it('GET /user/:userId/followers gets user\'s followers', function(done) {
        request(server)
            .get('/user/' + userId2 + '/followers')
            .expect(200)
            .end(function(err,response) {
                expect(response.body.length).to.equal(1);
                expect(response.body[0].from._id).to.equal(String(userId));
                expect(response.body[0].to).to.equal(String(userId2));
                done();
            });
    });

    it('POST /user/:userId/unfollow returns error if follow not found', function(done) {
        request(server)
            .post('/user/' + userId + '/unfollow')
            .send({ follow_id: 'fake', type: 'User' })
            .expect(200)
            .end(function(err, response) {
                expect(response.body.err).to.exist;
                done();
            });       
    });

    it('POST /user/:userId/unfollow unfollows user', function(done) {
        request(server)
            .post('/user/' + userId + '/unfollow')
            .send({ follow_id: userId2, type: 'User' })
            .expect(200)
            .end(function(err, response) {
                expect(response.body.ok).to.equal(1);
                expect(response.body.n).to.equal(1);
                done();
            });       
    });

    it('GET /user/all should return all users', function(done) {
        request(server)
            .get('/user/all')
            .expect(200)
            .end(function(err,response) {
                User.find(function(err,allUsers) {
                    expect(response.body.length).to.equal(allUsers.length);
                    done();
                });
            });
    });

    it('GET /user should return error', function(done) {
        request(server)
            .get('/user')
            .expect(200)
            .end(function(err,response) {
                expect(response.body.err).to.exist;
                done();
            });
    });

    it('POST /user/:userId/follow returns error with incorrect type', function(done) {
        request(server)
            .post('/user/' + userId + '/follow')
            .send({ follow_id: userId2, type: 'Wrong' })
            .expect(200)
            .end(function(err, response) {
                expect(response.body.err).to.exist;
                done();
            });       
    });

    server.close();

});