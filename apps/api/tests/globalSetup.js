// Global setup - runs ONCE before ALL tests
module.exports = async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  require('dotenv').config({ path: '.env.test' });
};
