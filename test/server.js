
var expect = require('chai').expect;
var request = require('supertest');

var User = require('../models/user');
var Follow = require('../models/follow');
var Project = require('../models/project');

describe('Server', function () {

    process.test = true;
    var server = require('../server');

    it('responds to /', function(done) {
        request(server)
            .get('/')
            .expect(200, done);
    });

    it('responds 404 to routes not found', function(done) {
        request(server)
            .get('/foo/bar')
            .expect(404, done);
    });

    server.close();

});