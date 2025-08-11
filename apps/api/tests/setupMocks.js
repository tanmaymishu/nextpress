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
  } else {
    // For local development, use redis-memory-server
    redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    process.env.REDIS_HOST = host;
    process.env.REDIS_PORT = port.toString();
  }

  // Now that Redis server is available, connect the Redis client
  const { redisClient } = require('../src/app');
  if (!redisClient.isReady) {
    await redisClient.connect();
  }
}, 30000); // Increased timeout for Redis server setup

afterAll(async () => {
  // Disconnect Redis client
  try {
    const { redisClient } = require('../src/app');
    if (redisClient.isReady) {
      await redisClient.destroy();
    }
  } catch (error) {
    console.log('Error disconnecting Redis client:', error.message);
  }

  // Clean up Redis memory server (only if we created one)
  if (redisServer) {
    await redisServer.stop();
  }
});
