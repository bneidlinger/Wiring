module.exports = async (page, scenario, viewport, isReference, browserContext) => {
  console.log('SCENARIO > ' + scenario.label);
  
  // Wait for any lazy-loaded content
  await page.waitForLoadState('networkidle');
  
  // Additional scenario-specific actions
  if (scenario.hoverSelector) {
    await page.hover(scenario.hoverSelector);
  }
  
  if (scenario.clickSelector) {
    await page.click(scenario.clickSelector);
  }
  
  if (scenario.postInteractionWait) {
    await page.waitForTimeout(scenario.postInteractionWait);
  }
  
  // Ensure canvas is ready
  if (scenario.label.includes('Canvas')) {
    await page.waitForSelector('#canvas-svg', { state: 'visible' });
    await page.waitForTimeout(500); // Additional time for rendering
  }
  
  // Hide any time-sensitive elements
  await page.evaluate(() => {
    // Hide save indicator if it shows timestamps
    const saveIndicator = document.querySelector('.save-indicator');
    if (saveIndicator && saveIndicator.textContent.includes('ago')) {
      saveIndicator.textContent = 'Saved';
    }
    
    // Hide performance monitor values
    const perfMonitor = document.querySelector('#performance-monitor');
    if (perfMonitor && perfMonitor.classList.contains('active')) {
      const values = perfMonitor.querySelectorAll('[id^="perf-"]');
      values.forEach(val => {
        if (val.id === 'perf-fps') val.textContent = '60';
        else if (val.id === 'perf-render') val.textContent = '16.67ms';
        else if (val.id === 'perf-visible') val.textContent = '10';
        else if (val.id === 'perf-total') val.textContent = '10';
        else if (val.id === 'perf-culled') val.textContent = '0.0%';
      });
    }
  });
};