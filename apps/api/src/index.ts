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
      console.log('Data Source has been initialized!');
    }
    
    // Run database seeders after DB is initialized
    const seederService = Container.get(SeederService);
    await seederService.runAllSeeders();
    
    // Boot the server
    app.listen(port, () => {
      console.log(`Listening on port ${port}...`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
