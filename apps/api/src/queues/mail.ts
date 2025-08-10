import { Job, Queue, Worker } from 'bullmq';
import { mailJobs } from '@/jobs/mail-jobs';

// Mock implementations for test environment
class MockQueue {
  async add(jobName: string, data: any) {
    // In tests, just resolve immediately without actually queuing
    console.log(`Mock: Would queue job ${jobName} with data:`, data);
    return Promise.resolve({ id: Date.now(), name: jobName, data });
  }

  async close() {
    return Promise.resolve();
  }
}

class MockWorker {
  constructor(queueName: string, processor: any, options: any) {
    // Do nothing in tests
  }

  async close() {
    return Promise.resolve();
  }

  on(event: string, callback: any) {
    return this;
  }
}

// Conditionally create real or mock instances based on environment
const mailQueue = process.env.NODE_ENV === 'test' 
  ? new MockQueue() as any
  : new Queue('mail', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(<string>process.env.REDIS_PORT)
      }
    });

const mailWorker = process.env.NODE_ENV === 'test'
  ? new MockWorker('mail', null, null) as any
  : new Worker(
      'mail',
      async (currentJob: Job) => {
        mailJobs.forEach((job) => {
          if (job.jobName == currentJob.name) {
            new job(currentJob.data).handle();
          }
        });
      },
      {
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(<string>process.env.REDIS_PORT)
        }
      }
    );

export { mailQueue, mailWorker };
