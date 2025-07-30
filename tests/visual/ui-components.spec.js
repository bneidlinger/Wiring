import { test, expect } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

test.describe('UI Components Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-svg', { state: 'visible' });
  });

  test('toolbar appearance', async ({ page }) => {
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.toolbar')).toHaveScreenshot('toolbar.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
    
    // Percy snapshot for cross-browser comparison
    await percySnapshot(page, 'Toolbar - Default State');
  });

  test('palette components', async ({ page }) => {
    const palette = page.locator('.palette');
    await expect(palette).toBeVisible();
    
    // Capture each component in palette
    const components = await palette.locator('.palette-item').all();
    for (let i = 0; i < components.length; i++) {
      await expect(components[i]).toHaveScreenshot(`palette-item-${i}.png`, {
        maxDiffPixels: 50,
        threshold: 0.1
      });
    }
    
    await percySnapshot(page, 'Component Palette - All Items');
  });

  test('wire tool UI', async ({ page }) => {
    await page.click('[data-tool="wire"]');
    await page.waitForSelector('#wire-tools', { state: 'visible' });
    
    await expect(page.locator('#wire-tools')).toHaveScreenshot('wire-tools.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Wire Tools Panel');
  });

  test('export dialog appearance', async ({ page }) => {
    await page.click('#export-btn');
    await page.waitForSelector('.export-dialog', { state: 'visible' });
    
    await expect(page.locator('.export-dialog')).toHaveScreenshot('export-dialog.png', {
      maxDiffPixels: 150,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Export Dialog - All Options');
  });

  test('component library panel', async ({ page }) => {
    await page.click('#library-btn');
    await page.waitForSelector('.component-library-panel', { state: 'visible' });
    
    await expect(page.locator('.component-library-panel')).toHaveScreenshot('component-library.png', {
      maxDiffPixels: 200,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Component Library Panel');
  });

  test('save indicator states', async ({ page }) => {
    const saveIndicator = page.locator('.save-indicator');
    
    // Saved state
    await expect(saveIndicator).toHaveScreenshot('save-indicator-saved.png', {
      maxDiffPixels: 50,
      threshold: 0.1
    });
    
    // Trigger unsaved state by adding an element
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg');
    
    // Unsaved state
    await expect(saveIndicator).toHaveScreenshot('save-indicator-unsaved.png', {
      maxDiffPixels: 50,
      threshold: 0.1
    });
    
    await percySnapshot(page, 'Save Indicator States');
  });

  test('performance monitor', async ({ page }) => {
    await page.keyboard.press('Shift+P');
    await page.waitForSelector('#performance-monitor.active', { state: 'visible' });
    
    await expect(page.locator('#performance-monitor')).toHaveScreenshot('performance-monitor.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Performance Monitor');
  });

  test('context menus', async ({ page }) => {
    // Add an element first
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 300, y: 300 } });
    
    // Right click to show context menu
    await page.click('#canvas-svg', { button: 'right', position: { x: 300, y: 300 } });
    await page.waitForSelector('.context-menu', { state: 'visible' });
    
    await expect(page.locator('.context-menu')).toHaveScreenshot('context-menu.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
    
    await percySnapshot(page, 'Element Context Menu');
  });

  test('responsive layout - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for layout adjustment
    
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      maxDiffPixels: 500,
      threshold: 0.3
    });
    
    await percySnapshot(page, 'Mobile Layout - iPhone');
  });

  test('responsive layout - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('tablet-layout.png', {
      fullPage: true,
      maxDiffPixels: 500,
      threshold: 0.3
    });
    
    await percySnapshot(page, 'Tablet Layout - iPad');
  });

  test('dark mode theme', async ({ page }) => {
    // Assuming dark mode toggle exists
    await page.evaluate(() => {
      document.body.classList.add('dark-theme');
    });
    
    await expect(page).toHaveScreenshot('dark-mode.png', {
      fullPage: true,
      maxDiffPixels: 1000,
      threshold: 0.3
    });
    
    await percySnapshot(page, 'Dark Mode Theme');
  });

  test('hover states', async ({ page }) => {
    const toolBtn = page.locator('[data-tool="wire"]');
    
    // Capture hover state
    await toolBtn.hover();
    await expect(toolBtn).toHaveScreenshot('tool-button-hover.png', {
      maxDiffPixels: 50,
      threshold: 0.1
    });
    
    // Capture active state
    await toolBtn.click();
    await expect(toolBtn).toHaveScreenshot('tool-button-active.png', {
      maxDiffPixels: 50,
      threshold: 0.1
    });
    
    await percySnapshot(page, 'Button States - Hover and Active');
  });

  test('focus indicators', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveScreenshot('focus-indicator-1.png', {
      maxDiffPixels: 50,
      threshold: 0.1
    });
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveScreenshot('focus-indicator-2.png', {
      maxDiffPixels: 50,
      threshold: 0.1
    });
    
    await percySnapshot(page, 'Focus Indicators');
  });
});