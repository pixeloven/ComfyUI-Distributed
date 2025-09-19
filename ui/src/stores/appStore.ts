import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import type {
  AppState,
  Config,
  ConnectionState,
  DistributedWorker,
  ExecutionState,
  MasterNode,
  WorkerStatus
} from '@/types/worker'

interface AppStore extends AppState {
  // Worker management
  setWorkers: (workers: DistributedWorker[]) => void
  addWorker: (worker: DistributedWorker) => void
  updateWorker: (id: string, updates: Partial<DistributedWorker>) => void
  removeWorker: (id: string) => void
  setWorkerStatus: (id: string, status: WorkerStatus) => void
  toggleWorker: (id: string) => void
  getEnabledWorkers: () => DistributedWorker[]

  // Master management
  setMaster: (master: MasterNode) => void
  updateMaster: (updates: Partial<MasterNode>) => void

  // Execution state
  setExecutionState: (state: Partial<ExecutionState>) => void
  startExecution: () => void
  stopExecution: () => void
  updateProgress: (completed: number, total: number) => void
  addExecutionError: (error: string) => void
  clearExecutionErrors: () => void

  // Connection state
  setConnectionState: (state: Partial<ConnectionState>) => void
  setMasterIP: (ip: string) => void
  setConnectionStatus: (isConnected: boolean) => void

  // Config management
  setConfig: (config: Config) => void
  isDebugEnabled: () => boolean

  // Logs
  addLog: (log: string) => void
  clearLogs: () => void
}

const initialExecutionState: ExecutionState = {
  isExecuting: false,
  totalBatches: 0,
  completedBatches: 0,
  currentBatch: 0,
  progress: 0,
  errors: []
}

const initialConnectionState: ConnectionState = {
  isConnected: false,
  masterIP: '',
  isValidatingConnection: false
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    workers: [],
    master: undefined,
    executionState: initialExecutionState,
    connectionState: initialConnectionState,
    config: null,
    logs: [],

    // Worker management actions
    setWorkers: (workers: DistributedWorker[]) => set({ workers }),

    addWorker: (worker: DistributedWorker) =>
      set((state: AppState) => ({
        workers: [...state.workers, worker]
      })),

    updateWorker: (id: string, updates: Partial<DistributedWorker>) =>
      set((state: AppState) => ({
        workers: state.workers.map((worker: DistributedWorker) =>
          worker.id === id ? { ...worker, ...updates } : worker
        )
      })),

    removeWorker: (id: string) =>
      set((state: AppState) => ({
        workers: state.workers.filter((worker: DistributedWorker) => worker.id !== id)
      })),

    setWorkerStatus: (id: string, status: WorkerStatus) => get().updateWorker(id, { status }),

    toggleWorker: (id: string) =>
      set((state: AppState) => ({
        workers: state.workers.map((worker: DistributedWorker) =>
          worker.id === id ? { ...worker, enabled: !worker.enabled } : worker
        )
      })),

    getEnabledWorkers: () => get().workers.filter((worker: DistributedWorker) => worker.enabled),

    // Master management actions
    setMaster: (master: MasterNode) => set({ master }),

    updateMaster: (updates: Partial<MasterNode>) =>
      set((state: AppState) => ({
        master: state.master ? { ...state.master, ...updates } : undefined
      })),

    // Execution state actions
    setExecutionState: (executionState: Partial<ExecutionState>) =>
      set((state: AppState) => ({
        executionState: { ...state.executionState, ...executionState }
      })),

    startExecution: () =>
      set((state: AppState) => ({
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
      set((state: AppState) => ({
        executionState: {
          ...state.executionState,
          isExecuting: false
        }
      })),

    updateProgress: (completed: number, total: number) =>
      set((state: AppState) => ({
        executionState: {
          ...state.executionState,
          completedBatches: completed,
          totalBatches: total,
          progress: total > 0 ? (completed / total) * 100 : 0
        }
      })),

    addExecutionError: (error: string) =>
      set((state: AppState) => ({
        executionState: {
          ...state.executionState,
          errors: [...state.executionState.errors, error]
        }
      })),

    clearExecutionErrors: () =>
      set((state: AppState) => ({
        executionState: {
          ...state.executionState,
          errors: []
        }
      })),

    // Connection state actions
    setConnectionState: (connectionState: Partial<ConnectionState>) =>
      set((state: AppState) => ({
        connectionState: { ...state.connectionState, ...connectionState }
      })),

    setMasterIP: (masterIP: string) =>
      set((state: AppState) => ({
        connectionState: { ...state.connectionState, masterIP }
      })),

    setConnectionStatus: (isConnected: boolean) =>
      set((state: AppState) => ({
        connectionState: { ...state.connectionState, isConnected }
      })),

    // Config management
    setConfig: (config: Config) => set({ config }),
    isDebugEnabled: () => get().config?.settings?.debug ?? false,

    // Logs
    addLog: (log: string) =>
      set((state: AppState) => ({
        logs: [...state.logs, log]
      })),

    clearLogs: () => set({ logs: [] })
  }))
)
