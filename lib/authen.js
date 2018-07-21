// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
//var config = require('./config');

// Define all the handlers
var authen = {};

//Login API - via POST
authen.login = function(data, callback) {
  var acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1 ) {
    authen._authen[data.method](data, callback);
  } else {
    callback(405);
  }
}

//Logout API - via GET
authen.logout = function(data, callback) {
  var acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1 ) {
    authen._authen[data.method](data, callback);
  } else {
    callback(405);
  }
}

//authentication methods
authen._authen = {};

//authentication - login
// Required data: email, password (password should be hashed, but not now at the moment)
// return token
authen._authen.post = function(data, callback) {
// Check that all required fields are filled out
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if(email && password){
    // get user information
    _data.read('users',email,function(err,data){
      //if user found
      if(!err && data) {
        // Hash the password
        var hashedPassword = helpers.hash(password);

        //check if password match
        if (hashedPassword == data.hashedPassword) {
          //create and return new token
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'email' : email,
            'id' : tokenId,
            'expires' : expires
          };

          // Store the token
          _data.create('tokens',tokenId,tokenObject,function(err){
            if(!err){
              //return token
              callback(200, tokenObject);
            } else {
              callback(500,{'Error' : 'Could not create the new token'});
            }  
            });          
        } else {
          callback(404, {'Error': 'email and password not correct'})
        }
      } else {
          callback(500,{'Error' : 'Could not find the user.'});
      }      
    });

  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }
}

//authentication - logout
// Required data: email, token
// clear the token
authen._authen.get = function(data, callback) {
// Check that all required fields are filled out
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length > 0 ? data.headers.token.trim() : false;

  if(email && token){
    // Lookup the token
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        // Delete the token
        _data.delete('tokens',token,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified token.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }
}

// Export the handlers
module.exports = authen;