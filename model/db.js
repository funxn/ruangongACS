var mongoose = require('mongoose');

var dbURI = 'mongodb://localhost:27999/PoemsShow';
var dbOptions = {
	'user': 'PSAdmin', 
	'pass': '222333'
}

mongoose.connect(dbURI, dbOptions);

mongoose.connection.on('connected', function () {
     console.log('Mongoose connected to ' + dbURI);
});
mongoose.connection.on('error',function (err) {
      console.log('Mongoose connection error: ' + err);
});
mongoose.connection.on('disconnected', function () {
      console.log('Mongoose disconnected');
});
process.on('SIGINT', function() {
      mongoose.connection.close(function () {
          console.log('Mongoose disconnected through app termination');
          process.exit(0);   
       });
});

module.exports = mongoose;
