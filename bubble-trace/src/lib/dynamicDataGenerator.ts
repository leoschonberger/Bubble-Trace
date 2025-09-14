import { ParentRequirement, ChildRequirement, TestRun } from '@/types';

// Pool of realistic requirement names and descriptions
const parentRequirementTemplates = [
  {
    names: ['User Authentication', 'Authorization Management', 'Identity Verification', 'Access Control'],
    descriptions: [
      'System must authenticate users securely and maintain session integrity',
      'Users must be verified through multiple authentication methods',
      'Identity management system with role-based access control',
      'Secure authentication with multi-factor verification support'
    ]
  },
  {
    names: ['Data Management', 'Information Processing', 'Data Analytics', 'Content Management'],
    descriptions: [
      'System must manage data efficiently with proper validation and storage',
      'Data processing pipeline with real-time analytics capabilities',
      'Content management system with version control and audit trails',
      'Advanced data analytics with machine learning integration'
    ]
  },
  {
    names: ['User Interface', 'User Experience', 'Frontend Design', 'Accessibility'],
    descriptions: [
      'System must provide intuitive and accessible user interface',
      'Modern responsive design with excellent user experience',
      'Accessibility-first design supporting all users',
      'Interactive UI with real-time feedback and animations'
    ]
  },
  {
    names: ['Performance', 'Scalability', 'System Optimization', 'Load Management'],
    descriptions: [
      'System must meet performance requirements under various load conditions',
      'Scalable architecture supporting high concurrent users',
      'Optimized system performance with efficient resource utilization',
      'Load balancing and auto-scaling capabilities'
    ]
  },
  {
    names: ['Security', 'Data Protection', 'Privacy Management', 'Compliance'],
    descriptions: [
      'Comprehensive security framework protecting user data and system integrity',
      'Data protection with encryption and privacy controls',
      'Compliance with industry standards and regulations',
      'Advanced threat detection and prevention mechanisms'
    ]
  },
  {
    names: ['Integration', 'API Management', 'Third-party Services', 'Microservices'],
    descriptions: [
      'System integration with external services and APIs',
      'Microservices architecture with service mesh',
      'Third-party integration with webhook support',
      'API gateway with rate limiting and authentication'
    ]
  }
];

const childRequirementTemplates = [
  {
    names: ['Login System', 'Registration Flow', 'Password Management', 'Session Handling', 'Two-Factor Auth'],
    descriptions: [
      'User login functionality with validation',
      'New user registration with email verification',
      'Password reset and change capabilities',
      'Session management and timeout handling',
      'Two-factor authentication implementation'
    ]
  },
  {
    names: ['Database Operations', 'Data Validation', 'Backup System', 'Data Migration', 'Analytics Engine'],
    descriptions: [
      'CRUD operations with transaction support',
      'Input validation and sanitization',
      'Automated backup and recovery system',
      'Data migration tools and scripts',
      'Real-time analytics and reporting'
    ]
  },
  {
    names: ['Navigation Menu', 'Form Controls', 'Responsive Layout', 'Theme System', 'Component Library'],
    descriptions: [
      'Main navigation with breadcrumbs',
      'Interactive form controls with validation',
      'Mobile-first responsive design',
      'Dark/light theme switching',
      'Reusable UI component library'
    ]
  },
  {
    names: ['Load Optimization', 'Caching Strategy', 'Database Tuning', 'CDN Integration', 'Memory Management'],
    descriptions: [
      'Page load time optimization',
      'Multi-level caching implementation',
      'Database query optimization',
      'Content delivery network setup',
      'Efficient memory usage and garbage collection'
    ]
  },
  {
    names: ['Encryption', 'Vulnerability Scanning', 'Audit Logging', 'Access Control', 'Security Headers'],
    descriptions: [
      'End-to-end encryption implementation',
      'Automated security vulnerability scanning',
      'Comprehensive audit trail logging',
      'Role-based access control system',
      'Security headers and CSRF protection'
    ]
  },
  {
    names: ['REST API', 'GraphQL Endpoint', 'Webhook Handler', 'Service Discovery', 'Message Queue'],
    descriptions: [
      'RESTful API with OpenAPI documentation',
      'GraphQL schema and resolvers',
      'Webhook processing and validation',
      'Service discovery and health checks',
      'Asynchronous message processing'
    ]
  }
];

