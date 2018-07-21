/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all the handlers
var handlers = {};

// Ping
handlers.ping = function(data,callback){
  setTimeout(function(){
    callback(200);
  },5000);

};

// Not-Found
handlers.notFound = function(data,callback){
  callback(404);
};

// Users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users  = {};

// Users - post
// Required data: email, name, address, password
// Optional data: none
handlers._users.post = function(data,callback){
  // Check that all required fields are filled out
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  console.log('email: ', email);
  console.log('name:' + name);
  console.log('address ' + address);
  console.log('password ' + password);

  if(email && name && address && password){
    // Make sure the user doesnt already exist
    _data.read('users',email,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'email' : email,
            'name' : name,
            'address' : address,
            'hashedPassword' : hashedPassword
          };            

          // Store the user
          _data.create('users',email,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that email already exists'});
      }
    });

  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }

};

// Required data: email
// Optional data: none
handlers._users.get = function(data,callback){
  // Check that email is valid
  //@TODO: email validation
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  console.log('email: ' + email);
  if(email){
      // Lookup the user
      _data.read('users',email,function(err,data){
          if(!err && data){
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200,data);
          } else {
            callback(404);
          }
      });        
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Required data: email
// Optional data: name, address, password (at least one must be specified)
handlers._users.put = function(data,callback){
  // Check for required field
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

  // Check for optional fields
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if email is invalid
  if(email){
    // Error if nothing is sent to update
    if(name || address || password){
      // Lookup the user
      _data.read('users',email,function(err,userData){
        if(!err && userData){
          // Update the fields if necessary
          if(name){
            userData.name = name;
          }
          if(address){
            userData.address = address;
          }
          if(password){
            userData.hashedPassword = helpers.hash(password);
          }
          // Store the new updates
          _data.update('users',email,userData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the user.'});
            }
          });
        } else {
          callback(400,{'Error' : 'Specified user does not exist.'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Email not valid.'});
  }
};

// Required data: email
// Cleanup old checks associated with the user
handlers._users.delete = function(data,callback){
  // Check that email is valid
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
    // Lookup the user
    _data.read('users',email,function(err,userData){
      if(!err && userData){
        // Delete the user's data
        _data.delete('users',email,function(err){
          if(!err){
            //@TODO // Delete each of the shopping cart associated with the user
            // the cart file should be named by user email
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified user'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified user.'});
      }   
    }); 
  } else {
    callback(400,{'Error' : 'Missing email field'})
  }
};

// Container for all the tokens methods
handlers._tokens  = {};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id,email,callback){
  // Lookup the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired
      if(tokenData.email == email && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

//menu item: return menu items (via GET)
//input: valid token
handlers.menu = function(data, callback) {
  //accept only GET method
  if (data.method == 'get') {
    // Get the token that sent the request
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid and belongs to the user who created the request    
    handlers._tokens.verifyToken(token,data.queryStringObject.email,function(tokenIsValid){
      if(tokenIsValid){
        var menuItems = {
          'Pizza' : ['Marinara', 'Margherita', 'Margherita extra', 'Chicago Pizza', 'New York Style Pizza', 'Sicilian'],
          'Drinks': ['Beer', 'Coke', 'Wine'],
          'Others': ['Spagetti', 'Potato']
        }
        console.log("This is check data",menuItems);
        // Return check data
        callback(200,menuItems);
      } else {
        callback(403);
      }
    });
  } else {
    callback(405);
  }
}

handlers._shopping = {};

handlers.shopping = function(data, callback) {
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._shopping[data.method](data,callback);
  } else {
    callback(405);
  }
}

//get shopping cart
//input: token & email & cartId
//output: Items in shopping cart
handlers._shopping.get = function(data, callback) {

}

//fill a shopping cart (POST)
//input: token & email, menu items
//output: cartId
handlers._shopping.post = function(data, callback) {
  // Get the token that sent the request
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  // Verify that the given token is valid and belongs to the user who created the request    
  handlers._tokens.verifyToken(token,data.payload.email,function(tokenIsValid){
    if(tokenIsValid){
      var items = data.payload.items;
      console.log("items in shopping cart", items);
      //create a cartId
      var cartId = helpers.createRandomString(20);      
      var shoppingCart = {
        'cartId' : cartId,
        'items' : items
      }
      _data.create('shoppingCarts',cartId,shoppingCart,function(err){
        if (!err) {
          // Return check data
          callback(200, shoppingCart);  
        } else {
          callback(500, {'Error': 'Cannot save shopping cart'});
        }
      });      
    } else {
      callback(403);
    }
  });
}

handlers._order = {};

//input: list of cartId, token, email, payment
//output: email sent to user, 
handlers.order = function(data, callback) {
  if (data.method == 'post') {
    // Get the token that sent the request
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  // Verify that the given token is valid and belongs to the user who created the request    
  handlers._tokens.verifyToken(token,data.payload.email,function(tokenIsValid){
    if(tokenIsValid){
      var cartId = data.payload.cartId;
      
      _data.read('shoppingCarts',cartId,function(err, shoppingCart){
        if (!err && shoppingCart) {
          //doing payment

          //if OK, email user
          var data2send = {
            subject: 'You order successfully from NodeJS-Pizza',
            body: 'Hello, Your order ' + cartId + ' is successfully, we\'ll deliver within 2 hours'
          }

          //Invokes the method to send emails given the above data with the helper library
          helpers.sendNotificationEmail(data.payload.email, data2send, function (err, body) {
              //If there is an error, render the error page
              if (err) {
                //res.render('error', { error : err});
                console.log("got an error: ", err);
              }
              //Else we can greet    and leave
              else {
                // Return check data
                callback(200, shoppingCart);    
              }
          });
        } else {
          callback(500, {'Error': 'Cannot save shopping cart'});
        }
      }); 
    } else {
      callback(403);
    }
  });
  } else {
    callback(405);
  }
}


// Checks
handlers.checks = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._checks[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Export the handlers
module.exports = handlers;
