var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend');

mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

var projectSchema = new Schema({

    users: {type: [String], required: true, ref: 'User'},
    title: {type: String, required: true},
    description: {type: String, required: false},

    dateCreated:  {type: Date, required: true},
    dateModified: {type: Date, required: true}

});

projectSchema.methods.loadData = function(data) {

    this.users = data.users || this.users;
    this.title = data.title || this.title;
    this.description = data.description || this.description;

    var currentDate = new Date();
    this.dateModified = currentDate;
    this.dateCreated = this.dateCreated || currentDate;

};

var Project = mongoose.model('Project',projectSchema);

module.exports = Project;
