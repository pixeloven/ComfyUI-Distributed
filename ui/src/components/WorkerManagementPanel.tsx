import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { createApiClient } from '@/services/apiClient';
import { WorkerCard } from './WorkerCard';
import { MasterCard } from './MasterCard';
import { UI_COLORS } from '@/utils/constants';

const apiClient = createApiClient(window.location.origin);

export function WorkerManagementPanel() {
  const {
    workers,
    master,
    setConfig,
    setMaster,
    addWorker,
    updateWorker,
    removeWorker,
    updateMaster,
    setWorkerStatus,
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
    const interval = setInterval(checkStatuses, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadConfiguration = async () => {
    try {
      const configResponse = await apiClient.getConfig();

      // Convert to our Config type
      const config = {
        master: configResponse.master,
        workers: configResponse.workers ? Object.values(configResponse.workers) : []
      };
      setConfig(config);

      // Load master node
      if (config.master) {
        setMaster({
          id: 'master',
          name: config.master.name || 'Master',
          cuda_device: config.master.cuda_device,
          port: parseInt(window.location.port) || 8188,
          status: 'online'
        });
      }

      // Load workers
      if (config.workers) {
        config.workers.forEach((worker: any) => {
          addWorker({
            id: worker.id || `${worker.host}:${worker.port}`,
            name: worker.name || `Worker ${worker.port}`,
            host: worker.host || 'localhost',
            port: worker.port || 8189,
            enabled: worker.enabled !== false,
            cuda_device: worker.cuda_device,
            type: worker.type || (worker.host === 'localhost' ? 'local' : 'remote'),
            connection: worker.connection,
            status: worker.enabled ? 'offline' : 'disabled'
          });
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setIsLoading(false);
    }
  };

  const checkStatuses = async () => {
    // Check worker statuses
    for (const worker of workers) {
      if (worker.enabled) {
        try {
          const url = worker.connection || `http://${worker.host}:${worker.port}`;
          await apiClient.checkStatus(`${url}/system_stats`);
          setWorkerStatus(worker.id, 'online');
        } catch (error) {
          setWorkerStatus(worker.id, 'offline');
        }
      }
    }
  };

  const handleToggleWorker = (workerId: string, enabled: boolean) => {
    updateWorker(workerId, {
      enabled,
      status: enabled ? 'offline' : 'disabled'
    });
  };

  const handleStartWorker = async (workerId: string) => {
    try {
      setWorkerStatus(workerId, 'processing');
      await apiClient.launchWorker(workerId);
      // Status will be updated by the periodic check
    } catch (error) {
      console.error('Failed to start worker:', error);
      setWorkerStatus(workerId, 'offline');
    }
  };

  const handleStopWorker = async (workerId: string) => {
    try {
      await apiClient.stopWorker(workerId);
      setWorkerStatus(workerId, 'offline');
    } catch (error) {
      console.error('Failed to stop worker:', error);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    try {
      await apiClient.deleteWorker(workerId);
      removeWorker(workerId);
    } catch (error) {
      console.error('Failed to delete worker:', error);
    }
  };

  const handleSaveWorkerSettings = async (workerId: string, settings: any) => {
    try {
      await apiClient.updateWorker(workerId, settings);
      updateWorker(workerId, settings);
    } catch (error) {
      console.error('Failed to save worker settings:', error);
    }
  };

  const handleSaveMasterSettings = async (settings: any) => {
    try {
      await apiClient.updateMaster(settings);
      updateMaster(settings);
    } catch (error) {
      console.error('Failed to save master settings:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 100px)',
        color: UI_COLORS.MUTED_TEXT
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ color: UI_COLORS.MUTED_TEXT }}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="40 40"/>
        </svg>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100% - 32px)'
    }}>
      {/* Main container */}
      <div style={{
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Master Node Section */}
        {master && (
          <MasterCard
            master={master}
            onSaveSettings={handleSaveMasterSettings}
          />
        )}

        {/* Workers Section */}
        <div style={{
          flex: '1',
          overflowY: 'auto',
          marginBottom: '15px'
        }}>
          {workers.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: UI_COLORS.MUTED_TEXT,
              border: `2px dashed ${UI_COLORS.BORDER_LIGHT}`,
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              + Click here to add your first worker
            </div>
          ) : (
            workers.map(worker => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onToggle={handleToggleWorker}
                onStart={handleStartWorker}
                onStop={handleStopWorker}
                onDelete={handleDeleteWorker}
                onSaveSettings={handleSaveWorkerSettings}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}