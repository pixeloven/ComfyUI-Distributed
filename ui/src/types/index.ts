export interface Worker {
  id: string;
  name: string;
  host: string;
  port: number;
  enabled: boolean;
  cuda_device?: number;
  type?: 'local' | 'remote' | 'cloud';
  connection?: string;
  status?: 'online' | 'offline' | 'processing' | 'disabled';
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
  workers?: Worker[];
}

export type WorkerStatus = 'online' | 'offline' | 'processing' | 'disabled';

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
  workers: Worker[];
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

export interface ComfyUIApp {
  queuePrompt: (number: number, ...args: any[]) => Promise<any>;
  ui: {
    settings: {
      addSetting: (setting: any) => void;
    };
  };
}

export interface ComfyUIApi {
  queuePrompt: (number: number, ...args: any[]) => Promise<any>;
}