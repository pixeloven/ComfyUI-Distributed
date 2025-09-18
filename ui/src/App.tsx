import { useEffect } from 'react'

import { WorkerManagementPanel } from '@/components/WorkerManagementPanel'
import { createApiClient } from '@/services/apiClient'
import { useAppStore } from '@/stores/appStore'

// Initialize API client
const apiClient = createApiClient(window.location.origin)

function App() {
  const { setConfig, setConnectionState } = useAppStore()

  useEffect(() => {
    // Initialize the app
    const initializeApp = async () => {
      try {
        // Load configuration - convert to our Config type
        const configResponse = await apiClient.getConfig()
        const config = {
          master: configResponse.master,
          workers: configResponse.workers
            ? Object.values(configResponse.workers)
            : []
        }
        setConfig(config)

        // Set initial connection state
        setConnectionState({
          isConnected: true,
          masterIP: window.location.hostname
        })
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setConnectionState({
          isConnected: false,
          connectionError:
            error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    void initializeApp()
  }, [setConfig, setConnectionState])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar header to match ComfyUI style */}
      <div
        className="p-toolbar p-component border-x-0 border-t-0 rounded-none px-2 py-1 min-h-8"
        style={{
          borderBottom: '1px solid #444',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          className="p-toolbar-start"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <span
            className="text-xs 2xl:text-sm truncate"
            style={{ color: '#fff' }}
            title="ComfyUI Distributed"
          >
            COMFYUI DISTRIBUTED
          </span>
        </div>
        <div className="p-toolbar-center"></div>
        <div className="p-toolbar-end"></div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <WorkerManagementPanel />
      </div>
    </div>
  )
}

export default App
