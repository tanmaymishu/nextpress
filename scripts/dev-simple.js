#!/usr/bin/env node

const { spawn } = require('child_process');

let apiProcess, webProcess;
let isShuttingDown = false;

function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('\n🛑 Shutting down gracefully...');
  
  // Close web first (frontend depends on API)
  if (webProcess) {
    console.log('📱 Closing web app...');
    webProcess.kill('SIGTERM');
  }
  
  // Wait a bit, then close API
  setTimeout(() => {
    if (apiProcess) {
      console.log('🚀 Closing API...');
      apiProcess.kill('SIGTERM');
    }
    process.exit(0);
  }, 1000);
}

// Handle Ctrl+C
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start both servers
console.log('🚀 Starting API...');
apiProcess = spawn('pnpm', ['dev:api'], { stdio: 'inherit' });

setTimeout(() => {
  console.log('📱 Starting Web...');
  webProcess = spawn('pnpm', ['dev:web'], { stdio: 'inherit' });
}, 2000);

console.log('✨ Development servers running. Press Ctrl+C to stop gracefully.');