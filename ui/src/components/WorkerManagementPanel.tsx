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
    console.log('[React] WorkerManagementPanel useEffect running');
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (workers.length > 0) {
      console.log('[React] Starting status check interval');
      const interval = setInterval(checkStatuses, 2000);
      return () => clearInterval(interval);
    }
  }, [workers]);

  const loadConfiguration = async () => {
    console.log('[React] Loading configuration...');
    try {
      const configResponse = await apiClient.getConfig();
      console.log('[React] Config response:', configResponse);

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

      console.log('[React] Configuration loaded successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('[React] Failed to load configuration:', error);
      setIsLoading(false);
    }
  };

  const getWorkerUrl = (worker: any, endpoint = '') => {
    const host = worker.host || window.location.hostname;

    // Cloud workers always use HTTPS
    const isCloud = worker.type === 'cloud';

    // Detect if we're running on Runpod (for local workers on Runpod infrastructure)
    const isRunpodProxy = host.endsWith('.proxy.runpod.net');

    // For local workers on Runpod, construct the port-specific proxy URL
    let finalHost = host;
    if (!worker.host && isRunpodProxy) {
      const match = host.match(/^(.*)\.proxy\.runpod\.net$/);
      if (match) {
        const podId = match[1];
        const domain = 'proxy.runpod.net';
        finalHost = `${podId}-${worker.port}.${domain}`;
      } else {
        console.error(`Failed to parse Runpod proxy host: ${host}`);
      }
    }

    // If worker has a connection string, use it directly
    if (worker.connection) {
      // Check if connection already has protocol
      if (worker.connection.startsWith('http://') || worker.connection.startsWith('https://')) {
        return worker.connection + endpoint;
      } else {
        // Add protocol based on worker type and port
        const useHttps = isCloud || isRunpodProxy || worker.port === 443;
        const protocol = useHttps ? 'https' : 'http';
        return `${protocol}://${worker.connection}${endpoint}`;
      }
    }

    // Determine protocol: HTTPS for cloud, Runpod proxies, or port 443
    const useHttps = isCloud || isRunpodProxy || worker.port === 443;
    const protocol = useHttps ? 'https' : 'http';

    // Only add port if non-standard
    const defaultPort = useHttps ? 443 : 80;
    const needsPort = !isRunpodProxy && worker.port !== defaultPort;
    const portStr = needsPort ? `:${worker.port}` : '';

    return `${protocol}://${finalHost}${portStr}${endpoint}`;
  };

  const checkStatuses = async () => {
    console.log(`[React] checkStatuses running with ${workers.length} workers`);
    // Check worker statuses
    for (const worker of workers) {
      if (worker.enabled) {
        try {
          // Use /prompt endpoint like legacy UI
          const url = getWorkerUrl(worker, '/prompt');
          console.log(`[React] Checking status for ${worker.name} at: ${url}`);

          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            signal: AbortSignal.timeout(1200) // Match legacy timeout
          });

          if (response.ok) {
            const data = await response.json();
            const queueRemaining = data.exec_info?.queue_remaining || 0;
            const isProcessing = queueRemaining > 0;

            console.log(`[React] ${worker.name} status OK - queue: ${queueRemaining}, processing: ${isProcessing}`);
            setWorkerStatus(worker.id, isProcessing ? 'processing' : 'online');
          } else {
            console.log(`[React] ${worker.name} status failed - HTTP ${response.status}`);
            setWorkerStatus(worker.id, 'offline');
          }
        } catch (error) {
          console.log(`[React] ${worker.name} status error:`, error instanceof Error ? error.message : String(error));
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
        const url = getWorkerUrl(worker, endpoint);

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