import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { createApiClient } from '@/services/apiClient';
import { WorkerManagementPanel } from '@/components/WorkerManagementPanel';
import { ConnectionInput } from '@/components/ConnectionInput';
import { ExecutionPanel } from '@/components/ExecutionPanel';

// Initialize API client
const apiClient = createApiClient(window.location.origin);

function App() {
  const { setConfig, setConnectionState } = useAppStore();

  useEffect(() => {
    // Initialize the app
    const initializeApp = async () => {
      try {
        // Load configuration
        const config = await apiClient.getConfig();
        setConfig(config);

        // Set initial connection state
        setConnectionState({
          isConnected: true,
          masterIP: window.location.hostname
        });
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setConnectionState({
          isConnected: false,
          connectionError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    initializeApp();
  }, [setConfig, setConnectionState]);

  return (
    <div className="distributed-ui">
      <ConnectionInput />
      <ExecutionPanel />
      <WorkerManagementPanel />
    </div>
  );
}

export default App;