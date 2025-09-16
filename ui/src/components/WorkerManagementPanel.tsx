import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { createApiClient } from '@/services/apiClient';
import { WorkerCard } from './WorkerCard';

const apiClient = createApiClient(window.location.origin);

export function WorkerManagementPanel() {
  const { workers, addWorker, updateWorker, setWorkerStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(checkWorkerStatuses, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadWorkers = async () => {
    try {
      const config = await apiClient.getConfig();
      const managedWorkers = await apiClient.getManagedWorkers();

      // Load workers from config
      if (config.workers) {
        Object.entries(config.workers).forEach(([id, workerData]: [string, any]) => {
          const managedWorker = managedWorkers.managed_workers?.find(w => w.worker_id === id);

          addWorker({
            id,
            address: workerData.address || 'localhost',
            port: workerData.port || parseInt(id.split(':')[1]) || 8189,
            status: managedWorker ? 'offline' : 'disabled',
            isSelected: workerData.enabled || false,
            isLocal: workerData.address === 'localhost' || !workerData.address,
            processId: managedWorker?.pid,
            config: {
              autoLaunch: workerData.auto_launch || false,
              enableCors: workerData.enable_cors || false,
              additionalArgs: workerData.additional_args || '',
              customModel: workerData.custom_model
            }
          });
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load workers:', error);
      setIsLoading(false);
    }
  };

  const checkWorkerStatuses = async () => {
    const statusPromises = workers.map(worker =>
      apiClient.checkStatus(`http://${worker.address}:${worker.port}/system_stats`)
        .then(() => 'online' as const)
        .catch(() => 'offline' as const)
    );

    const statuses = await Promise.allSettled(statusPromises);

    statuses.forEach((result, index) => {
      const worker = workers[index];
      if (worker && result.status === 'fulfilled') {
        setWorkerStatus(worker.id, result.value);
      }
    });
  };

  const handleLaunchWorker = async (workerId: string) => {
    try {
      updateWorker(workerId, { status: 'processing' });
      await apiClient.launchWorker(workerId);
      // Status will be updated by the periodic check
    } catch (error) {
      console.error('Failed to launch worker:', error);
      updateWorker(workerId, { status: 'offline' });
    }
  };

  const handleStopWorker = async (workerId: string) => {
    try {
      await apiClient.stopWorker(workerId);
      updateWorker(workerId, { status: 'offline' });
    } catch (error) {
      console.error('Failed to stop worker:', error);
    }
  };

  const handleToggleWorker = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      updateWorker(workerId, {
        isSelected: !worker.isSelected,
        status: !worker.isSelected ? 'offline' : 'disabled'
      });
    }
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading workers...</div>;
  }

  return (
    <div style={{ padding: '12px' }}>
      <h3 style={{ marginBottom: '16px', color: '#fff' }}>Worker Management</h3>

      {workers.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#888',
          border: '1px dashed #444',
          borderRadius: '6px'
        }}>
          No workers configured. Add workers in the configuration file.
        </div>
      ) : (
        workers.map(worker => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            onLaunch={() => handleLaunchWorker(worker.id)}
            onStop={() => handleStopWorker(worker.id)}
            onToggle={() => handleToggleWorker(worker.id)}
          />
        ))
      )}
    </div>
  );
}