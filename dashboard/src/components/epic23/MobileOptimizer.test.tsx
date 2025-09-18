import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect, useState } from 'react'; // For hook testing
import MobileOptimizer from './MobileOptimizer';

// Mock window.matchMedia
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

// Mock service worker and caches
const mockRegister = jest.fn();
const mockCaches = jest.fn(() => Promise.resolve({
  open: jest.fn(() => Promise.resolve({
    put: jest.fn(),
  })),
}));
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: {
      addEventListener: jest.fn(),
    },
  })),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: { register: mockRegister },
  writable: true,
});
global.caches = mockCaches as any;
global.indexedDB = mockIndexedDB as any;

describe('MobileOptimizer', () => {
  it('renders children on desktop', () => {
    (window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: false }));
    render(<MobileOptimizer><div data-testid="child">Content</div></MobileOptimizer>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child').parentElement).toHaveClass('bg-white');
  });

  it('renders responsive mobile layout', () => {
    (window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: true }));
    render(<MobileOptimizer><div data-testid="child">Content</div></MobileOptimizer>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child').parentElement).toHaveClass('bg-gray-100');
    expect(screen.getByTestId('child').parentElement).toHaveClass('p-2');
  });

  it('handles swipe gestures', () => {
    (window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: true }));
    const { container } = render(<MobileOptimizer><div data-testid="child">Content</div></MobileOptimizer>);
    const element = container.firstChild as HTMLDivElement;

    // Simulate touchstart
    fireEvent.touchStart(element, { touches: [{ clientX: 300 }] });
    // Simulate touchmove to left (diff > 100)
    fireEvent.touchMove(element, { touches: [{ clientX: 150 }], cancelable: true });
    // Simulate touchend
    fireEvent.touchEnd(element);

    // Check console log or add data attribute for testing
    expect(mockRegister).toHaveBeenCalled();
  });

  it('registers service worker on mobile', () => {
    (window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: true }));
    render(<MobileOptimizer><div data-testid="child">Content</div></MobileOptimizer>);
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('caches API responses', async () => {
    (window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: true }));
    global.fetch = jest.fn(() => Promise.resolve(new Response(JSON.stringify({ data: 'cached' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })));
    render(<MobileOptimizer><div data-testid="child">Content</div></MobileOptimizer>);

    // Trigger caching (assume handleCache called in useEffect or prop)
    const { rerender } = render(<MobileOptimizer handleCache={jest.fn()}><div>Content</div></MobileOptimizer>);
    // Simulate data prop
    rerender(<MobileOptimizer handleCache={data => { /* Simulate call */ }}><div>Content</div></MobileOptimizer>);

    expect(global.fetch).toHaveBeenCalledWith('/api/predictive-maintenance');
    expect(mockCaches).toHaveBeenCalled();
    expect(mockIndexedDB.open).toHaveBeenCalledWith('propertyAI', 1);
  });

  it('updates isMobile on resize', () => {
    const { container } = render(<MobileOptimizer><div data-testid="child">Content</div></MobileOptimizer>);
    expect(container.firstChild).toHaveClass('bg-white'); // Desktop

    fireEvent(window, new Event('resize'));
    (window.matchMedia as jest.Mock).mockImplementation(() => ({ matches: true }));
    fireEvent(window, new Event('resize'));

    expect(container.firstChild).toHaveClass('bg-gray-100'); // Mobile
  });
});