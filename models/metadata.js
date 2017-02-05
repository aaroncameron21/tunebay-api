var setMetaDates = function(next) {

    var currentDate = new Date();
    this.dateModified = currentDate;
    this.dateCreated = this.dateCreated || currentDate;
    next();

};


module.exports = {setMetaDates};
