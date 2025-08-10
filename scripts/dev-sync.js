#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

let apiProcess = null;
let webProcess = null;
let isShuttingDown = false;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  log(colors.yellow, 'SHUTDOWN', 'Graceful shutdown initiated...');
  
  // Step 1: Close web app first (it depends on API)
  if (webProcess && !webProcess.killed) {
    log(colors.cyan, 'WEB', 'Shutting down frontend...');
    webProcess.kill('SIGTERM');
    
    // Wait a bit for web to close, then close API
    setTimeout(() => {
      if (apiProcess && !apiProcess.killed) {
        log(colors.blue, 'API', 'Shutting down API...');
        apiProcess.kill('SIGTERM');
      }
      
      // Force exit after another timeout if processes don't close
      setTimeout(() => {
        log(colors.red, 'FORCE', 'Force closing remaining processes...');
        process.exit(0);
      }, 2000);
    }, 1500);
  } else if (apiProcess && !apiProcess.killed) {
    // If only API is running
    log(colors.blue, 'API', 'Shutting down API...');
    apiProcess.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start API server
function startAPI() {
  log(colors.blue, 'API', 'Starting API server...');
  apiProcess = spawn('pnpm', ['turbo', 'run', 'dev', '--filter=@repo/api'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: path.resolve(__dirname, '..')
  });

  apiProcess.stdout.on('data', (data) => {
    process.stdout.write(`${colors.blue}[API]${colors.reset} ${data}`);
  });

  apiProcess.stderr.on('data', (data) => {
    process.stderr.write(`${colors.blue}[API]${colors.reset} ${data}`);
  });

  apiProcess.on('close', (code) => {
    log(colors.blue, 'API', `Process exited with code ${code}`);
    if (!isShuttingDown) {
      log(colors.red, 'ERROR', 'API crashed unexpectedly, restarting...');
      setTimeout(startAPI, 1000);
    }
  });
}

// Start Web server
function startWeb() {
  log(colors.cyan, 'WEB', 'Starting web server...');
  webProcess = spawn('pnpm', ['turbo', 'run', 'dev', '--filter=@repo/web'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: path.resolve(__dirname, '..')
  });

  webProcess.stdout.on('data', (data) => {
    process.stdout.write(`${colors.cyan}[WEB]${colors.reset} ${data}`);
  });

  webProcess.stderr.on('data', (data) => {
    process.stderr.write(`${colors.cyan}[WEB]${colors.reset} ${data}`);
  });

  webProcess.on('close', (code) => {
    log(colors.cyan, 'WEB', `Process exited with code ${code}`);
    if (!isShuttingDown) {
      log(colors.red, 'ERROR', 'Web crashed unexpectedly, restarting...');
      setTimeout(startWeb, 1000);
    }
  });
}

// Main execution
async function main() {
  log(colors.green, 'DEV', 'Starting NextPress development servers...');
  
  // Start API first, then web after a short delay
  startAPI();
  
  setTimeout(() => {
    startWeb();
  }, 2000); // Give API 2 seconds to start before starting web
  
  log(colors.green, 'DEV', 'Both servers started. Press Ctrl+C to stop gracefully.');
}

main().catch(console.error);