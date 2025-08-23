import db from './database';

export function seedDatabase() {
  if (typeof window !== 'undefined' || !db) return; // Only run on server
  // Clear existing data
  db.prepare('DELETE FROM test_runs').run();
  db.prepare('DELETE FROM child_requirements').run();
  db.prepare('DELETE FROM parent_requirements').run();

  // Insert parent requirements
  const insertParent = db.prepare(`
    INSERT INTO parent_requirements (name, description)
    VALUES (?, ?)
  `);

  const parentRequirements = [
    { name: 'User Authentication', description: 'System must authenticate users securely' },
    { name: 'Data Management', description: 'System must manage data efficiently' },
    { name: 'User Interface', description: 'System must provide intuitive user interface' },
    { name: 'Performance', description: 'System must meet performance requirements' }
  ];

  const parentIds: number[] = [];
  parentRequirements.forEach(parent => {
    const result = insertParent.run(parent.name, parent.description);
    parentIds.push(result.lastInsertRowid as number);
  });

  // Insert child requirements
  const insertChild = db.prepare(`
    INSERT INTO child_requirements (parent_requirement_id, name, description)
    VALUES (?, ?, ?)
  `);

  const childRequirements = [
    // User Authentication children
    { parentId: parentIds[0], name: 'Login Form', description: 'User can log in with credentials' },
    { parentId: parentIds[0], name: 'Password Reset', description: 'User can reset forgotten password' },
    { parentId: parentIds[0], name: 'Session Management', description: 'System manages user sessions' },
    
    // Data Management children
    { parentId: parentIds[1], name: 'Database Connection', description: 'System connects to database' },
    { parentId: parentIds[1], name: 'Data Validation', description: 'System validates input data' },
    { parentId: parentIds[1], name: 'Data Backup', description: 'System backs up data regularly' },
    
    // User Interface children
    { parentId: parentIds[2], name: 'Navigation Menu', description: 'Users can navigate through the app' },
    { parentId: parentIds[2], name: 'Form Validation', description: 'Forms provide validation feedback' },
    { parentId: parentIds[2], name: 'Responsive Design', description: 'UI works on different screen sizes' },
    
    // Performance children
    { parentId: parentIds[3], name: 'Load Time', description: 'Pages load within acceptable time' },
    { parentId: parentIds[3], name: 'Database Query Optimization', description: 'Database queries are optimized' },
    { parentId: parentIds[3], name: 'Caching Strategy', description: 'System implements efficient caching' }
  ];

  const childIds: number[] = [];
  childRequirements.forEach(child => {
    const result = insertChild.run(child.parentId, child.name, child.description);
    childIds.push(result.lastInsertRowid as number);
  });

  // Insert test runs
  const insertTest = db.prepare(`
    INSERT INTO test_runs (child_requirement_id, name, status, description)
    VALUES (?, ?, ?, ?)
  `);

  const testRuns = [
    // Login Form tests
    { childId: childIds[0], name: 'Valid Login Test', status: 'passed', description: 'Test login with valid credentials' },
    { childId: childIds[0], name: 'Invalid Login Test', status: 'passed', description: 'Test login with invalid credentials' },
    { childId: childIds[0], name: 'Empty Form Test', status: 'failed', description: 'Test form submission with empty fields' },
    
    // Password Reset tests
    { childId: childIds[1], name: 'Email Validation Test', status: 'passed', description: 'Test email validation for reset' },
    { childId: childIds[1], name: 'Reset Link Test', status: 'pending', description: 'Test password reset link generation' },
    
    // Session Management tests
    { childId: childIds[2], name: 'Session Timeout Test', status: 'passed', description: 'Test session timeout functionality' },
    { childId: childIds[2], name: 'Concurrent Session Test', status: 'failed', description: 'Test multiple concurrent sessions' },
    
    // Database Connection tests
    { childId: childIds[3], name: 'Connection Pool Test', status: 'passed', description: 'Test database connection pooling' },
    { childId: childIds[3], name: 'Connection Retry Test', status: 'passed', description: 'Test connection retry logic' },
    
    // Data Validation tests
    { childId: childIds[4], name: 'Input Sanitization Test', status: 'passed', description: 'Test input data sanitization' },
    { childId: childIds[4], name: 'SQL Injection Test', status: 'passed', description: 'Test SQL injection prevention' },
    { childId: childIds[4], name: 'XSS Prevention Test', status: 'pending', description: 'Test XSS attack prevention' },
    
    // Data Backup tests
    { childId: childIds[5], name: 'Automated Backup Test', status: 'passed', description: 'Test automated backup process' },
    { childId: childIds[5], name: 'Backup Restoration Test', status: 'failed', description: 'Test data restoration from backup' },
    
    // Navigation Menu tests
    { childId: childIds[6], name: 'Menu Accessibility Test', status: 'passed', description: 'Test menu accessibility features' },
    { childId: childIds[6], name: 'Mobile Navigation Test', status: 'passed', description: 'Test navigation on mobile devices' },
    
    // Form Validation tests
    { childId: childIds[7], name: 'Client-side Validation Test', status: 'passed', description: 'Test client-side form validation' },
    { childId: childIds[7], name: 'Server-side Validation Test', status: 'passed', description: 'Test server-side form validation' },
    
    // Responsive Design tests
    { childId: childIds[8], name: 'Mobile Responsive Test', status: 'passed', description: 'Test mobile responsiveness' },
    { childId: childIds[8], name: 'Tablet Responsive Test', status: 'pending', description: 'Test tablet responsiveness' },
    { childId: childIds[8], name: 'Desktop Responsive Test', status: 'passed', description: 'Test desktop responsiveness' },
    
    // Load Time tests
    { childId: childIds[9], name: 'Homepage Load Test', status: 'passed', description: 'Test homepage loading time' },
    { childId: childIds[9], name: 'Dashboard Load Test', status: 'failed', description: 'Test dashboard loading time' },
    
    // Database Query Optimization tests
    { childId: childIds[10], name: 'Index Usage Test', status: 'passed', description: 'Test database index usage' },
    { childId: childIds[10], name: 'Query Performance Test', status: 'pending', description: 'Test query execution time' },
    
    // Caching Strategy tests
    { childId: childIds[11], name: 'Cache Hit Rate Test', status: 'passed', description: 'Test cache hit rate efficiency' },
    { childId: childIds[11], name: 'Cache Invalidation Test', status: 'passed', description: 'Test cache invalidation logic' }
  ];

  testRuns.forEach(test => {
    insertTest.run(test.childId, test.name, test.status, test.description);
  });

  console.log('Database seeded successfully!');
}