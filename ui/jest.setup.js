// Import jest-dom additions
require('@testing-library/jest-dom')

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
)

// Mock window.app for ComfyUI integration testing
global.window.app = {
  graph: {
    _nodes: []
  },
  api: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  canvas: {
    centerOnNode: jest.fn()
  }
}
