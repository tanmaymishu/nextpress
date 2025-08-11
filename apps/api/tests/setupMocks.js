// Set up Jest mocks for Redis using redis-memory-server
// This provides a real Redis instance running in memory for tests
const { RedisMemoryServer } = require('redis-memory-server');

let redisServer;

beforeAll(async () => {
  // Create and start Redis memory server
  redisServer = new RedisMemoryServer();
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  
  // Set environment variables for tests to connect to the memory server
  process.env.REDIS_HOST = host;
  process.env.REDIS_PORT = port.toString();
});

afterAll(async () => {
  // Clean up Redis memory server
  if (redisServer) {
    await redisServer.stop();
  }
});