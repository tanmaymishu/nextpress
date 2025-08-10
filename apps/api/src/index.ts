import app from './app';
import { Container } from 'typedi';
import { SeederService } from './services/seeder.service';
import { AppDataSource } from './database/sql/data-source';

const port = process.env.APP_PORT || 3000;

// Run seeders and boot the server
async function startServer() {
  try {
    // Ensure database is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Connected to DataSource!');
    }

    // Database seeders can be run manually with 'pnpm seed'

    // Boot the server
    const server = app.listen(port, () => {
      console.log(`Listening on port ${port}...`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    async function gracefulShutdown() {
      console.log('\nReceived shutdown signal, closing server gracefully...');
      
      server.close(async () => {
        console.log('HTTP server closed.');
        
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          console.log('Database connection closed.');
        }
        
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
