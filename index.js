/*
 * Primary file for Homework Assignment #2 APIs
 * Points that have not completed in this version:
 * Integrated with stripe.com
 * Delete shopping carts once user deleted (shopping carts should be named by user email)
 */

// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');

// Declare the app
var app = {};

// Init function
app.init = function(){

  // Start the server
  server.init();

  // Start the workers
  // workers.init();

};

// Self executing
app.init();


// Export the app
module.exports = app;
