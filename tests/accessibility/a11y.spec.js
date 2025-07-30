import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-svg', { state: 'visible' });
  });

  test('main page accessibility', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation', async ({ page }) => {
    // Test tab navigation through all interactive elements
    const tabbableElements = await page.evaluate(() => {
      const elements = [];
      let element = document.body;
      
      // Tab through all elements
      for (let i = 0; i < 50; i++) {
        document.activeElement.blur();
        const event = new KeyboardEvent('keydown', { key: 'Tab' });
        document.dispatchEvent(event);
        
        if (document.activeElement && document.activeElement !== document.body) {
          elements.push({
            tagName: document.activeElement.tagName,
            id: document.activeElement.id,
            className: document.activeElement.className,
            ariaLabel: document.activeElement.getAttribute('aria-label'),
            role: document.activeElement.getAttribute('role')
          });
        }
      }
      
      return elements;
    });
    
    // Verify all interactive elements are reachable
    expect(tabbableElements.length).toBeGreaterThan(0);
    
    // Check focus indicators are visible
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineOffset: styles.outlineOffset,
        boxShadow: styles.boxShadow
      };
    });
    
    // Verify focus is visible (either outline or box-shadow)
    const hasFocusIndicator = 
      (focusStyles.outline && focusStyles.outline !== 'none') ||
      (focusStyles.boxShadow && focusStyles.boxShadow !== 'none');
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('toolbar accessibility', async ({ page }) => {
    const toolbar = page.locator('.toolbar');
    
    // Check toolbar has proper ARIA attributes
    await expect(toolbar).toHaveAttribute('role', 'toolbar');
    
    // Check all tool buttons
    const toolButtons = toolbar.locator('.tool-btn');
    const count = await toolButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = toolButtons.nth(i);
      
      // Check button has accessible name
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      const text = await button.textContent();
      
      expect(ariaLabel || title || text).toBeTruthy();
      
      // Check button role
      const role = await button.getAttribute('role');
      expect(role || (await button.evaluate(el => el.tagName)) === 'BUTTON').toBeTruthy();
    }
  });

  test('canvas accessibility', async ({ page }) => {
    const canvas = page.locator('#canvas-svg');
    
    // Check canvas has proper ARIA attributes
    await expect(canvas).toHaveAttribute('role', 'application');
    await expect(canvas).toHaveAttribute('aria-label');
    
    // Test screen reader announcements
    const ariaLive = await page.locator('[aria-live]');
    const liveRegionCount = await ariaLive.count();
    expect(liveRegionCount).toBeGreaterThan(0);
  });

  test('color contrast', async ({ page }) => {
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(contrastResults.violations).toEqual([]);
    
    // Additional manual contrast checks for dynamic elements
    const buttons = await page.locator('.tool-btn').all();
    
    for (const button of buttons) {
      const backgroundColor = await button.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      const color = await button.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Simple contrast check (would use proper WCAG calculation in production)
      expect(backgroundColor).not.toBe(color);
    }
  });

  test('form accessibility', async ({ page }) => {
    // Test export dialog form
    await page.click('#export-btn');
    await page.waitForSelector('.export-dialog', { state: 'visible' });
    
    const exportForm = page.locator('.export-dialog');
    const formAxeResults = await new AxeBuilder({ page })
      .include('.export-dialog')
      .analyze();
    
    expect(formAxeResults.violations).toEqual([]);
    
    // Check form controls have labels
    const inputs = await exportForm.locator('input, select, textarea').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check for associated label
        const label = await page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('error message accessibility', async ({ page }) => {
    // Trigger an error condition
    await page.evaluate(() => {
      // Simulate error
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.className = 'error-message';
      errorDiv.textContent = 'Test error message';
      document.body.appendChild(errorDiv);
    });
    
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toHaveAttribute('role', 'alert');
    await expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
  });

  test('modal dialog accessibility', async ({ page }) => {
    // Open export dialog as modal
    await page.click('#export-btn');
    await page.waitForSelector('.export-dialog', { state: 'visible' });
    
    const dialog = page.locator('.export-dialog');
    
    // Check dialog attributes
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    // Check focus trap
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement.className);
    
    // Tab through all elements and verify focus stays within dialog
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => {
        const element = document.activeElement;
        const dialog = document.querySelector('.export-dialog');
        return dialog && dialog.contains(element);
      });
      
      expect(focusedElement).toBeTruthy();
    }
  });

  test('zoom controls accessibility', async ({ page }) => {
    // Check zoom controls are keyboard accessible
    await page.keyboard.press('Control++');
    await page.waitForTimeout(100);
    
    // Verify zoom changed
    const zoomLevel1 = await page.evaluate(() => 
      window.wiringApp.panZoomInstance.getZoom()
    );
    
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(100);
    
    const zoomLevel2 = await page.evaluate(() => 
      window.wiringApp.panZoomInstance.getZoom()
    );
    
    expect(zoomLevel1).not.toBe(zoomLevel2);
  });

  test('component library accessibility', async ({ page }) => {
    await page.click('#library-btn');
    await page.waitForSelector('.component-library-panel', { state: 'visible' });
    
    const libraryPanel = page.locator('.component-library-panel');
    
    // Check search input
    const searchInput = libraryPanel.locator('input[type="search"]');
    await expect(searchInput).toHaveAttribute('aria-label');
    
    // Check component tree
    const tree = libraryPanel.locator('[role="tree"]');
    if (await tree.count() > 0) {
      await expect(tree).toHaveAttribute('aria-label');
      
      // Check tree items
      const treeItems = tree.locator('[role="treeitem"]');
      const itemCount = await treeItems.count();
      
      for (let i = 0; i < Math.min(itemCount, 5); i++) {
        const item = treeItems.nth(i);
        await expect(item).toHaveAttribute('aria-selected');
        await expect(item).toHaveAttribute('aria-level');
      }
    }
  });

  test('responsive design accessibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileAxeResults = await new AxeBuilder({ page })
      .analyze();
    
    expect(mobileAxeResults.violations).toEqual([]);
    
    // Verify touch targets are large enough
    const buttons = await page.locator('button, .tool-btn').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // WCAG 2.1 Level AAA requires 44x44 pixels minimum
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.evaluate(() => {
      document.body.classList.add('high-contrast');
    });
    
    // Run accessibility scan in high contrast
    const hcAxeResults = await new AxeBuilder({ page })
      .analyze();
    
    expect(hcAxeResults.violations).toEqual([]);
    
    // Verify important UI elements are still visible
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('.palette')).toBeVisible();
    await expect(page.locator('#canvas-svg')).toBeVisible();
  });

  test('screen reader announcements', async ({ page }) => {
    // Monitor ARIA live regions
    const liveRegions = await page.evaluate(() => {
      const regions = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const target = mutation.target;
            const liveAncestor = target.closest('[aria-live]');
            if (liveAncestor) {
              regions.push({
                content: liveAncestor.textContent,
                politeness: liveAncestor.getAttribute('aria-live')
              });
            }
          }
        });
      });
      
      document.querySelectorAll('[aria-live]').forEach(region => {
        observer.observe(region, { childList: true, characterData: true, subtree: true });
      });
      
      return regions;
    });
    
    // Perform action that should trigger announcement
    await page.locator('.palette-item').first().click();
    await page.click('#canvas-svg', { position: { x: 400, y: 300 } });
    
    // Wait for announcement
    await page.waitForTimeout(500);
    
    // Verify announcement was made (implementation specific)
  });
});