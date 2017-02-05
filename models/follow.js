var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend');

mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

var followSchema = new Schema({

    from: {type: String, required: true, ref: 'User'},
    to:   {type: String, required: true, ref: 'User'},
    type: {type: String, required: true},

    dateCreated:  {type: Date, required: true},
    dateModified: {type: Date, required: true}

});

followSchema.methods.loadData = function(data) {

    this.from = data.from;
    this.to = data.to;
    this.type = data.type;

    var currentDate = new Date();
    this.dateModified = currentDate;
    this.dateCreated = this.dateCreated || currentDate;

};

var Follow = mongoose.model('Follow',followSchema);

module.exports = Follow;
