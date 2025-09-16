// Mock canvas for testing
const mockCanvasContext = {
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(1920 * 1080 * 4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn()
};

// Make canvas available globally
(global as any).HTMLCanvasElement.prototype.getContext = function(contextType: string) {
  if (contextType === '2d') {
    return mockCanvasContext;
  }
  return null;
};

(global as any).HTMLCanvasElement.prototype.toBlob = function(callback: (blob: Blob | null) => void) {
  const blob = new Blob(['test'], { type: 'image/jpeg' });
  callback(blob);
};

(global as any).HTMLCanvasElement.prototype.toDataURL = function() {
  return 'data:image/jpeg;base64,test';
};