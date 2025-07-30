import puppeteer from 'puppeteer';
import { IHeapSnapshot, takeSnapshots } from '@memlab/api';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPORTS_DIR = 'tests/reports/memory';
mkdirSync(REPORTS_DIR, { recursive: true });

class MemoryLeakDetector {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      leaks: []
    };
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        '--enable-precise-memory-info',
        '--disable-dev-shm-usage',
        '--no-sandbox'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Enable memory profiling
    await this.page.evaluateOnNewDocument(() => {
      window.__memorySnapshots = [];
      
      window.captureMemorySnapshot = () => {
        if (performance.memory) {
          return {
            timestamp: Date.now(),
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      };
    });
  }

  async teardown() {
    await this.browser?.close();
  }

  async forceGarbageCollection() {
    await this.page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    // Wait for GC to complete
    await this.page.waitForTimeout(1000);
  }

  async measureMemory(label) {
    await this.forceGarbageCollection();
    
    const metrics = await this.page.metrics();
    const memory = await this.page.evaluate(() => window.captureMemorySnapshot());
    
    return {
      label,
      timestamp: Date.now(),
      metrics,
      memory
    };
  }

  async runTest(testName, testFn) {
    console.log(`Running memory leak test: ${testName}`);
    
    await this.page.goto('http://localhost:5173');
    await this.page.waitForSelector('#canvas-svg', { state: 'visible' });
    
    const measurements = [];
    
    // Initial measurement
    measurements.push(await this.measureMemory('initial'));
    
    // Run test scenario
    await testFn(this.page);
    
    // Measurement after operations
    measurements.push(await this.measureMemory('after-operations'));
    
    // Clean up / reset
    await this.page.reload();
    await this.page.waitForSelector('#canvas-svg', { state: 'visible' });
    
    // Final measurement
    measurements.push(await this.measureMemory('after-cleanup'));
    
    // Analyze for leaks
    const leak = this.analyzeMemoryLeak(measurements);
    
    const result = {
      testName,
      measurements,
      leak
    };
    
    this.results.tests.push(result);
    
    if (leak.detected) {
      this.results.leaks.push({
        testName,
        leakSize: leak.leakSize,
        percentage: leak.percentage
      });
      console.log(`  ⚠️  Memory leak detected: ${leak.leakSize} bytes (${leak.percentage}%)`);
    } else {
      console.log(`  ✓ No memory leak detected`);
    }
    
    return result;
  }

  analyzeMemoryLeak(measurements) {
    const initial = measurements[0].memory.usedJSHeapSize;
    const afterOps = measurements[1].memory.usedJSHeapSize;
    const afterCleanup = measurements[2].memory.usedJSHeapSize;
    
    // Calculate memory growth
    const expectedGrowth = afterOps - initial;
    const actualResidual = afterCleanup - initial;
    
    // Consider it a leak if more than 10% of allocated memory remains
    const leakThreshold = 0.1;
    const leakRatio = actualResidual / expectedGrowth;
    
    return {
      detected: leakRatio > leakThreshold && actualResidual > 1024 * 1024, // 1MB threshold
      leakSize: actualResidual,
      percentage: (leakRatio * 100).toFixed(2),
      initial,
      afterOps,
      afterCleanup
    };
  }

  async testComponentCreationLeak() {
    await this.runTest('Component Creation Memory Leak', async (page) => {
      // Create and destroy many components
      for (let i = 0; i < 100; i++) {
        // Add component
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
        
        // Select and delete it
        await page.click('[data-tool="select"]');
        await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
        await page.keyboard.press('Delete');
        
        if (i % 20 === 0) {
          console.log(`    Progress: ${i}/100 components`);
        }
      }
    });
  }

  async testWireCreationLeak() {
    await this.runTest('Wire Creation Memory Leak', async (page) => {
      // Add two components for wire connections
      await page.locator('.palette-item').first().click();
      await page.click('#canvas-svg', { position: { x: 300, y: 300 } });
      
      await page.locator('.palette-item').first().click();
      await page.click('#canvas-svg', { position: { x: 500, y: 300 } });
      
      // Create and delete many wires
      await page.click('[data-tool="wire"]');
      
      for (let i = 0; i < 100; i++) {
        // Create wire
        await page.click('#canvas-svg', { position: { x: 350, y: 300 } });
        await page.click('#canvas-svg', { position: { x: 450, y: 300 } });
        
        // Delete wire
        await page.click('[data-tool="select"]');
        await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
        await page.keyboard.press('Delete');
        
        await page.click('[data-tool="wire"]');
        
        if (i % 20 === 0) {
          console.log(`    Progress: ${i}/100 wires`);
        }
      }
    });
  }

  async testSelectionLeak() {
    await this.runTest('Selection Memory Leak', async (page) => {
      // Add many components
      for (let i = 0; i < 50; i++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { 
          position: { 
            x: (i % 10) * 80 + 200, 
            y: Math.floor(i / 10) * 80 + 200 
          } 
        });
      }
      
      await page.click('[data-tool="select"]');
      
      // Repeatedly select and deselect
      for (let i = 0; i < 100; i++) {
        // Select all with drag
        await page.mouse.move(100, 100);
        await page.mouse.down();
        await page.mouse.move(900, 700);
        await page.mouse.up();
        
        // Deselect
        await page.click('#canvas-svg', { position: { x: 50, y: 50 } });
        
        if (i % 20 === 0) {
          console.log(`    Progress: ${i}/100 selections`);
        }
      }
    });
  }

  async testZoomPanLeak() {
    await this.runTest('Zoom/Pan Memory Leak', async (page) => {
      // Add some components
      for (let i = 0; i < 20; i++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { 
          position: { x: Math.random() * 600 + 200, y: Math.random() * 400 + 200 } 
        });
      }
      
      // Perform many zoom/pan operations
      for (let i = 0; i < 200; i++) {
        const zoom = Math.random() * 4 + 0.5;
        await page.evaluate((z) => {
          window.wiringApp.panZoomInstance.zoom(z);
        }, zoom);
        
        const panX = (Math.random() - 0.5) * 200;
        const panY = (Math.random() - 0.5) * 200;
        await page.evaluate((pan) => {
          window.wiringApp.panZoomInstance.pan(pan);
        }, { x: panX, y: panY });
        
        if (i % 40 === 0) {
          console.log(`    Progress: ${i}/200 operations`);
        }
      }
    });
  }

  async testUndoRedoLeak() {
    await this.runTest('Undo/Redo Memory Leak', async (page) => {
      // Perform many undoable operations
      for (let i = 0; i < 50; i++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
      }
      
      // Undo and redo many times
      for (let i = 0; i < 100; i++) {
        // Undo all
        for (let j = 0; j < 50; j++) {
          await page.keyboard.press('Control+z');
        }
        
        // Redo all
        for (let j = 0; j < 50; j++) {
          await page.keyboard.press('Control+y');
        }
        
        if (i % 10 === 0) {
          console.log(`    Progress: ${i}/100 undo/redo cycles`);
        }
      }
    });
  }

  async testEventListenerLeak() {
    await this.runTest('Event Listener Memory Leak', async (page) => {
      // Add and remove many components with event listeners
      for (let i = 0; i < 100; i++) {
        // Add component
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
        
        // Interact with it (hover, click, etc.)
        await page.hover('#canvas-svg g:last-child');
        await page.click('#canvas-svg g:last-child');
        await page.click('#canvas-svg g:last-child', { button: 'right' });
        
        // Delete it
        await page.keyboard.press('Delete');
        
        if (i % 20 === 0) {
          console.log(`    Progress: ${i}/100 components`);
        }
      }
    });
  }

  async testExportDialogLeak() {
    await this.runTest('Export Dialog Memory Leak', async (page) => {
      // Open and close export dialog many times
      for (let i = 0; i < 50; i++) {
        await page.click('#export-btn');
        await page.waitForSelector('.export-dialog', { state: 'visible' });
        
        // Change some settings
        const formatSelect = await page.$('select[name="format"]');
        if (formatSelect) {
          await formatSelect.selectOption('svg');
          await formatSelect.selectOption('png');
          await formatSelect.selectOption('pdf');
        }
        
        // Close dialog
        await page.keyboard.press('Escape');
        await page.waitForSelector('.export-dialog', { state: 'hidden' });
        
        if (i % 10 === 0) {
          console.log(`    Progress: ${i}/50 dialog cycles`);
        }
      }
    });
  }

  async testDOMNodeLeak() {
    await this.runTest('DOM Node Memory Leak', async (page) => {
      const initialNodes = await page.evaluate(() => document.querySelectorAll('*').length);
      
      // Create and destroy many DOM elements
      for (let i = 0; i < 100; i++) {
        // Add multiple components
        for (let j = 0; j < 10; j++) {
          await page.locator('.palette-item').first().click();
          await page.click('#canvas-svg', { 
            position: { x: 200 + j * 50, y: 300 } 
          });
        }
        
        // Select all and delete
        await page.click('[data-tool="select"]');
        await page.keyboard.press('Control+a');
        await page.keyboard.press('Delete');
        
        if (i % 10 === 0) {
          console.log(`    Progress: ${i}/100 cycles`);
        }
      }
      
      const finalNodes = await page.evaluate(() => document.querySelectorAll('*').length);
      
      console.log(`    DOM nodes: initial=${initialNodes}, final=${finalNodes}`);
      
      // Check for DOM node leak
      if (finalNodes > initialNodes * 1.1) {
        console.log(`    ⚠️  Potential DOM node leak detected`);
      }
    });
  }

  async generateReport() {
    const summary = {
      totalTests: this.results.tests.length,
      leaksDetected: this.results.leaks.length,
      totalLeakSize: this.results.leaks.reduce((sum, leak) => sum + leak.leakSize, 0),
      recommendations: []
    };
    
    // Generate recommendations
    if (summary.leaksDetected > 0) {
      summary.recommendations.push('Memory leaks detected in the following areas:');
      this.results.leaks.forEach(leak => {
        summary.recommendations.push(`- ${leak.testName}: ${(leak.leakSize / 1024 / 1024).toFixed(2)}MB leaked`);
      });
    }
    
    const report = {
      ...this.results,
      summary
    };
    
    // Save detailed report
    writeFileSync(
      join(REPORTS_DIR, `memory-leak-report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );
    
    // Generate summary report
    const summaryText = `
Memory Leak Detection Report
===========================
Date: ${this.results.timestamp}
Total Tests: ${summary.totalTests}
Leaks Detected: ${summary.leaksDetected}
Total Leak Size: ${(summary.totalLeakSize / 1024 / 1024).toFixed(2)}MB

${summary.recommendations.join('\n')}
`;
    
    writeFileSync(
      join(REPORTS_DIR, 'memory-leak-summary.txt'),
      summaryText
    );
    
    console.log(summaryText);
  }

  async run() {
    try {
      await this.setup();
      
      // Run all memory leak tests
      await this.testComponentCreationLeak();
      await this.testWireCreationLeak();
      await this.testSelectionLeak();
      await this.testZoomPanLeak();
      await this.testUndoRedoLeak();
      await this.testEventListenerLeak();
      await this.testExportDialogLeak();
      await this.testDOMNodeLeak();
      
      await this.generateReport();
    } catch (error) {
      console.error('Memory leak detection failed:', error);
    } finally {
      await this.teardown();
    }
  }
}

// Run the memory leak detector
const detector = new MemoryLeakDetector();
detector.run();