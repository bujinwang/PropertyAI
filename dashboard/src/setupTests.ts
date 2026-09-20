// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jest-axe adds custom jest matchers for accessibility testing
import 'jest-axe/extend-expect';

// Import accessibility styles for testing
import './styles/accessibility.css';

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock PerformanceObserver for tests
// jsdom does not implement it. Most call sites guard with
// `'PerformanceObserver' in window`, but `utils/analytics.ts` constructs three
// of them unguarded at module scope, so every suite that imports App.tsx fails
// without this stub.
global.PerformanceObserver = class PerformanceObserver {
  static readonly supportedEntryTypes: readonly string[] = [];

  constructor(_callback: PerformanceObserverCallback) {}

  observe(): void {
    return undefined;
  }

  disconnect(): void {
    return undefined;
  }

  takeRecords(): PerformanceObserverEntryList {
    return {
      getEntries: () => [],
      getEntriesByName: () => [],
      getEntriesByType: () => [],
    } as unknown as PerformanceObserverEntryList;
  }
} as unknown as typeof PerformanceObserver;

// Mock IndexedDB for tests
// jsdom does not implement IndexedDB, and `utils/indexedDB.ts` opens a
// connection in its constructor — which runs at import time — so any suite that
// imports the offline layer (directly, or transitively through App.tsx) dies
// with `ReferenceError: indexedDB is not defined`.
//
// The stub deliberately never settles the request. No test exercises offline
// persistence, and a connection that never opens leaves the service inert
// rather than faking a working database; a test that does need IndexedDB
// should install `fake-indexeddb` and mock it locally, the way
// `utils/__tests__/secureCredentials.test.ts` already mocks `indexedDB`.
const pendingRequest = () => ({
  onerror: null,
  onsuccess: null,
  onupgradeneeded: null,
  onblocked: null,
  result: undefined,
  error: null,
});

global.indexedDB = {
  open: pendingRequest,
  deleteDatabase: pendingRequest,
  databases: async () => [],
  cmp: () => 0,
} as unknown as IDBFactory;

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock TextEncoder/TextDecoder for tests
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = jest.requireActual('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
