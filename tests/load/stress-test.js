import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPORTS_DIR = 'tests/reports/load';
mkdirSync(REPORTS_DIR, { recursive: true });

class StressTestRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      scenarios: []
    };
  }

  async setup() {
    this.browser = await chromium.launch({
      headless: false,
      args: ['--disable-dev-shm-usage', '--no-sandbox']
    });
    
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    
    // Set up performance monitoring
    await this.page.evaluateOnNewDocument(() => {
      window.__stressTestMetrics = {
        renderTimes: [],
        interactionTimes: [],
        errors: []
      };
      
      // Override console.error to catch errors
      const originalError = console.error;
      console.error = (...args) => {
        window.__stressTestMetrics.errors.push({
          timestamp: Date.now(),
          message: args.join(' ')
        });
        originalError.apply(console, args);
      };
      
      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              window.__stressTestMetrics.renderTimes.push({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          }
        });
        
        try {
          observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          // Longtask might not be supported in all browsers
        }
      }
    });
  }

  async teardown() {
    await this.browser?.close();
  }

  async measureInteraction(name, action) {
    const startTime = Date.now();
    
    try {
      await action();
      const duration = Date.now() - startTime;
      
      return {
        name,
        duration,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        name,
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  async runScenario(scenarioName, config, testFn) {
    console.log(`\nRunning stress test scenario: ${scenarioName}`);
    console.log(`Configuration:`, config);
    
    const scenario = {
      name: scenarioName,
      config,
      startTime: Date.now(),
      metrics: {
        successCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        errors: []
      }
    };
    
    await this.page.goto('http://localhost:5173');
    await this.page.waitForSelector('#canvas-svg', { state: 'visible' });
    
    // Run the test
    const interactions = await testFn(this.page, config);
    
    // Collect browser metrics
    const browserMetrics = await this.page.evaluate(() => window.__stressTestMetrics);
    
    // Calculate statistics
    const responseTimes = interactions.map(i => i.duration);
    scenario.metrics.successCount = interactions.filter(i => i.success).length;
    scenario.metrics.errorCount = interactions.filter(i => !i.success).length;
    scenario.metrics.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    scenario.metrics.maxResponseTime = Math.max(...responseTimes);
    scenario.metrics.minResponseTime = Math.min(...responseTimes);
    scenario.metrics.errors = interactions.filter(i => !i.success).map(i => i.error);
    scenario.metrics.browserErrors = browserMetrics.errors;
    scenario.metrics.longTasks = browserMetrics.renderTimes.filter(t => t.duration > 100);
    
    scenario.endTime = Date.now();
    scenario.totalDuration = scenario.endTime - scenario.startTime;
    
    this.results.scenarios.push(scenario);
    
    // Print summary
    console.log(`  Total duration: ${scenario.totalDuration}ms`);
    console.log(`  Success rate: ${(scenario.metrics.successCount / (scenario.metrics.successCount + scenario.metrics.errorCount) * 100).toFixed(2)}%`);
    console.log(`  Avg response time: ${scenario.metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Max response time: ${scenario.metrics.maxResponseTime}ms`);
    
    return scenario;
  }

  async testMassiveElementCreation() {
    await this.runScenario('Massive Element Creation', 
      { elementCount: 5000, batchSize: 100 },
      async (page, config) => {
        const interactions = [];
        
        for (let batch = 0; batch < config.elementCount / config.batchSize; batch++) {
          const batchInteraction = await this.measureInteraction(
            `Create batch ${batch + 1}`,
            async () => {
              for (let i = 0; i < config.batchSize; i++) {
                await page.locator('.palette-item').first().click();
                await page.click('#canvas-svg', {
                  position: {
                    x: 100 + (Math.random() * 1200),
                    y: 100 + (Math.random() * 600)
                  }
                });
              }
            }
          );
          
          interactions.push(batchInteraction);
          
          console.log(`    Batch ${batch + 1}/${config.elementCount / config.batchSize} completed`);
          
          // Check performance degradation
          if (batch % 10 === 0) {
            const fps = await page.evaluate(() => {
              return new Promise(resolve => {
                let frames = 0;
                const startTime = performance.now();
                
                function countFrame() {
                  frames++;
                  if (performance.now() - startTime < 1000) {
                    requestAnimationFrame(countFrame);
                  } else {
                    resolve(frames);
                  }
                }
                
                requestAnimationFrame(countFrame);
              });
            });
            
            console.log(`    Current FPS: ${fps}`);
          }
        }
        
        return interactions;
      }
    );
  }

  async testComplexWireRouting() {
    await this.runScenario('Complex Wire Routing',
      { gridSize: 20, wireCount: 'all-connections' },
      async (page, config) => {
        const interactions = [];
        
        // Create grid of components
        console.log(`    Creating ${config.gridSize}x${config.gridSize} grid...`);
        for (let x = 0; x < config.gridSize; x++) {
          for (let y = 0; y < config.gridSize; y++) {
            await page.locator('.palette-item').first().click();
            await page.click('#canvas-svg', {
              position: {
                x: 100 + x * 50,
                y: 100 + y * 50
              }
            });
          }
        }
        
        // Connect with wires
        await page.click('[data-tool="wire"]');
        
        console.log(`    Creating wire connections...`);
        let wireCount = 0;
        
        // Connect each component to its neighbors
        for (let x = 0; x < config.gridSize - 1; x++) {
          for (let y = 0; y < config.gridSize - 1; y++) {
            // Horizontal connection
            const horizontalWire = await this.measureInteraction(
              `Wire ${wireCount++}`,
              async () => {
                await page.click('#canvas-svg', {
                  position: { x: 100 + x * 50 + 25, y: 100 + y * 50 }
                });
                await page.click('#canvas-svg', {
                  position: { x: 100 + (x + 1) * 50 - 25, y: 100 + y * 50 }
                });
              }
            );
            interactions.push(horizontalWire);
            
            // Vertical connection
            const verticalWire = await this.measureInteraction(
              `Wire ${wireCount++}`,
              async () => {
                await page.click('#canvas-svg', {
                  position: { x: 100 + x * 50, y: 100 + y * 50 + 25 }
                });
                await page.click('#canvas-svg', {
                  position: { x: 100 + x * 50, y: 100 + (y + 1) * 50 - 25 }
                });
              }
            );
            interactions.push(verticalWire);
            
            if (wireCount % 100 === 0) {
              console.log(`    Created ${wireCount} wires...`);
            }
          }
        }
        
        return interactions;
      }
    );
  }

  async testRapidInteractions() {
    await this.runScenario('Rapid User Interactions',
      { duration: 30000, actionsPerSecond: 10 },
      async (page, config) => {
        const interactions = [];
        const startTime = Date.now();
        
        // Add some initial elements
        for (let i = 0; i < 50; i++) {
          await page.locator('.palette-item').first().click();
          await page.click('#canvas-svg', {
            position: {
              x: 100 + Math.random() * 800,
              y: 100 + Math.random() * 500
            }
          });
        }
        
        console.log(`    Starting rapid interactions for ${config.duration / 1000} seconds...`);
        
        while (Date.now() - startTime < config.duration) {
          const actionType = Math.floor(Math.random() * 6);
          
          switch (actionType) {
            case 0: // Click element
              interactions.push(await this.measureInteraction('Click element', async () => {
                await page.click('#canvas-svg', {
                  position: {
                    x: 100 + Math.random() * 800,
                    y: 100 + Math.random() * 500
                  }
                });
              }));
              break;
              
            case 1: // Drag element
              interactions.push(await this.measureInteraction('Drag element', async () => {
                const startX = 100 + Math.random() * 800;
                const startY = 100 + Math.random() * 500;
                await page.mouse.move(startX, startY);
                await page.mouse.down();
                await page.mouse.move(startX + 50, startY + 50, { steps: 5 });
                await page.mouse.up();
              }));
              break;
              
            case 2: // Zoom
              interactions.push(await this.measureInteraction('Zoom', async () => {
                const zoom = 0.5 + Math.random() * 4;
                await page.evaluate((z) => {
                  window.wiringApp.panZoomInstance.zoom(z);
                }, zoom);
              }));
              break;
              
            case 3: // Pan
              interactions.push(await this.measureInteraction('Pan', async () => {
                await page.evaluate(() => {
                  window.wiringApp.panZoomInstance.pan({
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200
                  });
                });
              }));
              break;
              
            case 4: // Selection rectangle
              interactions.push(await this.measureInteraction('Selection', async () => {
                await page.click('[data-tool="select"]');
                const x1 = 100 + Math.random() * 400;
                const y1 = 100 + Math.random() * 300;
                await page.mouse.move(x1, y1);
                await page.mouse.down();
                await page.mouse.move(x1 + 200, y1 + 200, { steps: 10 });
                await page.mouse.up();
              }));
              break;
              
            case 5: // Tool switch
              interactions.push(await this.measureInteraction('Tool switch', async () => {
                const tools = ['select', 'wire', 'label'];
                const tool = tools[Math.floor(Math.random() * tools.length)];
                await page.click(`[data-tool="${tool}"]`);
              }));
              break;
          }
          
          // Control rate
          await page.waitForTimeout(1000 / config.actionsPerSecond);
          
          if (interactions.length % 100 === 0) {
            console.log(`    Completed ${interactions.length} interactions...`);
          }
        }
        
        return interactions;
      }
    );
  }

  async testConcurrentOperations() {
    await this.runScenario('Concurrent Operations',
      { concurrentUsers: 5, operationsPerUser: 50 },
      async (page, config) => {
        const interactions = [];
        
        // Simulate multiple users by running operations in parallel
        console.log(`    Simulating ${config.concurrentUsers} concurrent users...`);
        
        const userPromises = [];
        
        for (let user = 0; user < config.concurrentUsers; user++) {
          const userOperations = async () => {
            const userInteractions = [];
            
            for (let op = 0; op < config.operationsPerUser; op++) {
              const operation = await this.measureInteraction(
                `User ${user} - Op ${op}`,
                async () => {
                  // Random operation
                  const opType = Math.floor(Math.random() * 3);
                  
                  switch (opType) {
                    case 0: // Add element
                      await page.locator('.palette-item').first().click();
                      await page.click('#canvas-svg', {
                        position: {
                          x: 200 + user * 150 + Math.random() * 100,
                          y: 200 + Math.random() * 400
                        }
                      });
                      break;
                      
                    case 1: // Add wire
                      await page.click('[data-tool="wire"]');
                      await page.click('#canvas-svg', {
                        position: { x: 200 + Math.random() * 600, y: 200 }
                      });
                      await page.click('#canvas-svg', {
                        position: { x: 200 + Math.random() * 600, y: 400 }
                      });
                      break;
                      
                    case 2: // Pan/Zoom
                      await page.evaluate(() => {
                        window.wiringApp.panZoomInstance.zoom(1 + Math.random());
                        window.wiringApp.panZoomInstance.pan({
                          x: (Math.random() - 0.5) * 100,
                          y: (Math.random() - 0.5) * 100
                        });
                      });
                      break;
                  }
                }
              );
              
              userInteractions.push(operation);
            }
            
            return userInteractions;
          };
          
          userPromises.push(userOperations());
        }
        
        const allUserInteractions = await Promise.all(userPromises);
        allUserInteractions.forEach(userInts => interactions.push(...userInts));
        
        return interactions;
      }
    );
  }

  async testMemoryUnderLoad() {
    await this.runScenario('Memory Under Load',
      { duration: 60000, checkInterval: 5000 },
      async (page, config) => {
        const interactions = [];
        const memorySnapshots = [];
        const startTime = Date.now();
        
        console.log(`    Running memory stress test for ${config.duration / 1000} seconds...`);
        
        while (Date.now() - startTime < config.duration) {
          // Add elements
          for (let i = 0; i < 50; i++) {
            await page.locator('.palette-item').first().click();
            await page.click('#canvas-svg', {
              position: {
                x: 100 + Math.random() * 800,
                y: 100 + Math.random() * 500
              }
            });
          }
          
          // Take memory snapshot
          const memory = await page.evaluate(() => {
            if (performance.memory) {
              return {
                timestamp: Date.now(),
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
              };
            }
            return null;
          });
          
          if (memory) {
            memorySnapshots.push(memory);
            console.log(`    Memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
          }
          
          // Delete half of the elements
          await page.click('[data-tool="select"]');
          await page.keyboard.press('Control+a');
          await page.keyboard.press('Delete');
          
          await page.waitForTimeout(config.checkInterval);
        }
        
        // Analyze memory growth
        if (memorySnapshots.length > 1) {
          const firstSnapshot = memorySnapshots[0];
          const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
          const growth = lastSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize;
          
          console.log(`    Memory growth: ${(growth / 1024 / 1024).toFixed(2)}MB`);
        }
        
        return interactions;
      }
    );
  }

  async testExtremeZoomLevels() {
    await this.runScenario('Extreme Zoom Levels',
      { minZoom: 0.01, maxZoom: 100, steps: 50 },
      async (page, config) => {
        const interactions = [];
        
        // Add elements at different scales
        for (let i = 0; i < 100; i++) {
          await page.locator('.palette-item').first().click();
          await page.click('#canvas-svg', {
            position: {
              x: 100 + Math.random() * 800,
              y: 100 + Math.random() * 500
            }
          });
        }
        
        console.log(`    Testing zoom from ${config.minZoom}x to ${config.maxZoom}x...`);
        
        // Test zoom levels
        for (let step = 0; step <= config.steps; step++) {
          const zoom = config.minZoom * Math.pow(config.maxZoom / config.minZoom, step / config.steps);
          
          const zoomInteraction = await this.measureInteraction(
            `Zoom to ${zoom.toFixed(2)}x`,
            async () => {
              await page.evaluate((z) => {
                window.wiringApp.panZoomInstance.zoom(z);
                window.wiringApp.panZoomInstance.center();
              }, zoom);
              
              // Wait for render
              await page.waitForTimeout(100);
              
              // Try to interact at this zoom level
              await page.click('#canvas-svg', {
                position: { x: 400, y: 300 }
              });
            }
          );
          
          interactions.push(zoomInteraction);
          
          if (step % 10 === 0) {
            console.log(`    Zoom level: ${zoom.toFixed(2)}x`);
          }
        }
        
        return interactions;
      }
    );
  }

  async generateReport() {
    const summary = {
      totalScenarios: this.results.scenarios.length,
      totalInteractions: this.results.scenarios.reduce((sum, s) => 
        sum + s.metrics.successCount + s.metrics.errorCount, 0
      ),
      overallSuccessRate: 0,
      criticalIssues: [],
      performanceBottlenecks: []
    };
    
    // Calculate overall success rate
    const totalSuccess = this.results.scenarios.reduce((sum, s) => sum + s.metrics.successCount, 0);
    const totalAttempts = summary.totalInteractions;
    summary.overallSuccessRate = (totalSuccess / totalAttempts * 100).toFixed(2);
    
    // Identify issues
    this.results.scenarios.forEach(scenario => {
      const successRate = scenario.metrics.successCount / 
        (scenario.metrics.successCount + scenario.metrics.errorCount) * 100;
      
      if (successRate < 95) {
        summary.criticalIssues.push({
          scenario: scenario.name,
          successRate: successRate.toFixed(2),
          errors: scenario.metrics.errors
        });
      }
      
      if (scenario.metrics.maxResponseTime > 1000) {
        summary.performanceBottlenecks.push({
          scenario: scenario.name,
          maxResponseTime: scenario.metrics.maxResponseTime,
          avgResponseTime: scenario.metrics.avgResponseTime.toFixed(2)
        });
      }
    });
    
    const report = {
      ...this.results,
      summary
    };
    
    // Save detailed report
    writeFileSync(
      join(REPORTS_DIR, `stress-test-report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );
    
    // Generate summary
    console.log('\n\nStress Test Summary');
    console.log('===================');
    console.log(`Total Scenarios: ${summary.totalScenarios}`);
    console.log(`Total Interactions: ${summary.totalInteractions}`);
    console.log(`Overall Success Rate: ${summary.overallSuccessRate}%`);
    
    if (summary.criticalIssues.length > 0) {
      console.log('\nCritical Issues:');
      summary.criticalIssues.forEach(issue => {
        console.log(`- ${issue.scenario}: ${issue.successRate}% success rate`);
      });
    }
    
    if (summary.performanceBottlenecks.length > 0) {
      console.log('\nPerformance Bottlenecks:');
      summary.performanceBottlenecks.forEach(bottleneck => {
        console.log(`- ${bottleneck.scenario}: Max ${bottleneck.maxResponseTime}ms, Avg ${bottleneck.avgResponseTime}ms`);
      });
    }
  }

  async run() {
    try {
      await this.setup();
      
      // Run all stress test scenarios
      await this.testMassiveElementCreation();
      await this.testComplexWireRouting();
      await this.testRapidInteractions();
      await this.testConcurrentOperations();
      await this.testMemoryUnderLoad();
      await this.testExtremeZoomLevels();
      
      await this.generateReport();
    } catch (error) {
      console.error('Stress test failed:', error);
    } finally {
      await this.teardown();
    }
  }
}

// Run the stress tests
const runner = new StressTestRunner();
runner.run();