export interface ConnectionValidationResult {
  status: 'valid' | 'invalid' | 'error';
  details?: {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    type: 'local' | 'remote' | 'cloud';
  };
  connectivity?: {
    reachable: boolean;
    response_time?: number;
    worker_info?: {
      device_name: string;
      system_stats?: any;
    };
    error?: string;
  };
  error?: string;
}

export interface ConnectionPreset {
  label: string;
  value: string;
}

export type ConnectionInputState =
  | 'normal'
  | 'typing'
  | 'validating'
  | 'testing'
  | 'valid'
  | 'invalid'
  | 'error';

export type ValidationMessageType = 'success' | 'error' | 'warning' | 'info';

export interface ConnectionInputProps {
  value?: string;
  placeholder?: string;
  showPresets?: boolean;
  showTestButton?: boolean;
  validateOnInput?: boolean;
  debounceMs?: number;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onValidation?: (result: ConnectionValidationResult) => void;
  onConnectionTest?: (result: ConnectionValidationResult) => void;
}