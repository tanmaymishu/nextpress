// Set up Jest mocks for Redis using redis-memory-server for local development
// or GitHub Actions Redis service in CI
const { RedisMemoryServer } = require('redis-memory-server');

let redisServer;

beforeAll(async () => {
  // Check if running in CI with Redis service available
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  
  if (isCI) {
    // In CI, use the Redis service (localhost:6379)
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    console.log('Using CI Redis service at localhost:6379');
  } else {
    // For local development, use redis-memory-server
    console.log('Starting redis-memory-server for local testing...');
    redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    
    process.env.REDIS_HOST = host;
    process.env.REDIS_PORT = port.toString();
    console.log(`Redis memory server started at ${host}:${port}`);
  }
  
  // Now that Redis server is available, connect the Redis client
  const { redisClient } = require('../src/app');
  if (!redisClient.isReady) {
    await redisClient.connect();
    console.log('Redis client connected successfully');
  }
}, 30000); // Increased timeout for Redis server setup

afterAll(async () => {
  // Disconnect Redis client
  try {
    const { redisClient } = require('../src/app');
    if (redisClient.isReady) {
      await redisClient.destroy();
      console.log('Redis client disconnected');
    }
  } catch (error) {
    console.log('Error disconnecting Redis client:', error.message);
  }
  
  // Clean up Redis memory server (only if we created one)
  if (redisServer) {
    await redisServer.stop();
    console.log('Redis memory server stopped');
  }
});