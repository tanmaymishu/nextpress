// Mock for BullMQ used in tests
class MockQueue {
  constructor(name, options) {
    this.name = name;
    this.options = options;
  }

  async add(jobName, data, options) {
    // In tests, just resolve immediately
    return Promise.resolve({ id: Date.now(), name: jobName, data });
  }

  async close() {
    return Promise.resolve();
  }

  async obliterate() {
    return Promise.resolve();
  }
}

class MockWorker {
  constructor(queueName, processor, options) {
    this.queueName = queueName;
    this.processor = processor;
    this.options = options;
  }

  async close() {
    return Promise.resolve();
  }

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

class MockJob {
  constructor(queue, name, data, options) {
    this.queue = queue;
    this.name = name;
    this.data = data;
    this.options = options;
    this.id = Date.now();
  }

  async updateProgress(progress) {
    return Promise.resolve();
  }

  async log(message) {
    return Promise.resolve();
  }
}

module.exports = {
  Queue: MockQueue,
  Worker: MockWorker,
  Job: MockJob
};