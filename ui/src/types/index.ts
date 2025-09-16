export interface Worker {
  id: string;
  address: string;
  port: number;
  status: 'online' | 'offline' | 'processing' | 'disabled';
  isSelected: boolean;
  isLocal: boolean;
  gpuId?: number;
  processId?: number;
  config?: WorkerConfig;
}

export interface WorkerConfig {
  autoLaunch: boolean;
  enableCors: boolean;
  additionalArgs: string;
  customModel?: string;
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
  workers: Worker[];
  executionState: ExecutionState;
  connectionState: ConnectionState;
  config: any;
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