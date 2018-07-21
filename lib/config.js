/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsAssignment2',
  'mailgun' : {
    'api_key' : '400a3e4b7e99b82f7de9382fc0bf9a31-8889127d-f4b3aa3d',
    'domain' : 'sandbox0302acbedb654e6aa4208a65c9aec6ce.mailgun.org',
    'from_who' : 'your-pizza@email.com'
  }
};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAssignment2',
  'mailgun' : {
    'api_key' : '400a3e4b7e99b82f7de9382fc0bf9a31-8889127d-f4b3aa3d',
    'domain' : 'sandbox0302acbedb654e6aa4208a65c9aec6ce.mailgun.org',
    'from_who' : 'your-pizza@email.com'
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
