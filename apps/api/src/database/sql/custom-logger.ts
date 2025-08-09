import { Logger, QueryRunner } from 'typeorm';

export class CustomLogger implements Logger {
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const stack = new Error().stack;
    const appFrame = this.findApplicationFrame(stack);

    console.log('\n=== QUERY ===');
    console.log('SQL:', query);
    console.log('Parameters:', parameters);
    console.log('Called from:', appFrame);
  }

  private findApplicationFrame(stack?: string): string {
    if (!stack) return 'Unknown';

    const lines = stack.split('\n');

    // Skip the first line (Error message) and find first non-node_modules frame
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip frames that are:
      // - From node_modules
      // - From this logger itself
      // - Internal Node.js frames
      if (
        !line.includes('node_modules') &&
        !line.includes('custom-logger.ts') &&
        !line.includes('internal/') &&
        line.includes('/')
      ) {
        // Extract just the file path and line number
        const match = line.match(/\((.+):(\d+):(\d+)\)/) || line.match(/at (.+):(\d+):(\d+)/);
        if (match) {
          const [, filePath, lineNumber, columnNumber] = match;
          // Get just the filename and relative path
          const relativePath = filePath.replace(process.cwd() + '/', '');
          return `${relativePath}:${lineNumber}:${columnNumber}`;
        }
        return line.trim();
      }
    }

    return 'Application frame not found';
  }

  logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const stack = new Error().stack;
    const appFrame = this.findApplicationFrame(stack);

    console.error('\n=== QUERY ERROR ===');
    console.error('Error:', error);
    console.error('Query:', query);
    console.error('Parameters:', parameters);
    console.error('Called from:', appFrame);
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const stack = new Error().stack;
    const appFrame = this.findApplicationFrame(stack);

    console.warn(`\n=== SLOW QUERY (${time}ms) ===`);
    console.warn('SQL:', query);
    console.warn('Called from:', appFrame);
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    console.log('Schema Build:', message);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    console.log('Migration:', message);
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    console[level](message);
  }
}
