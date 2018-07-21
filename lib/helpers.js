/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require('./config');
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var Mailgun = require('mailgun-js');

//Your api key, from Mailgun’s Control Panel
//Your api key, from Mailgun’s Control Panel
//var api_key = '400a3e4b7e99b82f7de9382fc0bf9a31-8889127d-f4b3aa3d';

//Your domain, from the Mailgun Control Panel
//var domain = 'sandbox0302acbedb654e6aa4208a65c9aec6ce.mailgun.org';

//Your sending email address
//var from_who = 'postmaster@sandbox0302acbedb654e6aa4208a65c9aec6ce.mailgun.org';
//Your sending email address
//var from_who = 'your-pizza@email.com';

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

helpers.sendNotificationEmail = function(email, data2send, callback) {
  //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
  var mailgun = new Mailgun({apiKey: config.mailgun.api_key, domain: config.mailgun.domain});

  var data = {
    //Specify email data
    from: config.mailgun.from_who,
    //The email to contact
    to: email,
    //Subject and text data  
    subject: data2send.subject,
    html: data2send.body
  }

  //Invokes the method to send emails given the above data with the helper library
  mailgun.messages().send(data, function (err, body) {
    //If there is an error, render the error page
    if (err) {
        console.log("got an error: ", err);
        callback(500, {'error': 'error sending emails.'});
    }
    //Else we can greet    and leave
    else {
        callback(200);
        console.log(body);
    }
  });
}



// Export the module
module.exports = helpers;
