import { render, screen, waitFor, act } from '@testing-library/react'

import App from '../../App'

// Mock the API client
jest.mock('../../services/apiClient', () => ({
  createApiClient: jest.fn(() => ({
    getConfig: jest.fn().mockResolvedValue({
      master: { name: 'Master', cuda_device: 0 },
      workers: {}
    })
  }))
}))

// Mock the app store
jest.mock('../../stores/appStore', () => ({
  useAppStore: jest.fn(() => ({
    workers: [],
    master: undefined,
    setConfig: jest.fn(),
    setConnectionState: jest.fn(),
    setMaster: jest.fn(),
    setWorkers: jest.fn(),
    addWorker: jest.fn(),
    updateWorker: jest.fn(),
    removeWorker: jest.fn(),
    updateMaster: jest.fn(),
    setWorkerStatus: jest.fn(),
    isDebugEnabled: jest.fn(() => false),
  }))
}))

describe('App Component', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
  })

  test('renders main components', async () => {
    await act(async () => {
      render(<App />)
    })

    // Wait for the async loading to complete and check for actual UI elements
    await waitFor(() => {
      expect(screen.getByText('+ Click here to add your first worker')).toBeInTheDocument()
    })

    expect(screen.getByText('COMFYUI DISTRIBUTED')).toBeInTheDocument()
    expect(screen.getByText('Clear Worker VRAM')).toBeInTheDocument()
    expect(screen.getByText('Interrupt Workers')).toBeInTheDocument()
  })

  test('renders with proper structure', () => {
    const { container } = render(<App />)

    // Check for the main container structure
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toBeInTheDocument()
    expect(mainContainer).toHaveStyle({
      height: '100%',
      display: 'flex',
      'flex-direction': 'column'
    })
  })
})
