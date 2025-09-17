// Re-export everything from worker.ts to maintain compatibility
export type {
  DistributedWorker as Worker,
  DistributedWorker,
  MasterNode,
  Config,
  ExecutionState,
  ConnectionState,
  AppState,
  ApiResponse,
  StatusDotProps,
} from './worker';

export { WorkerStatus } from './worker';

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
