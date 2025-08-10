// Mock for ioredis Redis client used in tests
class MockRedis {
  constructor(config) {
    this.config = config;
    this.data = new Map();
  }

  async connect() {
    return Promise.resolve();
  }

  async disconnect() {
    return Promise.resolve();
  }

  async get(key) {
    return this.data.get(key) || null;
  }

  async set(key, value, ...args) {
    this.data.set(key, value);
    return 'OK';
  }

  async del(key) {
    return this.data.delete(key) ? 1 : 0;
  }

  async exists(key) {
    return this.data.has(key) ? 1 : 0;
  }

  async keys(pattern) {
    if (pattern === '*') {
      return Array.from(this.data.keys());
    }
    // Simple pattern matching for basic cases
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.data.keys()).filter(key => regex.test(key));
  }

  async flushall() {
    this.data.clear();
    return 'OK';
  }

  async expire(key, seconds) {
    // In a real implementation, you'd set a timeout to delete the key
    // For tests, we'll just return 1 to indicate success
    return this.data.has(key) ? 1 : 0;
  }

  // Session store methods
  async hget(key, field) {
    const hash = this.data.get(key);
    return hash && hash[field] || null;
  }

  async hset(key, field, value) {
    let hash = this.data.get(key);
    if (!hash) {
      hash = {};
      this.data.set(key, hash);
    }
    hash[field] = value;
    return 1;
  }

  async hdel(key, field) {
    const hash = this.data.get(key);
    if (hash && field in hash) {
      delete hash[field];
      return 1;
    }
    return 0;
  }

  // Event emitter methods for compatibility
  on(event, callback) {
    return this;
  }

  emit(event, ...args) {
    return this;
  }

  removeAllListeners() {
    return this;
  }
}

// Export both as default and named export for compatibility with different import styles
module.exports = MockRedis;
module.exports.default = MockRedis;