import { test, expect } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

test.describe('Canvas Rendering Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-svg', { state: 'visible' });
  });

  test('empty canvas rendering', async ({ page }) => {
    const canvas = page.locator('#canvas-svg');
    await expect(canvas).toHaveScreenshot('empty-canvas.png', {
      maxDiffPixels: 100,
      threshold: 0.1
    });
    
    await percySnapshot(page, 'Empty Canvas');
  });

  test('single component rendering', async ({ page }) => {
    // Add a component
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('single-component.png', {
      maxDiffPixels: 150,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Single Component on Canvas');
  });

  test('multiple components layout', async ({ page }) => {
    const positions = [
      { x: 200, y: 200 },
      { x: 400, y: 200 },
      { x: 600, y: 200 },
      { x: 200, y: 400 },
      { x: 400, y: 400 },
      { x: 600, y: 400 }
    ];
    
    // Add multiple components
    for (const pos of positions) {
      await page.locator('.palette-item').nth(pos.x % 3).click();
      await page.click('#canvas-svg', { position: pos });
    }
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('multiple-components.png', {
      maxDiffPixels: 300,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Multiple Components Grid Layout');
  });

  test('wire rendering - straight', async ({ page }) => {
    // Add two components
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 300, y: 300 } });
    
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 500, y: 300 } });
    
    // Draw wire
    await page.click('[data-tool="wire"]');
    await page.click('#canvas-svg', { position: { x: 350, y: 300 } });
    await page.click('#canvas-svg', { position: { x: 450, y: 300 } });
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('wire-straight.png', {
      maxDiffPixels: 150,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Wire Rendering - Straight Connection');
  });

  test('wire rendering - complex routing', async ({ page }) => {
    // Create complex layout requiring wire routing
    const components = [
      { x: 200, y: 200 },
      { x: 600, y: 200 },
      { x: 400, y: 400 },
      { x: 200, y: 600 },
      { x: 600, y: 600 }
    ];
    
    for (const pos of components) {
      await page.locator('.palette-item').first().click();
      await page.click('#canvas-svg', { position: pos });
    }
    
    // Draw wires with routing
    await page.click('[data-tool="wire"]');
    
    // Wire 1: Top left to bottom right (should route around middle)
    await page.click('#canvas-svg', { position: { x: 250, y: 200 } });
    await page.click('#canvas-svg', { position: { x: 550, y: 600 } });
    
    // Wire 2: Top right to bottom left (crossing wire 1)
    await page.click('#canvas-svg', { position: { x: 550, y: 200 } });
    await page.click('#canvas-svg', { position: { x: 250, y: 600 } });
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('wire-complex-routing.png', {
      maxDiffPixels: 300,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Wire Routing - Complex Paths');
  });

  test('zoom levels rendering', async ({ page }) => {
    // Add some components
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
    
    const zoomLevels = [0.5, 1, 2, 5];
    
    for (const zoom of zoomLevels) {
      await page.evaluate((z) => {
        window.wiringApp.panZoomInstance.zoom(z);
        window.wiringApp.panZoomInstance.center();
      }, zoom);
      
      await page.waitForTimeout(300); // Wait for zoom animation
      
      await expect(page.locator('#canvas-svg')).toHaveScreenshot(`zoom-${zoom}x.png`, {
        maxDiffPixels: 200,
        threshold: 0.2
      });
    }
    
    await percySnapshot(page, 'Canvas at Different Zoom Levels');
  });

  test('selection rendering', async ({ page }) => {
    // Add components
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 300, y: 300 } });
    
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 500, y: 300 } });
    
    // Single selection
    await page.click('[data-tool="select"]');
    await page.click('#canvas-svg', { position: { x: 300, y: 300 } });
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('single-selection.png', {
      maxDiffPixels: 150,
      threshold: 0.2
    });
    
    // Multi-selection
    await page.keyboard.down('Shift');
    await page.click('#canvas-svg', { position: { x: 500, y: 300 } });
    await page.keyboard.up('Shift');
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('multi-selection.png', {
      maxDiffPixels: 150,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Selection States');
  });

  test('label rendering', async ({ page }) => {
    // Add component
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
    
    // Add label
    await page.click('[data-tool="label"]');
    await page.click('#canvas-svg', { position: { x: 400, y: 250 } });
    await page.type('Test Label 123');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('label-rendering.png', {
      maxDiffPixels: 150,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Label Rendering');
  });

  test('grid rendering', async ({ page }) => {
    // Enable grid if available
    await page.evaluate(() => {
      const svg = document.getElementById('canvas-svg');
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.id = 'grid';
      pattern.setAttribute('width', '20');
      pattern.setAttribute('height', '20');
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '0');
      line1.setAttribute('y1', '20');
      line1.setAttribute('x2', '20');
      line1.setAttribute('y2', '20');
      line1.setAttribute('stroke', '#e0e0e0');
      
      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '20');
      line2.setAttribute('y1', '0');
      line2.setAttribute('x2', '20');
      line2.setAttribute('y2', '20');
      line2.setAttribute('stroke', '#e0e0e0');
      
      pattern.appendChild(line1);
      pattern.appendChild(line2);
      
      const defs = svg.querySelector('defs') || svg.insertBefore(
        document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
        svg.firstChild
      );
      defs.appendChild(pattern);
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'url(#grid)');
      svg.insertBefore(rect, svg.querySelector('#viewport'));
    });
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('grid-enabled.png', {
      maxDiffPixels: 200,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Grid Background');
  });

  test('viewport culling visual validation', async ({ page }) => {
    // Add many components to test culling
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { position: { x: x * 150 + 100, y: y * 150 + 100 } });
      }
    }
    
    // Zoom in to show only partial view
    await page.evaluate(() => {
      window.wiringApp.panZoomInstance.zoom(3);
      window.wiringApp.panZoomInstance.pan({ x: 0, y: 0 });
    });
    
    await page.waitForTimeout(500);
    
    await expect(page.locator('#canvas-svg')).toHaveScreenshot('viewport-culling.png', {
      maxDiffPixels: 300,
      threshold: 0.2
    });
    
    // Check performance monitor shows culling
    await page.keyboard.press('Shift+P');
    await percySnapshot(page, 'Viewport Culling - Performance Stats');
  });
});