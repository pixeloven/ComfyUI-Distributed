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
  workers?: Worker[];
}

export type WorkerStatus = 'online' | 'offline' | 'processing' | 'disabled';

export interface StatusDotProps {
  status: WorkerStatus;
  isPulsing?: boolean;
  size?: number;
}