const testNameTemplates = [
  'Unit Test', 'Integration Test', 'Performance Test', 'Security Test', 'Accessibility Test',
  'Load Test', 'Smoke Test', 'Regression Test', 'End-to-End Test', 'API Test',
  'Database Test', 'UI Test', 'Cross-browser Test', 'Mobile Test', 'Stress Test'
];

const testDescriptionTemplates = [
  'Validates core functionality and business logic',
  'Tests integration between system components',
  'Measures system performance under various conditions',
  'Ensures security requirements are met',
  'Verifies accessibility compliance and usability',
  'Tests system behavior under high load',
  'Quick verification of critical functionality',
  'Ensures new changes don\'t break existing features',
  'Complete user journey testing',
  'API endpoint validation and response testing',
  'Database operations and data integrity testing',
  'User interface interaction testing',
  'Cross-browser compatibility verification',
  'Mobile device and responsive design testing',
  'System behavior under extreme conditions'
];

const statuses: ('passed' | 'failed' | 'pending')[] = ['passed', 'failed', 'pending'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateTimestamp(): string {
  const now = new Date();
  const randomOffset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Random within last 30 days
  return new Date(now.getTime() - randomOffset).toISOString();
}

export function generateDynamicFakeData(): {
  parentRequirements: ParentRequirement[];
  childRequirements: ChildRequirement[];
  testRuns: TestRun[];
} {
  const parentRequirements: ParentRequirement[] = [];
  const childRequirements: ChildRequirement[] = [];
  const testRuns: TestRun[] = [];

  // Generate 4-7 parent requirements
  const numParents = 4 + Math.floor(Math.random() * 4);
  const selectedTemplates = getRandomElements(parentRequirementTemplates, numParents);

  selectedTemplates.forEach((template, index) => {
    const parentId = index + 1;
    const parent: ParentRequirement = {
      id: parentId,
      name: getRandomElement(template.names),
      description: getRandomElement(template.descriptions),
      created_at: generateTimestamp()
    };
    parentRequirements.push(parent);

    // Generate 2-5 child requirements for each parent
    const numChildren = 2 + Math.floor(Math.random() * 4);
    const childTemplate = childRequirementTemplates[index] || childRequirementTemplates[0];
    const selectedChildNames = getRandomElements(childTemplate.names, numChildren);
    const selectedChildDescriptions = getRandomElements(childTemplate.descriptions, numChildren);

    selectedChildNames.forEach((childName, childIndex) => {
      const childId = parentRequirements.length * 10 + childIndex + 1;
      const child: ChildRequirement = {
        id: childId,
        parent_requirement_id: parentId,
        name: childName,
        description: selectedChildDescriptions[childIndex] || getRandomElement(childTemplate.descriptions),
        created_at: generateTimestamp()
      };
      childRequirements.push(child);

      // Generate 1-4 test runs for each child requirement
      const numTests = 1 + Math.floor(Math.random() * 4);
      for (let testIndex = 0; testIndex < numTests; testIndex++) {
        const testId = childId * 100 + testIndex + 1;
        const testName = getRandomElement(testNameTemplates);
        const test: TestRun = {
          id: testId,
          child_requirement_id: childId,
          name: `${testName} - ${child.name}`,
          status: getRandomElement(statuses),
          description: getRandomElement(testDescriptionTemplates),
          created_at: generateTimestamp()
        };
        testRuns.push(test);
      }
    });
  });

  return {
    parentRequirements,
    childRequirements,
    testRuns
  };
}