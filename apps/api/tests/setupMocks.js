// Set up Jest mocks for ioredis using the official ioredis-mock library
jest.mock('ioredis', () => require('ioredis-mock'));