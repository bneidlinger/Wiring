import '@testing-library/jest-dom';

// Mock SVG-related functions
global.SVGElement = global.SVGElement || {};
global.SVGPathElement = global.SVGPathElement || {};
global.SVGGElement = global.SVGGElement || {};

// Mock getBBox for SVG elements
if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
}

// Mock getComputedTextLength for SVG text elements
if (!SVGElement.prototype.getComputedTextLength) {
  SVGElement.prototype.getComputedTextLength = () => 100;
}

// Mock createSVGPoint
if (!SVGSVGElement.prototype.createSVGPoint) {
  SVGSVGElement.prototype.createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform: () => ({ x: 0, y: 0 })
  });
}

// Mock getScreenCTM
if (!SVGElement.prototype.getScreenCTM) {
  SVGElement.prototype.getScreenCTM = () => ({
    inverse: () => ({
      a: 1, b: 0, c: 0, d: 1, e: 0, f: 0
    })
  });
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock performance.now() for consistent timing in tests
global.performance = {
  now: () => Date.now()
};

// Suppress console errors in tests unless explicitly testing for them
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});