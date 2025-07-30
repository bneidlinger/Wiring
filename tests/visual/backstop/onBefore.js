module.exports = async (page, scenario, viewport, isReference, browserContext) => {
  // Set up consistent environment
  await page.setViewportSize(viewport);
  
  // Disable animations for consistent screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
  
  // Set consistent date/time if needed
  await page.evaluateOnNewDocument(() => {
    // Mock Date to ensure consistent timestamps
    const constantDate = new Date('2024-01-01T12:00:00Z');
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(constantDate);
        } else {
          super(...args);
        }
      }
      static now() {
        return constantDate.getTime();
      }
    };
  });
  
  // Wait for fonts to load
  await page.evaluateHandle(() => document.fonts.ready);
};