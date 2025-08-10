// Jest setup file to clean up test console output

// Store original console methods
const originalError = console.error;
const originalLog = console.log;
const originalWarn = console.warn;

// Override console methods during tests
beforeEach(() => {
  // Suppress expected errors during tests to reduce noise
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Allow through certain important errors but suppress expected test errors
    const suppressedPatterns = [
      'Error: Role not found',
      'Error: User not found', 
      'Error: Permission',
      'Error: You cannot delete',
      'Error: Cannot delete',
      'Error: Invalid username or password',
      'Error: User with this email already exists',
      'Error: Role with this name already exists',
      'Error: You can only update your own profile',
      'POST /api/v1/',
      'PUT /api/v1/',
      'DELETE /api/v1/',
      'GET /api/v1/'
    ];
    
    const shouldSuppress = suppressedPatterns.some(pattern => 
      message.includes(pattern)
    );
    
    if (!shouldSuppress) {
      originalError(...args);
    }
  };

  // Suppress console.log for test output as well
  console.log = (...args) => {
    const message = args.join(' ');
    
    // Suppress expected log messages during tests
    const suppressedLogPatterns = [
      'Error: User not found',
      'Error: Role not found',
      'Login attempt failed:'
    ];
    
    const shouldSuppress = suppressedLogPatterns.some(pattern => 
      message.includes(pattern)
    );
    
    if (!shouldSuppress) {
      originalLog(...args);
    }
  };

  // Suppress warning messages during tests
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress common test warnings
    const suppressedWarnings = [
      'IMPORTANT: Change the default admin credentials in production!'
    ];
    
    const shouldSuppress = suppressedWarnings.some(pattern => 
      message.includes(pattern)
    );
    
    if (!shouldSuppress) {
      originalWarn(...args);
    }
  };
});

// Restore original console methods after each test
afterEach(() => {
  console.error = originalError;
  console.log = originalLog; 
  console.warn = originalWarn;
});

// Also set up global test environment
process.env.NODE_ENV = 'test';