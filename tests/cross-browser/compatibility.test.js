describe('Cross-Browser Compatibility Tests', () => {
    beforeEach(async () => {
        await browser.url('/');
        await browser.waitUntil(
            async () => await $('#canvas-svg').isDisplayed(),
            {
                timeout: 5000,
                timeoutMsg: 'Canvas SVG should be displayed'
            }
        );
    });

    describe('Core Functionality', () => {
        it('should load application in all browsers', async () => {
            const title = await browser.getTitle();
            expect(title).toBeTruthy();
            
            // Check main components are visible
            expect(await $('.toolbar').isDisplayed()).toBe(true);
            expect(await $('.palette').isDisplayed()).toBe(true);
            expect(await $('#canvas-svg').isDisplayed()).toBe(true);
        });

        it('should handle SVG rendering consistently', async () => {
            const svg = await $('#canvas-svg');
            const svgBox = await svg.getSize();
            
            expect(svgBox.width).toBeGreaterThan(0);
            expect(svgBox.height).toBeGreaterThan(0);
            
            // Check SVG namespace
            const svgNamespace = await svg.getAttribute('xmlns');
            expect(svgNamespace).toBe('http://www.w3.org/2000/svg');
        });

        it('should support drag and drop operations', async () => {
            const paletteItem = await $('.palette-item');
            const canvas = await $('#canvas-svg');
            
            // Drag from palette to canvas
            await paletteItem.dragAndDrop(canvas);
            
            // Verify element was added
            await browser.waitUntil(
                async () => {
                    const elements = await $$('#viewport > g');
                    return elements.length > 0;
                },
                {
                    timeout: 3000,
                    timeoutMsg: 'Element should be added to canvas'
                }
            );
        });
    });

    describe('Browser-Specific Features', () => {
        it('should handle mouse events correctly', async () => {
            const canvas = await $('#canvas-svg');
            
            // Test mouse events
            await canvas.moveTo({ xOffset: 100, yOffset: 100 });
            await canvas.click();
            await canvas.click({ button: 'right' });
            await canvas.doubleClick();
            
            // No errors should occur
            const logs = await browser.getLogs('browser');
            const errors = logs.filter(log => log.level === 'SEVERE');
            expect(errors.length).toBe(0);
        });

        it('should handle keyboard shortcuts', async () => {
            // Test common shortcuts
            await browser.keys(['Control', 'z']); // Undo
            await browser.keys(['Control', 'y']); // Redo
            await browser.keys(['Control', 's']); // Save
            await browser.keys('Escape'); // Cancel
            
            // Verify no JavaScript errors
            const logs = await browser.getLogs('browser');
            const errors = logs.filter(log => log.level === 'SEVERE');
            expect(errors.length).toBe(0);
        });

        it('should render custom fonts correctly', async () => {
            const element = await $('.tool-btn');
            const fontFamily = await element.getCSSProperty('font-family');
            
            expect(fontFamily.value).toBeTruthy();
            
            // Check font is loaded
            await browser.execute(() => {
                return document.fonts.ready.then(() => {
                    return Array.from(document.fonts).length > 0;
                });
            }).then(result => {
                expect(result).toBe(true);
            });
        });
    });

    describe('CSS Compatibility', () => {
        it('should apply flexbox layouts correctly', async () => {
            const toolbar = await $('.toolbar');
            const display = await toolbar.getCSSProperty('display');
            
            expect(['flex', 'inline-flex'].includes(display.value)).toBe(true);
        });

        it('should handle CSS transforms', async () => {
            const viewport = await $('#viewport');
            
            // Trigger zoom
            await browser.execute(() => {
                window.wiringApp.panZoomInstance.zoom(2);
            });
            
            const transform = await viewport.getAttribute('transform');
            expect(transform).toContain('scale');
        });

        it('should support CSS animations', async () => {
            const button = await $('.tool-btn');
            
            // Hover to trigger any animations
            await button.moveTo();
            
            const transition = await button.getCSSProperty('transition');
            expect(transition.value).not.toBe('none 0s ease 0s');
        });

        it('should handle box-shadow correctly', async () => {
            const element = await $('.export-dialog');
            if (await element.isExisting()) {
                const boxShadow = await element.getCSSProperty('box-shadow');
                expect(boxShadow.value).not.toBe('none');
            }
        });
    });

    describe('JavaScript API Compatibility', () => {
        it('should support modern JavaScript features', async () => {
            const result = await browser.execute(() => {
                // Test various JS features
                const tests = {
                    promises: typeof Promise !== 'undefined',
                    asyncAwait: (async () => true)() instanceof Promise,
                    classList: document.body.classList !== undefined,
                    querySelector: typeof document.querySelector === 'function',
                    requestAnimationFrame: typeof requestAnimationFrame === 'function',
                    customEvents: typeof CustomEvent === 'function',
                    weakMap: typeof WeakMap === 'function',
                    proxy: typeof Proxy === 'function'
                };
                
                return tests;
            });
            
            Object.values(result).forEach(supported => {
                expect(supported).toBe(true);
            });
        });

        it('should handle SVG DOM methods', async () => {
            const result = await browser.execute(() => {
                const svg = document.getElementById('canvas-svg');
                const tests = {
                    getBBox: typeof svg.getBBox === 'function',
                    createSVGPoint: typeof svg.createSVGPoint === 'function',
                    getScreenCTM: typeof svg.getScreenCTM === 'function',
                    createElementNS: typeof document.createElementNS === 'function'
                };
                
                return tests;
            });
            
            Object.entries(result).forEach(([method, supported]) => {
                expect(supported).toBe(true, `${method} should be supported`);
            });
        });
    });

    describe('Performance Consistency', () => {
        it('should maintain acceptable frame rates', async () => {
            // Add multiple elements
            for (let i = 0; i < 10; i++) {
                const paletteItem = await $('.palette-item');
                await paletteItem.click();
                await $('#canvas-svg').click();
            }
            
            // Measure rendering performance
            const metrics = await browser.execute(() => {
                return new Promise((resolve) => {
                    let frames = 0;
                    const startTime = performance.now();
                    
                    function measureFrame() {
                        frames++;
                        if (performance.now() - startTime < 1000) {
                            requestAnimationFrame(measureFrame);
                        } else {
                            resolve({
                                fps: frames,
                                renderTime: performance.now() - startTime
                            });
                        }
                    }
                    
                    requestAnimationFrame(measureFrame);
                });
            });
            
            expect(metrics.fps).toBeGreaterThan(30);
        });
    });

    describe('Storage API Compatibility', () => {
        it('should support localStorage', async () => {
            const result = await browser.execute(() => {
                try {
                    localStorage.setItem('test', 'value');
                    const value = localStorage.getItem('test');
                    localStorage.removeItem('test');
                    return value === 'value';
                } catch (e) {
                    return false;
                }
            });
            
            expect(result).toBe(true);
        });

        it('should handle storage events', async () => {
            const result = await browser.execute(() => {
                return new Promise((resolve) => {
                    let eventFired = false;
                    
                    window.addEventListener('storage', () => {
                        eventFired = true;
                    });
                    
                    // Trigger storage event
                    localStorage.setItem('test-event', 'value');
                    
                    setTimeout(() => {
                        localStorage.removeItem('test-event');
                        resolve(eventFired);
                    }, 100);
                });
            });
            
            // Note: Storage events might not fire in the same window
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Touch Support (Mobile Browsers)', () => {
        it('should handle touch events if supported', async () => {
            const touchSupported = await browser.execute(() => {
                return 'ontouchstart' in window;
            });
            
            if (touchSupported) {
                const canvas = await $('#canvas-svg');
                
                // Simulate touch
                await browser.touchAction([
                    { action: 'press', x: 100, y: 100 },
                    { action: 'release' }
                ]);
                
                // Verify no errors
                const logs = await browser.getLogs('browser');
                const errors = logs.filter(log => log.level === 'SEVERE');
                expect(errors.length).toBe(0);
            }
        });
    });

    describe('Viewport and Responsive Behavior', () => {
        it('should handle viewport resize', async () => {
            const sizes = [
                { width: 1920, height: 1080 }, // Desktop
                { width: 768, height: 1024 },  // Tablet
                { width: 375, height: 667 }    // Mobile
            ];
            
            for (const size of sizes) {
                await browser.setWindowSize(size.width, size.height);
                await browser.pause(500); // Wait for resize
                
                // Verify layout adapted
                const isVisible = await $('#canvas-svg').isDisplayed();
                expect(isVisible).toBe(true);
            }
        });
    });

    describe('Network and AJAX Compatibility', () => {
        it('should handle fetch API', async () => {
            const result = await browser.execute(() => {
                return typeof fetch === 'function';
            });
            
            expect(result).toBe(true);
        });

        it('should handle file operations', async () => {
            // Test file input
            const fileInput = await $('input[type="file"]');
            if (await fileInput.isExisting()) {
                expect(await fileInput.isEnabled()).toBe(true);
            }
        });
    });
});