import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPORTS_DIR = 'tests/reports/performance';

// Ensure reports directory exists
mkdirSync(REPORTS_DIR, { recursive: true });

class PerformanceTestRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: []
    };
  }

  async setup() {
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    
    // Enable performance metrics
    await this.context.addInitScript(() => {
      window.__performanceMetrics = [];
      
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      let frameCount = 0;
      let lastTime = performance.now();
      
      window.requestAnimationFrame = function(callback) {
        return originalRequestAnimationFrame.call(window, (time) => {
          frameCount++;
          if (time - lastTime >= 1000) {
            window.__performanceMetrics.push({
              fps: frameCount,
              timestamp: time
            });
            frameCount = 0;
            lastTime = time;
          }
          callback(time);
        });
      };
    });
  }

  async teardown() {
    await this.browser?.close();
  }

  async measureRenderPerformance(testName, setupFn) {
    console.log(`Running performance test: ${testName}`);
    
    const metrics = {
      testName,
      renderTimes: [],
      fps: [],
      memoryUsage: [],
      layoutDuration: [],
      paintDuration: []
    };
    
    await this.page.goto('http://localhost:5173');
    await this.page.waitForSelector('#canvas-svg', { state: 'visible' });
    
    // Start performance observer
    await this.page.evaluate(() => {
      window.__renderMetrics = [];
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__renderMetrics.push({
            name: entry.name,
            type: entry.entryType,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'layout', 'paint'] });
    });
    
    // Run the test setup
    const startTime = Date.now();
    await setupFn(this.page);
    const endTime = Date.now();
    
    // Collect metrics
    await this.page.waitForTimeout(2000); // Let performance settle
    
    const performanceMetrics = await this.page.evaluate(() => {
      return {
        fps: window.__performanceMetrics,
        renders: window.__renderMetrics,
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });
    
    // Chrome DevTools Protocol metrics
    const cdpSession = await this.context.newCDPSession(this.page);
    await cdpSession.send('Performance.enable');
    const perfMetrics = await cdpSession.send('Performance.getMetrics');
    
    metrics.totalDuration = endTime - startTime;
    metrics.fps = performanceMetrics.fps.map(m => m.fps);
    metrics.averageFPS = metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length || 0;
    metrics.memory = performanceMetrics.memory;
    metrics.cdpMetrics = perfMetrics.metrics;
    
    this.results.tests.push(metrics);
    
    console.log(`  Total duration: ${metrics.totalDuration}ms`);
    console.log(`  Average FPS: ${metrics.averageFPS.toFixed(2)}`);
    
    return metrics;
  }

  async runCanvasStressTest() {
    await this.measureRenderPerformance('Canvas Stress Test - 1000 Elements', async (page) => {
      // Add 1000 elements
      for (let i = 0; i < 1000; i++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { 
          position: { 
            x: Math.random() * 1200 + 100, 
            y: Math.random() * 800 + 100 
          } 
        });
        
        // Log progress every 100 elements
        if (i % 100 === 0) {
          console.log(`    Added ${i} elements...`);
        }
      }
    });
  }

  async runWireRoutingPerformance() {
    await this.measureRenderPerformance('Wire Routing Performance', async (page) => {
      // Create grid of components
      const gridSize = 10;
      const spacing = 100;
      
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          await page.locator('.palette-item').first().click();
          await page.click('#canvas-svg', { 
            position: { x: x * spacing + 200, y: y * spacing + 100 } 
          });
        }
      }
      
      // Connect components with wires
      await page.click('[data-tool="wire"]');
      
      for (let i = 0; i < gridSize - 1; i++) {
        for (let j = 0; j < gridSize - 1; j++) {
          // Horizontal wire
          await page.click('#canvas-svg', { 
            position: { x: i * spacing + 250, y: j * spacing + 100 } 
          });
          await page.click('#canvas-svg', { 
            position: { x: (i + 1) * spacing + 150, y: j * spacing + 100 } 
          });
          
          // Vertical wire
          await page.click('#canvas-svg', { 
            position: { x: i * spacing + 200, y: j * spacing + 150 } 
          });
          await page.click('#canvas-svg', { 
            position: { x: i * spacing + 200, y: (j + 1) * spacing + 50 } 
          });
        }
      }
    });
  }

  async runZoomPanPerformance() {
    await this.measureRenderPerformance('Zoom/Pan Performance', async (page) => {
      // Add elements first
      for (let i = 0; i < 100; i++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { 
          position: { 
            x: Math.random() * 800 + 200, 
            y: Math.random() * 600 + 100 
          } 
        });
      }
      
      // Perform zoom operations
      for (let zoom = 0.5; zoom <= 5; zoom += 0.5) {
        await page.evaluate((z) => {
          window.wiringApp.panZoomInstance.zoom(z);
        }, zoom);
        await page.waitForTimeout(100);
      }
      
      // Perform pan operations
      for (let i = 0; i < 20; i++) {
        await page.evaluate(() => {
          const currentPan = window.wiringApp.panZoomInstance.getPan();
          window.wiringApp.panZoomInstance.pan({
            x: currentPan.x + (Math.random() - 0.5) * 200,
            y: currentPan.y + (Math.random() - 0.5) * 200
          });
        });
        await page.waitForTimeout(50);
      }
    });
  }

  async runSelectionPerformance() {
    await this.measureRenderPerformance('Selection Performance', async (page) => {
      // Add many elements
      const elements = [];
      for (let i = 0; i < 200; i++) {
        await page.locator('.palette-item').first().click();
        const x = Math.random() * 800 + 200;
        const y = Math.random() * 600 + 100;
        await page.click('#canvas-svg', { position: { x, y } });
        elements.push({ x, y });
      }
      
      // Test selection rectangle performance
      await page.click('[data-tool="select"]');
      
      // Multiple selection operations
      for (let i = 0; i < 10; i++) {
        // Draw selection rectangle
        await page.mouse.move(100, 100);
        await page.mouse.down();
        await page.mouse.move(900, 700, { steps: 10 });
        await page.mouse.up();
        
        // Clear selection
        await page.click('#canvas-svg', { position: { x: 50, y: 50 } });
      }
      
      // Test individual selections with shift
      await page.keyboard.down('Shift');
      for (let i = 0; i < 50; i++) {
        const elem = elements[i];
        await page.click('#canvas-svg', { position: elem });
      }
      await page.keyboard.up('Shift');
    });
  }

  async runAnimationPerformance() {
    await this.measureRenderPerformance('Animation Performance', async (page) => {
      // Add animated elements (if supported)
      for (let i = 0; i < 50; i++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { 
          position: { x: 400 + i * 10, y: 300 + i * 5 } 
        });
      }
      
      // Trigger any animations (e.g., hover effects)
      for (let i = 0; i < 20; i++) {
        await page.mouse.move(
          Math.random() * 800 + 100,
          Math.random() * 600 + 100
        );
        await page.waitForTimeout(50);
      }
    });
  }

  async runLighthouseAudit() {
    console.log('Running Lighthouse audit...');
    
    const result = await lighthouse('http://localhost:5173', {
      port: 9222,
      output: 'html',
      onlyCategories: ['performance'],
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1
      }
    });
    
    writeFileSync(
      join(REPORTS_DIR, 'lighthouse-report.html'),
      result.report
    );
    
    const scores = {
      performance: result.lhr.categories.performance.score * 100,
      metrics: {
        firstContentfulPaint: result.lhr.audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: result.lhr.audits['largest-contentful-paint'].numericValue,
        totalBlockingTime: result.lhr.audits['total-blocking-time'].numericValue,
        cumulativeLayoutShift: result.lhr.audits['cumulative-layout-shift'].numericValue,
        speedIndex: result.lhr.audits['speed-index'].numericValue
      }
    };
    
    this.results.lighthouse = scores;
    console.log(`  Performance score: ${scores.performance}`);
    
    return scores;
  }

  async generateReport() {
    const report = {
      ...this.results,
      summary: {
        totalTests: this.results.tests.length,
        averageRenderTime: this.results.tests.reduce((sum, t) => sum + t.totalDuration, 0) / this.results.tests.length,
        lowestFPS: Math.min(...this.results.tests.flatMap(t => t.fps || [])),
        recommendations: this.generateRecommendations()
      }
    };
    
    writeFileSync(
      join(REPORTS_DIR, `performance-report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\nPerformance Test Summary:');
    console.log('=========================');
    console.log(`Total tests run: ${report.summary.totalTests}`);
    console.log(`Average render time: ${report.summary.averageRenderTime.toFixed(2)}ms`);
    console.log(`Lowest FPS recorded: ${report.summary.lowestFPS}`);
    console.log('\nRecommendations:');
    report.summary.recommendations.forEach(rec => console.log(`- ${rec}`));
  }

  generateRecommendations() {
    const recommendations = [];
    
    this.results.tests.forEach(test => {
      if (test.averageFPS < 30) {
        recommendations.push(`${test.testName}: FPS below 30, consider optimizing rendering`);
      }
      
      if (test.totalDuration > 5000) {
        recommendations.push(`${test.testName}: Operation took over 5 seconds, needs optimization`);
      }
      
      if (test.memory && test.memory.usedJSHeapSize > 100 * 1024 * 1024) {
        recommendations.push(`${test.testName}: High memory usage (>100MB), check for memory leaks`);
      }
    });
    
    if (this.results.lighthouse && this.results.lighthouse.performance < 90) {
      recommendations.push('Lighthouse performance score below 90, review Core Web Vitals');
    }
    
    return recommendations;
  }

  async run() {
    try {
      await this.setup();
      
      // Run all performance tests
      await this.runCanvasStressTest();
      await this.runWireRoutingPerformance();
      await this.runZoomPanPerformance();
      await this.runSelectionPerformance();
      await this.runAnimationPerformance();
      
      // Run Lighthouse audit
      // await this.runLighthouseAudit(); // Uncomment when Chrome is running with debugging port
      
      await this.generateReport();
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      await this.teardown();
    }
  }
}

// Run the performance tests
const runner = new PerformanceTestRunner();
runner.run();