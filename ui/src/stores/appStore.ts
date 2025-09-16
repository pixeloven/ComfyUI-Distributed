import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Worker, ExecutionState, ConnectionState, AppState } from '@/types';

interface AppStore extends AppState {
  // Worker management
  addWorker: (worker: Worker) => void;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  removeWorker: (id: string) => void;
  setWorkerStatus: (id: string, status: Worker['status']) => void;
  toggleWorkerSelection: (id: string) => void;
  getSelectedWorkers: () => Worker[];

  // Execution state
  setExecutionState: (state: Partial<ExecutionState>) => void;
  startExecution: () => void;
  stopExecution: () => void;
  updateProgress: (completed: number, total: number) => void;
  addExecutionError: (error: string) => void;
  clearExecutionErrors: () => void;

  // Connection state
  setConnectionState: (state: Partial<ConnectionState>) => void;
  setMasterIP: (ip: string) => void;
  setConnectionStatus: (isConnected: boolean) => void;

  // Config management
  setConfig: (config: any) => void;

  // Logs
  addLog: (log: string) => void;
  clearLogs: () => void;
}

const initialExecutionState: ExecutionState = {
  isExecuting: false,
  totalBatches: 0,
  completedBatches: 0,
  currentBatch: 0,
  progress: 0,
  errors: []
};

const initialConnectionState: ConnectionState = {
  isConnected: false,
  masterIP: '',
  isValidatingConnection: false
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    workers: [],
    executionState: initialExecutionState,
    connectionState: initialConnectionState,
    config: null,
    logs: [],

    // Worker management actions
    addWorker: (worker) =>
      set((state) => ({
        workers: [...state.workers, worker]
      })),

    updateWorker: (id, updates) =>
      set((state) => ({
        workers: state.workers.map(worker =>
          worker.id === id ? { ...worker, ...updates } : worker
        )
      })),

    removeWorker: (id) =>
      set((state) => ({
        workers: state.workers.filter(worker => worker.id !== id)
      })),

    setWorkerStatus: (id, status) =>
      get().updateWorker(id, { status }),

    toggleWorkerSelection: (id) =>
      set((state) => ({
        workers: state.workers.map(worker =>
          worker.id === id ? { ...worker, isSelected: !worker.isSelected } : worker
        )
      })),

    getSelectedWorkers: () =>
      get().workers.filter(worker => worker.isSelected),

    // Execution state actions
    setExecutionState: (executionState) =>
      set((state) => ({
        executionState: { ...state.executionState, ...executionState }
      })),

    startExecution: () =>
      set((state) => ({
        executionState: {
          ...state.executionState,
          isExecuting: true,
          completedBatches: 0,
          currentBatch: 0,
          progress: 0,
          errors: []
        }
      })),

    stopExecution: () =>
      set((state) => ({
        executionState: {
          ...state.executionState,
          isExecuting: false
        }
      })),

    updateProgress: (completed, total) =>
      set((state) => ({
        executionState: {
          ...state.executionState,
          completedBatches: completed,
          totalBatches: total,
          progress: total > 0 ? (completed / total) * 100 : 0
        }
      })),

    addExecutionError: (error) =>
      set((state) => ({
        executionState: {
          ...state.executionState,
          errors: [...state.executionState.errors, error]
        }
      })),

    clearExecutionErrors: () =>
      set((state) => ({
        executionState: {
          ...state.executionState,
          errors: []
        }
      })),

    // Connection state actions
    setConnectionState: (connectionState) =>
      set((state) => ({
        connectionState: { ...state.connectionState, ...connectionState }
      })),

    setMasterIP: (masterIP) =>
      set((state) => ({
        connectionState: { ...state.connectionState, masterIP }
      })),

    setConnectionStatus: (isConnected) =>
      set((state) => ({
        connectionState: { ...state.connectionState, isConnected }
      })),

    // Config management
    setConfig: (config) => set({ config }),

    // Logs
    addLog: (log) =>
      set((state) => ({
        logs: [...state.logs, log]
      })),

    clearLogs: () => set({ logs: [] })
  }))
);