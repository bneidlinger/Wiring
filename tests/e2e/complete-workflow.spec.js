import { test, expect } from '@playwright/test';

test.describe('Complete Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-svg', { state: 'visible' });
  });

  test('complete diagram creation workflow', async ({ page }) => {
    // Step 1: Add components
    console.log('Adding components...');
    
    // Add power supply
    await page.locator('.palette-item').filter({ hasText: 'Power Supply' }).click();
    await page.click('#canvas-svg', { position: { x: 200, y: 200 } });
    
    // Add card reader
    await page.locator('.palette-item').filter({ hasText: 'Card Reader' }).click();
    await page.click('#canvas-svg', { position: { x: 600, y: 200 } });
    
    // Add strike
    await page.locator('.palette-item').filter({ hasText: 'Strike' }).click();
    await page.click('#canvas-svg', { position: { x: 400, y: 400 } });
    
    // Verify components added
    const elements = await page.locator('#viewport > g').count();
    expect(elements).toBeGreaterThanOrEqual(3);
    
    // Step 2: Connect with wires
    console.log('Adding wires...');
    await page.click('[data-tool="wire"]');
    
    // Power to card reader
    await page.click('#canvas-svg', { position: { x: 250, y: 200 } });
    await page.click('#canvas-svg', { position: { x: 550, y: 200 } });
    
    // Card reader to strike
    await page.click('#canvas-svg', { position: { x: 600, y: 250 } });
    await page.click('#canvas-svg', { position: { x: 400, y: 350 } });
    
    // Verify wires added
    const wires = await page.locator('.wire').count();
    expect(wires).toBeGreaterThanOrEqual(2);
    
    // Step 3: Add labels
    console.log('Adding labels...');
    await page.click('[data-tool="label"]');
    
    await page.click('#canvas-svg', { position: { x: 200, y: 150 } });
    await page.keyboard.type('12V Power Supply');
    await page.keyboard.press('Enter');
    
    await page.click('#canvas-svg', { position: { x: 600, y: 150 } });
    await page.keyboard.type('Main Entry Reader');
    await page.keyboard.press('Enter');
    
    // Step 4: Test selection and manipulation
    console.log('Testing selection...');
    await page.click('[data-tool="select"]');
    
    // Select card reader
    await page.click('#canvas-svg', { position: { x: 600, y: 200 } });
    
    // Move it
    await page.mouse.move(600, 200);
    await page.mouse.down();
    await page.mouse.move(650, 200, { steps: 10 });
    await page.mouse.up();
    
    // Multi-select
    await page.keyboard.down('Shift');
    await page.click('#canvas-svg', { position: { x: 200, y: 200 } });
    await page.keyboard.up('Shift');
    
    const selectedCount = await page.locator('.selected').count();
    expect(selectedCount).toBe(2);
    
    // Step 5: Test undo/redo
    console.log('Testing undo/redo...');
    
    // Undo last selection
    await page.click('#undo-btn');
    await page.waitForTimeout(200);
    
    // Redo
    await page.click('#redo-btn');
    await page.waitForTimeout(200);
    
    // Step 6: Save the diagram
    console.log('Saving diagram...');
    await page.click('#save-btn');
    
    // Check save indicator
    await expect(page.locator('.save-indicator')).toContainText('Saved');
    
    // Step 7: Export the diagram
    console.log('Exporting diagram...');
    await page.click('#export-btn');
    await page.waitForSelector('.export-dialog', { state: 'visible' });
    
    // Select PNG format
    await page.selectOption('select[name="format"]', 'png');
    
    // Set quality
    const qualitySlider = page.locator('input[type="range"][name="quality"]');
    if (await qualitySlider.count() > 0) {
      await qualitySlider.fill('90');
    }
    
    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.(png|svg|pdf)$/);
    
    // Step 8: Test zoom and pan
    console.log('Testing zoom and pan...');
    
    // Zoom in
    await page.keyboard.press('Control++');
    await page.waitForTimeout(200);
    
    // Zoom out
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(200);
    
    // Pan
    await page.mouse.move(400, 300);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(500, 400, { steps: 10 });
    await page.mouse.up({ button: 'middle' });
    
    // Step 9: Use component library
    console.log('Testing component library...');
    await page.click('#library-btn');
    await page.waitForSelector('.component-library-panel', { state: 'visible' });
    
    // Search for component
    const searchInput = page.locator('.component-library-panel input[type="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('power');
      await page.waitForTimeout(500);
    }
    
    // Close library
    await page.keyboard.press('Escape');
    
    // Step 10: Clear and reload
    console.log('Testing clear and reload...');
    
    // Clear canvas
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    
    const remainingElements = await page.locator('#viewport > g').count();
    expect(remainingElements).toBe(0);
    
    // Reload saved state
    await page.reload();
    await page.waitForSelector('#canvas-svg', { state: 'visible' });
    
    // Verify diagram was saved and restored
    const restoredElements = await page.locator('#viewport > g').count();
    expect(restoredElements).toBeGreaterThan(0);
  });

  test('error recovery workflow', async ({ page }) => {
    // Test various error conditions and recovery
    
    // Test 1: Invalid wire connection
    await page.click('[data-tool="wire"]');
    await page.click('#canvas-svg', { position: { x: 100, y: 100 } });
    await page.keyboard.press('Escape'); // Cancel wire
    
    // Should return to select mode
    expect(await page.locator('[data-tool="select"]').getAttribute('class')).toContain('active');
    
    // Test 2: Delete non-existent element
    await page.keyboard.press('Delete'); // Should not cause error
    
    // Test 3: Export with empty canvas
    await page.click('#export-btn');
    await page.waitForSelector('.export-dialog', { state: 'visible' });
    await page.click('button:has-text("Export")');
    
    // Should handle gracefully
    await page.waitForTimeout(500);
    
    // Test 4: Rapid mode switching
    const tools = ['select', 'wire', 'label'];
    for (let i = 0; i < 10; i++) {
      const tool = tools[i % tools.length];
      await page.click(`[data-tool="${tool}"]`);
    }
    
    // Should end on label tool
    expect(await page.locator('[data-tool="label"]').getAttribute('class')).toContain('active');
    
    // Test 5: Memory stress - rapid creation/deletion
    for (let i = 0; i < 5; i++) {
      // Add 10 elements
      for (let j = 0; j < 10; j++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { 
          position: { x: 100 + j * 50, y: 100 + i * 50 } 
        });
      }
      
      // Delete all
      await page.click('[data-tool="select"]');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
    }
    
    // Check no memory leaks or errors
    const logs = await page.evaluate(() => {
      return window.__stressTestMetrics?.errors || [];
    });
    
    expect(logs).toHaveLength(0);
  });

  test('collaborative features workflow', async ({ page, context }) => {
    // Test features that might be used in collaborative scenarios
    
    // Create initial diagram
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 300, y: 300 } });
    
    // Save state
    await page.click('#save-btn');
    
    // Open in new tab (simulate another user)
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#canvas-svg', { state: 'visible' });
    
    // Both should see the same diagram
    const elements1 = await page.locator('#viewport > g').count();
    const elements2 = await page2.locator('#viewport > g').count();
    
    expect(elements1).toBe(elements2);
    
    // Make changes in first tab
    await page.locator('.palette-item').nth(1).click();
    await page.click('#canvas-svg', { position: { x: 500, y: 300 } });
    await page.click('#save-btn');
    
    // Reload second tab
    await page2.reload();
    await page2.waitForSelector('#canvas-svg', { state: 'visible' });
    
    // Should see updated diagram
    const updatedElements = await page2.locator('#viewport > g').count();
    expect(updatedElements).toBe(elements1 + 1);
    
    await page2.close();
  });

  test('performance under load', async ({ page }) => {
    // Create a complex diagram and measure performance
    
    const startTime = Date.now();
    
    // Add 100 components
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        await page.locator('.palette-item').first().click();
        await page.click('#canvas-svg', { 
          position: { x: 100 + i * 80, y: 100 + j * 60 } 
        });
      }
    }
    
    // Add 50 wires
    await page.click('[data-tool="wire"]');
    for (let i = 0; i < 50; i++) {
      const x1 = 100 + (i % 10) * 80;
      const y1 = 100 + Math.floor(i / 10) * 60;
      const x2 = x1 + 80;
      const y2 = y1;
      
      await page.click('#canvas-svg', { position: { x: x1 + 40, y: y1 } });
      await page.click('#canvas-svg', { position: { x: x2 - 40, y: y2 } });
    }
    
    const creationTime = Date.now() - startTime;
    console.log(`Created 100 components and 50 wires in ${creationTime}ms`);
    
    // Test zoom performance
    const zoomStartTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Control++');
      await page.waitForTimeout(50);
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Control+-');
      await page.waitForTimeout(50);
    }
    const zoomTime = Date.now() - zoomStartTime;
    console.log(`20 zoom operations completed in ${zoomTime}ms`);
    
    // Test selection performance
    await page.click('[data-tool="select"]');
    const selectStartTime = Date.now();
    await page.keyboard.press('Control+a');
    const selectTime = Date.now() - selectStartTime;
    console.log(`Select all (150 elements) completed in ${selectTime}ms`);
    
    // Performance assertions
    expect(creationTime).toBeLessThan(30000); // 30 seconds max
    expect(zoomTime).toBeLessThan(5000); // 5 seconds max
    expect(selectTime).toBeLessThan(1000); // 1 second max
    
    // Check FPS if performance monitor is available
    await page.keyboard.press('Shift+P');
    await page.waitForTimeout(2000); // Let it measure
    
    const fps = await page.locator('#perf-fps').textContent();
    if (fps) {
      expect(parseInt(fps)).toBeGreaterThan(30);
    }
  });

  test('accessibility workflow', async ({ page }) => {
    // Test keyboard-only workflow
    
    // Tab to palette
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Select component with Enter
    await page.keyboard.press('Enter');
    
    // Tab to canvas and place
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Navigate tools with keyboard
    await page.keyboard.press('w'); // Wire tool
    expect(await page.locator('[data-tool="wire"]').getAttribute('class')).toContain('active');
    
    await page.keyboard.press('l'); // Label tool
    expect(await page.locator('[data-tool="label"]').getAttribute('class')).toContain('active');
    
    await page.keyboard.press('Escape'); // Select tool
    expect(await page.locator('[data-tool="select"]').getAttribute('class')).toContain('active');
    
    // Test screen reader announcements
    const ariaLive = await page.locator('[aria-live]').count();
    expect(ariaLive).toBeGreaterThan(0);
    
    // Test high contrast mode
    await page.evaluate(() => {
      document.body.classList.add('high-contrast');
    });
    
    // Verify UI is still usable
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.palette')).toBeVisible();
  });
});