var fs = require('fs');
var http = require('http');
var https = require('https');
var async = require('async');
var mongoose = require('mongoose');

var express = require('express');

var Follow = require('./models/follow');
var Project = require('./models/project');
var User = require('./models/user');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/tunebay',function(err) {
    if (err) throw err;
    // console.log("> Mongoose Ready");
});

var app = express();

// Give access to the following directories:
app.use(express.static(__dirname + '/node_modules'));

app.get('/',function(req,res) {
    return res.send('Tunebay API');
});

app.use('/user',require('./routes/user')());

app.use(function(req,res) {
    return res.sendStatus(404);
});

// app.use(function(req,res,next){console.log("C");next();});

var httpServer = http.createServer(app);
httpServer.listen(8080);

module.exports = httpServer;
 
