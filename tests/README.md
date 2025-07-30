# Wiring Diagram Application - Quality Assurance Test Suite

This comprehensive test suite ensures the wiring diagram application works correctly across all scenarios, browsers, and performance requirements.

## Test Suite Overview

### 1. Visual Regression Testing (`/visual`)
- **UI Components**: Validates appearance of toolbar, palette, dialogs
- **Canvas Rendering**: Tests component rendering, wire routing, zoom/pan
- **Responsive Design**: Ensures proper layout on different screen sizes
- **Cross-browser Visual Consistency**: Uses Percy for cloud-based visual testing

### 2. Performance Testing (`/performance`)
- **Rendering Performance**: FPS monitoring, render time measurements
- **Load Testing**: Handles 5000+ elements, complex wire routing
- **Memory Profiling**: Detects memory leaks, monitors heap usage
- **Optimization Validation**: Viewport culling, batch updates

### 3. Cross-Browser Compatibility (`/cross-browser`)
- **Browsers Tested**: Chrome, Firefox, Safari, Edge, Mobile browsers
- **Feature Detection**: SVG support, modern JavaScript APIs
- **Rendering Consistency**: Visual and functional parity
- **Touch Support**: Mobile interaction testing

### 4. Accessibility Testing (`/accessibility`)
- **WCAG Compliance**: Level AA standards
- **Keyboard Navigation**: Full keyboard operability
- **Screen Reader Support**: ARIA labels and live regions
- **Color Contrast**: Meets minimum contrast ratios

### 5. Unit Tests (`/unit`)
- **Component Tests**: SvgCanvas, ElementFactory, WireTool
- **State Management**: StateStore, Command pattern
- **Utility Functions**: Validation, compression, routing algorithms

### 6. Integration Tests (`/integration`)
- **Component Rendering**: Accuracy, positioning, visual states
- **Wire Routing**: A* algorithm, obstacle avoidance
- **Export Quality**: SVG, PNG, PDF validation

### 7. End-to-End Tests (`/e2e`)
- **Complete Workflows**: Full diagram creation scenarios
- **Error Recovery**: Graceful handling of edge cases
- **Performance Under Load**: Complex diagram handling

### 8. Memory Leak Detection (`/memory`)
- **Component Lifecycle**: Creation/destruction cycles
- **Event Listeners**: Proper cleanup validation
- **DOM Node Management**: No orphaned elements

### 9. Load/Stress Testing (`/load`)
- **Massive Element Creation**: 5000+ components
- **Rapid Interactions**: 10+ operations per second
- **Concurrent Operations**: Multi-user simulation

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Start development server (required for most tests)
npm run dev
```

### Run All Tests
```bash
node tests/run-all-tests.js
```

### Run Individual Test Suites
```bash
# Unit tests
npm run test:unit

# Visual regression tests
npm run test:visual
npm run test:visual:update  # Update snapshots

# E2E tests
npm run test:e2e

# Performance tests
npm run test:perf

# Accessibility tests
npm run test:a11y

# Cross-browser tests
npm run test:cross-browser

# Memory leak detection
npm run test:memory

# Load/stress tests
npm run test:load
```

### Visual Testing Options
```bash
# Percy (cloud-based)
npm run test:visual:percy

# BackstopJS (local)
npm run test:visual:backstop
npm run test:visual:backstop:approve  # Approve changes
```

## Test Reports

All test results are saved in `/tests/reports/`:
- `coverage/` - Code coverage reports
- `playwright-report/` - E2E test results with screenshots
- `performance/` - Performance metrics and recommendations
- `memory/` - Memory leak analysis
- `backstop/` - Visual regression reports
- `test-summary.html` - Overall test run summary

## CI/CD Integration

Run tests in CI environment:
```bash
npm run test:ci
```

This runs critical tests in parallel with proper error handling.

## Performance Benchmarks

Expected performance targets:
- Initial load: < 3 seconds
- Component creation: < 50ms per component
- Wire routing: < 100ms for complex paths
- 60 FPS with 1000 elements on screen
- Memory usage: < 100MB for typical diagrams

## Visual Regression Workflow

1. Make UI changes
2. Run visual tests: `npm run test:visual`
3. Review failures in report
4. If changes are intentional:
   - Update snapshots: `npm run test:visual:update`
   - Or approve in BackstopJS: `npm run test:visual:backstop:approve`
5. Commit updated snapshots

## Debugging Failed Tests

### Visual Tests
- Check `/tests/reports/playwright-report` for screenshots
- Compare against baseline images in `/tests/visual/__screenshots__`

### Performance Tests
- Review `/tests/reports/performance/` for detailed metrics
- Check performance monitor in app (Shift+P)

### Memory Tests
- Analyze heap snapshots in `/tests/reports/memory/`
- Use Chrome DevTools for detailed profiling

## Adding New Tests

### Unit Test Template
```javascript
describe('ComponentName', () => {
  let component;
  
  beforeEach(() => {
    component = new ComponentName();
  });
  
  test('should perform expected behavior', () => {
    const result = component.method();
    expect(result).toBe(expected);
  });
});
```

### Visual Test Template
```javascript
test('component visual appearance', async ({ page }) => {
  await page.goto('/');
  const element = page.locator('.component');
  await expect(element).toHaveScreenshot('component.png');
});
```

## Test Data

Test fixtures are located in `/tests/fixtures/`:
- Sample diagrams
- Component templates
- Export samples

## Troubleshooting

### Common Issues

1. **Tests fail with "Server not running"**
   - Start dev server: `npm run dev`

2. **Visual tests fail on different OS**
   - Use Docker for consistent rendering
   - Or update snapshots for your OS

3. **Memory tests take too long**
   - Reduce iteration counts in test config
   - Run with `--no-headless` to see progress

4. **Cross-browser tests fail**
   - Ensure all browsers are installed
   - Check WebDriver compatibility

## Contributing

When adding new features:
1. Write unit tests for new functions
2. Add integration tests for workflows
3. Update visual regression tests
4. Run performance tests to ensure no regression
5. Update this documentation

## Test Coverage Goals

- Unit Tests: 80% code coverage
- Visual Tests: All UI components and states
- E2E Tests: All critical user workflows
- Performance: No regression from benchmarks
- Accessibility: WCAG AA compliance