import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { createApiClient } from '@/services/apiClient';
import { ToastService } from '@/services/toastService';
import { WorkerCard } from './WorkerCard';
import { MasterCard } from './MasterCard';
import { SettingsPanel } from './SettingsPanel';
import { UI_COLORS } from '@/utils/constants';
import type { Worker } from '@/types';

const apiClient = createApiClient(window.location.origin);
const toastService = ToastService.getInstance();

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
  const [interruptLoading, setInterruptLoading] = useState(false);
  const [clearMemoryLoading, setClearMemoryLoading] = useState(false);

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

  const performWorkerOperation = async (
    endpoint: string,
    setLoading: (loading: boolean) => void,
    operationName: string
  ) => {
    const enabledWorkers = workers.filter(worker => worker.enabled);

    if (enabledWorkers.length === 0) {
      toastService.warn('No Workers', 'No enabled workers available for this operation');
      return;
    }

    setLoading(true);

    const results = await Promise.allSettled(
      enabledWorkers.map(async (worker) => {
        const workerUrl = worker.connection || `http://${worker.host}:${worker.port}`;
        const url = `${workerUrl}${endpoint}`;

        try {
          const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          console.log(`${operationName} successful on worker ${worker.name}`);
          return { worker, success: true };
        } catch (error) {
          console.error(`${operationName} failed on worker ${worker.name}:`, error);
          return { worker, success: false, error };
        }
      })
    );

    const failures = results
      .filter(result => result.status === 'rejected' || !result.value.success)
      .map(result => result.status === 'fulfilled' ? result.value.worker.name : 'Unknown worker');

    const successCount = enabledWorkers.length - failures.length;

    toastService.workerOperationResult(
      operationName,
      successCount,
      enabledWorkers.length,
      failures
    );

    setLoading(false);
  };

  const handleInterruptWorkers = () => {
    performWorkerOperation(
      '/interrupt',
      setInterruptLoading,
      'Interrupt operation'
    );
  };

  const handleClearMemory = () => {
    performWorkerOperation(
      '/distributed/clear_memory',
      setClearMemoryLoading,
      'Clear memory operation'
    );
  };

  const handleAddWorker = async () => {
    try {
      // Auto-generate worker settings like legacy UI
      const workerCount = workers.length;
      const masterPort = master?.port || 8188;
      const newPort = masterPort + 1 + workerCount;

      // Generate unique worker ID
      const workerId = `localhost:${newPort}`;

      // Create new worker with auto-generated settings (matching legacy behavior)
      const newWorker: Worker = {
        id: workerId,
        name: `Worker ${workerCount + 1}`,
        host: 'localhost',
        port: newPort,
        enabled: false, // Start disabled like legacy
        type: 'local',
        connection: `localhost:${newPort}`,
        status: 'offline',
        cuda_device: undefined, // Auto-detect like legacy
        extra_args: '--listen'
      };

      // Create worker data for API
      const workerData = {
        id: workerId,
        name: newWorker.name,
        connection: newWorker.connection,
        host: newWorker.host,
        port: newWorker.port,
        type: newWorker.type,
        enabled: newWorker.enabled,
        cuda_device: newWorker.cuda_device,
        extra_args: newWorker.extra_args
      };

      // Add to backend
      await apiClient.updateWorker(workerId, workerData);

      // Add to local state
      addWorker(newWorker);

      toastService.success(
        'Worker Added',
        `${newWorker.name} has been created`
      );

    } catch (error) {
      console.error('Failed to add worker:', error);
      toastService.error(
        'Failed to Add Worker',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
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
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: UI_COLORS.MUTED_TEXT,
                border: `2px dashed ${UI_COLORS.BORDER_LIGHT}`,
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={handleAddWorker}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#007acc';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = UI_COLORS.BORDER_LIGHT;
                e.currentTarget.style.color = UI_COLORS.MUTED_TEXT;
              }}
            >
              + Click here to add your first worker
            </div>
          ) : (
            <>
              {workers.map(worker => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onToggle={handleToggleWorker}
                  onStart={handleStartWorker}
                  onStop={handleStopWorker}
                  onDelete={handleDeleteWorker}
                  onSaveSettings={handleSaveWorkerSettings}
                />
              ))}

              {/* Add Worker Button */}
              <div
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: UI_COLORS.MUTED_TEXT,
                  border: `1px dashed ${UI_COLORS.BORDER_LIGHT}`,
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  cursor: 'pointer',
                  marginTop: '8px',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleAddWorker}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#007acc';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.background = 'rgba(0, 122, 204, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = UI_COLORS.BORDER_LIGHT;
                  e.currentTarget.style.color = UI_COLORS.MUTED_TEXT;
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                }}
              >
                + Add New Worker
              </div>
            </>
          )}
        </div>

        {/* Actions Section */}
        <div style={{
          paddingTop: '10px',
          marginBottom: '15px',
          borderTop: '1px solid #444'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                flex: 1,
                padding: '6px 14px',
                backgroundColor: '#555',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onClick={handleClearMemory}
              disabled={clearMemoryLoading || workers.filter(w => w.enabled).length === 0}
              title="Clear VRAM on all enabled worker GPUs (not master)"
              className="distributed-button"
            >
              {clearMemoryLoading ? 'Clearing...' : 'Clear Worker VRAM'}
            </button>

            <button
              style={{
                flex: 1,
                padding: '6px 14px',
                backgroundColor: '#555',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onClick={handleInterruptWorkers}
              disabled={interruptLoading || workers.filter(w => w.enabled).length === 0}
              title="Cancel/interrupt execution on all enabled worker GPUs"
              className="distributed-button"
            >
              {interruptLoading ? 'Interrupting...' : 'Interrupt Workers'}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <SettingsPanel />
      </div>

    </div>
  );
}