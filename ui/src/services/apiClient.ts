import { TIMEOUTS } from '@/utils/constants';
import type { ApiResponse } from '@/types';

interface RequestOptions extends RequestInit {
  timeout?: number;
}

interface StatusResponse {
  status: string;
  workers?: Array<{
    id: string;
    status: 'online' | 'offline' | 'processing';
    address: string;
    port: number;
  }>;
}

interface ConfigResponse {
  workers: Record<string, any>;
  master: any;
  settings: any;
}

interface ManagedWorkersResponse {
  managed_workers: Array<{
    worker_id: string;
    pid: number;
    status: string;
    address: string;
    port: number;
    gpu_id?: number;
  }>;
}

interface NetworkInfoResponse {
  interfaces: Array<{
    name: string;
    ip: string;
    is_local: boolean;
  }>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {},
    retries: number = TIMEOUTS.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    let delay = TIMEOUTS.RETRY_DELAY;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = options.timeout || TIMEOUTS.DEFAULT_FETCH;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          ...options,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Request failed' }));
          throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.log(
          `API Error (attempt ${attempt + 1}/${retries}): ${endpoint} - ${lastError.message}`
        );
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
    throw lastError!;
  }

  // Config endpoints
  async getConfig(): Promise<ConfigResponse> {
    return this.request<ConfigResponse>('/distributed/config');
  }

  async updateWorker(workerId: string, data: any): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/config/update_worker', {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId, ...data }),
    });
  }

  async deleteWorker(workerId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/config/delete_worker', {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId }),
    });
  }

  async updateSetting(key: string, value: any): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/config/update_setting', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  }

  async updateMaster(data: any): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/config/update_master', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Worker management endpoints
  async launchWorker(workerId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/launch_worker', {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId }),
      timeout: TIMEOUTS.LAUNCH,
    });
  }

  async stopWorker(workerId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/stop_worker', {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId }),
    });
  }

  async getManagedWorkers(): Promise<ManagedWorkersResponse> {
    return this.request<ManagedWorkersResponse>('/distributed/managed_workers');
  }

  async getWorkerLog(workerId: string, lines: number = 1000): Promise<{ log: string }> {
    return this.request<{ log: string }>(`/distributed/worker_log/${workerId}?lines=${lines}`);
  }

  async clearLaunchingFlag(workerId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/worker/clear_launching', {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId }),
    });
  }

  // Job preparation
  async prepareJob(multiJobId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/distributed/prepare_job', {
      method: 'POST',
      body: JSON.stringify({ multi_job_id: multiJobId }),
    });
  }

  // Image loading
  async loadImage(imagePath: string): Promise<any> {
    return this.request('/distributed/load_image', {
      method: 'POST',
      body: JSON.stringify({ image_path: imagePath }),
    });
  }

  // Network info
  async getNetworkInfo(): Promise<NetworkInfoResponse> {
    return this.request<NetworkInfoResponse>('/distributed/network_info');
  }

  // Connection testing
  async validateConnection(
    connection: string,
    testConnectivity: boolean = true,
    timeout: number = 10
  ): Promise<any> {
    return this.request('/distributed/validate_connection', {
      method: 'POST',
      body: JSON.stringify({
        connection,
        test_connectivity: testConnectivity,
        timeout,
      }),
    });
  }

  // Status checking
  async checkStatus(url: string, timeout: number = TIMEOUTS.STATUS_CHECK): Promise<StatusResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Batch status checking
  async checkMultipleStatuses(urls: string[]): Promise<PromiseSettledResult<StatusResponse>[]> {
    return Promise.allSettled(urls.map(url => this.checkStatus(url)));
  }
}

export const createApiClient = (baseUrl: string) => new ApiClient(baseUrl);
