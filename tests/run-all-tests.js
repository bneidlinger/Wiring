#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Test suites configuration
const testSuites = [
  {
    name: 'Unit Tests',
    command: 'npm',
    args: ['run', 'test:unit'],
    critical: true
  },
  {
    name: 'Visual Regression Tests',
    command: 'npm',
    args: ['run', 'test:visual'],
    critical: true
  },
  {
    name: 'E2E Tests',
    command: 'npm',
    args: ['run', 'test:e2e'],
    critical: true
  },
  {
    name: 'Accessibility Tests',
    command: 'npm',
    args: ['run', 'test:a11y'],
    critical: true
  },
  {
    name: 'Performance Tests',
    command: 'npm',
    args: ['run', 'test:perf'],
    critical: false
  },
  {
    name: 'Cross-Browser Tests',
    command: 'npm',
    args: ['run', 'test:cross-browser'],
    critical: false
  },
  {
    name: 'Memory Leak Tests',
    command: 'npm',
    args: ['run', 'test:memory'],
    critical: false
  },
  {
    name: 'Load Tests',
    command: 'npm',
    args: ['run', 'test:load'],
    critical: false
  }
];

// Test results
const results = {
  timestamp: new Date().toISOString(),
  suites: [],
  summary: {
    total: testSuites.length,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

async function runTest(suite) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    log(`Running ${suite.name}...`, colors.blue);
    
    const child = spawn(suite.command, suite.args, {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      const result = {
        name: suite.name,
        success,
        duration,
        exitCode: code,
        output: output.slice(-5000), // Last 5000 chars
        errorOutput: errorOutput.slice(-5000),
        critical: suite.critical
      };
      
      results.suites.push(result);
      
      if (success) {
        log(`✓ ${suite.name} passed (${duration}ms)`, colors.green);
        results.summary.passed++;
      } else {
        log(`✗ ${suite.name} failed (${duration}ms)`, colors.red);
        results.summary.failed++;
      }
      
      resolve(result);
    });
  });
}

async function runAllTests() {
  logHeader('Wiring Diagram Quality Assurance Test Suite');
  
  // Check if server is running
  log('Checking development server...', colors.yellow);
  const serverCheck = spawn('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:5173']);
  const serverRunning = await new Promise((resolve) => {
    let output = '';
    serverCheck.stdout.on('data', (data) => {
      output += data.toString();
    });
    serverCheck.on('close', () => {
      resolve(output === '200');
    });
  });
  
  if (!serverRunning) {
    log('Development server not running. Please start it with "npm run dev"', colors.red);
    process.exit(1);
  }
  
  log('Server is running ✓\n', colors.green);
  
  // Run tests sequentially
  for (const suite of testSuites) {
    await runTest(suite);
    
    // Stop on critical failure if requested
    if (suite.critical && results.suites[results.suites.length - 1].success === false) {
      log('\nCritical test failed. Stopping test run.', colors.red);
      break;
    }
  }
  
  // Generate summary report
  generateSummaryReport();
  
  // Exit with appropriate code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

function generateSummaryReport() {
  logHeader('Test Summary');
  
  // Overall statistics
  log(`Total Test Suites: ${results.summary.total}`);
  log(`Passed: ${results.summary.passed}`, colors.green);
  log(`Failed: ${results.summary.failed}`, colors.red);
  
  if (results.summary.failed > 0) {
    log('\nFailed Tests:', colors.red);
    results.suites
      .filter(s => !s.success)
      .forEach(s => {
        log(`  - ${s.name} (exit code: ${s.exitCode})`, colors.red);
      });
  }
  
  // Performance summary
  log('\nPerformance Summary:', colors.cyan);
  const totalDuration = results.suites.reduce((sum, s) => sum + s.duration, 0);
  log(`Total Test Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  
  results.suites.forEach(s => {
    const timeStr = `${(s.duration / 1000).toFixed(2)}s`;
    const status = s.success ? '✓' : '✗';
    const color = s.success ? colors.green : colors.red;
    log(`  ${status} ${s.name}: ${timeStr}`, color);
  });
  
  // Save detailed report
  const reportPath = path.join(REPORTS_DIR, `test-run-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, colors.blue);
  
  // Generate HTML summary
  generateHTMLReport();
}

function generateHTMLReport() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Wiring Diagram Test Report - ${new Date().toLocaleString()}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      flex: 1;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
    }
    .stat-card.total { background: #e3f2fd; color: #1976d2; }
    .stat-card.passed { background: #e8f5e9; color: #388e3c; }
    .stat-card.failed { background: #ffebee; color: #d32f2f; }
    .stat-value { font-size: 36px; font-weight: bold; }
    .stat-label { font-size: 14px; margin-top: 5px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f9fa;
      font-weight: bold;
    }
    .status-pass { color: #28a745; }
    .status-fail { color: #dc3545; }
    .duration { color: #666; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Wiring Diagram Test Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <div class="stat-card total">
        <div class="stat-value">${results.summary.total}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card passed">
        <div class="stat-value">${results.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card failed">
        <div class="stat-value">${results.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
    </div>
    
    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Suite</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        ${results.suites.map(suite => `
          <tr>
            <td>${suite.name}</td>
            <td class="${suite.success ? 'status-pass' : 'status-fail'}">
              ${suite.success ? '✓ PASS' : '✗ FAIL'}
            </td>
            <td class="duration">${(suite.duration / 1000).toFixed(2)}s</td>
            <td>${suite.critical ? 'Critical' : 'Non-critical'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="footer">
      <p>Total test duration: ${(results.suites.reduce((sum, s) => sum + s.duration, 0) / 1000).toFixed(2)} seconds</p>
      <p>Report generated by Wiring Diagram QA System</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const htmlPath = path.join(REPORTS_DIR, 'test-summary.html');
  fs.writeFileSync(htmlPath, html);
  log(`HTML report saved to: ${htmlPath}`, colors.blue);
}

// Run tests
runAllTests().catch(error => {
  log(`\nTest runner error: ${error.message}`, colors.red);
  process.exit(1);
});