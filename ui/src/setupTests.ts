import '@testing-library/jest-dom'

// Global test setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    port: '8188',
    origin: 'http://localhost:8188',
    protocol: 'http:'
  },
  writable: true
})

// Mock fetch globally
global.fetch = jest.fn()
