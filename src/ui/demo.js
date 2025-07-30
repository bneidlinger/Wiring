/**
 * Demo initialization to showcase the new UI features
 * This file demonstrates how to use the new professional UI
 */

// Example of how to initialize and use the new UI features

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Wiring Diagram Professional UI Demo ===');
    
    // The UIManager is automatically initialized when the app starts
    // Access it through window.wiringApp.uiManager
    
    setTimeout(() => {
        const app = window.wiringApp;
        if (!app || !app.uiManager) {
            console.error('App not initialized yet');
            return;
        }
        
        console.log('UI Features Available:');
        console.log('1. Dark Mode Toggle - Click the sun/moon icon in the toolbar');
        console.log('2. Collapsible Sidebar - Click the arrow on the sidebar edge or press Ctrl+B');
        console.log('3. Component Search - Type in the search box to filter components');
        console.log('4. Keyboard Shortcuts - Press ? to see all shortcuts');
        console.log('5. Context Menu - Right-click on the canvas');
        console.log('6. Property Panel - Select a component to see its properties');
        console.log('7. Wire Settings - Select the wire tool to see wire options');
        
        // Demo: Show keyboard shortcuts panel
        console.log('\nShowing keyboard shortcuts panel...');
        app.uiManager.showPanel('shortcuts-panel');
        
        // Demo: Component search
        setTimeout(() => {
            console.log('\nDemo: Searching for "power" components...');
            const searchInput = document.getElementById('component-search');
            searchInput.value = 'power';
            searchInput.dispatchEvent(new Event('input'));
            
            // Clear search after 3 seconds
            setTimeout(() => {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }, 3000);
        }, 2000);
        
        // Demo: Theme toggle
        setTimeout(() => {
            console.log('\nDemo: Toggling dark mode...');
            app.uiManager.setTheme('dark');
            
            // Toggle back after 3 seconds
            setTimeout(() => {
                app.uiManager.setTheme('light');
            }, 3000);
        }, 5000);
        
        // Demo: Sidebar toggle
        setTimeout(() => {
            console.log('\nDemo: Toggling sidebar...');
            app.uiManager.toggleSidebar();
            
            // Toggle back after 2 seconds
            setTimeout(() => {
                app.uiManager.toggleSidebar();
            }, 2000);
        }, 8000);
        
    }, 1000);
});

// Accessibility testing helper
window.testAccessibility = function() {
    console.log('\n=== Accessibility Test ===');
    
    // Check ARIA labels
    const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby]');
    console.log(`Elements with ARIA labels: ${elementsWithAria.length}`);
    
    // Check keyboard navigation
    const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    console.log(`Focusable elements: ${focusableElements.length}`);
    
    // Check color contrast
    const styles = getComputedStyle(document.documentElement);
    console.log('Theme colors:', {
        primary: styles.getPropertyValue('--primary-color'),
        background: styles.getPropertyValue('--bg-primary'),
        text: styles.getPropertyValue('--text-primary')
    });
    
    // Test keyboard navigation
    console.log('\nTesting keyboard navigation:');
    console.log('- Press Tab to navigate through UI elements');
    console.log('- Press Shift+Tab to navigate backwards');
    console.log('- Press Enter or Space to activate buttons');
    console.log('- Press Escape to close panels');
    console.log('- Use arrow keys in component palette');
    
    // Test screen reader announcements
    const liveRegion = document.getElementById('aria-live');
    console.log(`Live region for announcements: ${liveRegion ? 'Present' : 'Missing'}`);
    
    // Focus the first toolbar button to start keyboard navigation
    const firstButton = document.querySelector('.btn');
    if (firstButton) {
        firstButton.focus();
        console.log('Focused first button - start tabbing!');
    }
};

// UI customization example
window.customizeUI = function() {
    console.log('\n=== UI Customization Example ===');
    
    // Add custom theme colors
    const root = document.documentElement;
    
    // Create a custom "blue" theme
    root.style.setProperty('--primary-color', '#1976d2');
    root.style.setProperty('--primary-hover', '#1565c0');
    root.style.setProperty('--primary-light', '#bbdefb');
    
    console.log('Applied custom blue theme colors');
    
    // Add custom component category
    const palette = document.querySelector('.component-palette');
    const customCategory = document.createElement('div');
    customCategory.className = 'component-category';
    customCategory.innerHTML = `
        <div class="category-header" role="button" tabindex="0" aria-expanded="true">
            <h3 class="category-title">Custom Components</h3>
            <svg class="icon category-toggle"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="component-grid" role="list">
            <div class="component-item" data-type="CUSTOM1" draggable="true" role="listitem" tabindex="0">
                <div class="component-preview" style="height: 48px; display: flex; align-items: center; justify-content: center; background: #e3f2fd;">
                    <span style="font-size: 24px;">⚡</span>
                </div>
                <span class="component-name">Custom 1</span>
            </div>
            <div class="component-item" data-type="CUSTOM2" draggable="true" role="listitem" tabindex="0">
                <div class="component-preview" style="height: 48px; display: flex; align-items: center; justify-content: center; background: #e3f2fd;">
                    <span style="font-size: 24px;">🔌</span>
                </div>
                <span class="component-name">Custom 2</span>
            </div>
        </div>
    `;
    
    palette.appendChild(customCategory);
    console.log('Added custom component category');
    
    // Re-initialize drag-drop for new components
    if (window.wiringApp && window.wiringApp.uiManager) {
        window.wiringApp.uiManager.initializeComponentDragDrop();
    }
};

// Performance monitoring
window.monitorPerformance = function() {
    console.log('\n=== UI Performance Monitor ===');
    
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    // Measure sidebar toggle performance
    performance.mark('sidebar-toggle-start');
    window.wiringApp.uiManager.toggleSidebar();
    performance.mark('sidebar-toggle-end');
    performance.measure('Sidebar Toggle', 'sidebar-toggle-start', 'sidebar-toggle-end');
    
    // Measure theme switch performance
    performance.mark('theme-switch-start');
    window.wiringApp.uiManager.setTheme(
        window.wiringApp.uiManager.theme === 'light' ? 'dark' : 'light'
    );
    performance.mark('theme-switch-end');
    performance.measure('Theme Switch', 'theme-switch-start', 'theme-switch-end');
    
    console.log('Performance measurements logged above');
};

console.log('Demo functions available:');
console.log('- testAccessibility() - Test accessibility features');
console.log('- customizeUI() - Example of UI customization');
console.log('- monitorPerformance() - Monitor UI performance');