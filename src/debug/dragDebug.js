// Debug module for drag functionality
export class DragDebugger {
    static init() {
        console.log('DragDebugger initialized');
        
        // Monitor all mousedown events on the SVG
        const svg = document.getElementById('canvas-svg');
        if (!svg) {
            console.error('SVG element not found');
            return;
        }
        
        // Capture phase to see all events
        svg.addEventListener('mousedown', (e) => {
            console.group('MouseDown Event Debug');
            console.log('Target:', e.target);
            console.log('Target classes:', e.target.classList?.toString());
            console.log('Target tagName:', e.target.tagName);
            
            // Check if it's a component
            const component = e.target.closest('.component');
            if (component) {
                console.log('Component found:', component.id);
                console.log('Component transform:', component.getAttribute('transform'));
                
                // Check drag handle
                const dragHandle = component.querySelector('.component-drag-handle');
                console.log('Has drag handle:', !!dragHandle);
                
                // Check current mode
                if (window.wiringApp) {
                    console.log('Current tool:', window.wiringApp.currentTool);
                    console.log('Canvas mode:', window.wiringApp.canvas.mode);
                }
            }
            
            console.log('Event propagation stopped:', e.defaultPrevented);
            console.groupEnd();
        }, true); // Use capture phase
        
        // Monitor component creation
        const originalCreateElement = window.wiringApp?.elementFactory?.createElement;
        if (originalCreateElement) {
            window.wiringApp.elementFactory.createElement = function(...args) {
                console.log('Creating component:', args[0], 'at', args[1], args[2]);
                const result = originalCreateElement.apply(this, args);
                console.log('Component created:', result);
                
                // Check if makeDraggable was called
                setTimeout(() => {
                    const dragHandle = result.querySelector('.component-drag-handle');
                    console.log('Drag handle exists after creation:', !!dragHandle);
                    console.log('Component has mousedown listeners:', result._dragHandlers ? 'Yes' : 'No');
                }, 100);
                
                return result;
            };
        }
        
        // Add visual debugging
        this.addVisualDebug();
    }
    
    static addVisualDebug() {
        // Add style to highlight drag handles
        const style = document.createElement('style');
        style.textContent = `
            /* Debug: Highlight drag handles */
            .debug-mode .component-drag-handle {
                fill: rgba(255, 0, 0, 0.1) !important;
                stroke: red !important;
                stroke-width: 2 !important;
                stroke-dasharray: 5,5 !important;
            }
            
            .debug-mode .component.dragging {
                filter: drop-shadow(0 0 10px red);
            }
            
            .debug-mode .component:hover {
                filter: drop-shadow(0 0 5px blue);
            }
        `;
        document.head.appendChild(style);
        
        // Add debug toggle button
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Toggle Debug';
        debugBtn.style.position = 'fixed';
        debugBtn.style.bottom = '60px';
        debugBtn.style.right = '20px';
        debugBtn.style.zIndex = '1000';
        debugBtn.onclick = () => {
            document.body.classList.toggle('debug-mode');
            console.log('Debug mode:', document.body.classList.contains('debug-mode'));
        };
        document.body.appendChild(debugBtn);
    }
    
    static testDragFunctionality() {
        console.log('=== Drag Functionality Test ===');
        
        const app = window.wiringApp;
        if (!app) {
            console.error('App not initialized');
            return;
        }
        
        // Check tool state
        console.log('Current tool:', app.currentTool);
        console.log('Canvas mode:', app.canvas.mode);
        
        // Check pan-zoom state
        console.log('Pan enabled:', app.panZoomInstance.isPanEnabled());
        console.log('Pan-zoom zoom level:', app.panZoomInstance.getZoom());
        
        // Check components
        const components = document.querySelectorAll('.component');
        console.log('Components on canvas:', components.length);
        
        components.forEach((comp, i) => {
            console.log(`Component ${i}:`, {
                id: comp.id,
                transform: comp.getAttribute('transform'),
                hasDragHandle: !!comp.querySelector('.component-drag-handle'),
                classes: comp.classList.toString()
            });
        });
    }
}

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DragDebugger.init());
} else {
    DragDebugger.init();
}

// Export for console access
window.DragDebugger = DragDebugger;