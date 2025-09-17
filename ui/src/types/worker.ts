export enum WorkerStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  PROCESSING = 'processing',
  DISABLED = 'disabled',
}

export interface DistributedWorker {
  id: string;
  name: string;
  host: string;
  port: number;
  enabled: boolean;
  cuda_device?: number;
  type?: 'local' | 'remote' | 'cloud';
  connection?: string;
  status?: WorkerStatus;
  extra_args?: string;
}

export interface MasterNode {
  id: string;
  name: string;
  cuda_device?: number;
  port: number;
  status: 'online';
}

export interface Config {
  master?: MasterNode;
  workers?: DistributedWorker[];
  settings?: {
    debug?: boolean;
    auto_launch_workers?: boolean;
    stop_workers_on_master_exit?: boolean;
    worker_timeout_seconds?: number;
  };
}

export interface StatusDotProps {
  status: WorkerStatus;
  isPulsing?: boolean;
  size?: number;
}

export interface ExecutionState {
  isExecuting: boolean;
  totalBatches: number;
  completedBatches: number;
  currentBatch: number;
  progress: number;
  errors: string[];
}

export interface ConnectionState {
  isConnected: boolean;
  masterIP: string;
  isValidatingConnection: boolean;
  connectionError?: string;
}

export interface AppState {
  workers: DistributedWorker[];
  master?: MasterNode;
  executionState: ExecutionState;
  connectionState: ConnectionState;
  config: Config | null;
  logs: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
