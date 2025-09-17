import { ConnectionValidationResult } from '@/types/connection';

export class ConnectionService {
  private static instance: ConnectionService;

  static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService();
    }
    return ConnectionService.instance;
  }

  async validateConnection(
    connection: string,
    testConnectivity: boolean = false,
    timeout: number = 10
  ): Promise<ConnectionValidationResult> {
    try {
      const response = await fetch('/distributed/validate_connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection: connection.trim(),
          test_connectivity: testConnectivity,
          timeout,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ConnectionValidationResult = await response.json();
      return result;
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection validation failed',
      };
    }
  }

  /**
   * Parse a connection string and extract connection details
   */
  parseConnectionString(connection: string): {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    type: 'local' | 'remote' | 'cloud';
  } | null {
    if (!connection?.trim()) return null;

    const trimmed = connection.trim();

    // Handle full URLs (http://host:port or https://host:port)
    const urlMatch = trimmed.match(/^(https?):\/\/([^:/]+)(?::(\d+))?/);
    if (urlMatch) {
      const [, protocol, host, portStr] = urlMatch;
      const port = portStr ? parseInt(portStr) : protocol === 'https' ? 443 : 80;
      const type = this.getConnectionType(host, protocol as 'http' | 'https');

      return {
        host,
        port,
        protocol: protocol as 'http' | 'https',
        type,
      };
    }

    // Handle host:port format
    const hostPortMatch = trimmed.match(/^([^:]+):(\d+)$/);
    if (hostPortMatch) {
      const [, host, portStr] = hostPortMatch;
      const port = parseInt(portStr);
      const protocol = 'http'; // Default for host:port format
      const type = this.getConnectionType(host, protocol);

      return {
        host,
        port,
        protocol,
        type,
      };
    }

    return null;
  }

  private getConnectionType(
    host: string,
    protocol: 'http' | 'https'
  ): 'local' | 'remote' | 'cloud' {
    // Local hosts
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.')
    ) {
      return 'local';
    }

    // Cloud services (typically HTTPS with specific domains)
    if (
      protocol === 'https' &&
      (host.includes('.trycloudflare.com') ||
        host.includes('.ngrok.io') ||
        host.includes('.runpod.') ||
        host.includes('.vast.ai'))
    ) {
      return 'cloud';
    }

    // Everything else is remote
    return 'remote';
  }

  /**
   * Get default connection presets
   */
  getConnectionPresets() {
    return [
      { label: 'Local 8189', value: 'localhost:8189' },
      { label: 'Local 8190', value: 'localhost:8190' },
      { label: 'Local 8191', value: 'localhost:8191' },
      { label: 'Local 8192', value: 'localhost:8192' },
    ];
  }

  /**
   * Format validation result for display
   */
  formatValidationMessage(result: ConnectionValidationResult): {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } {
    if (result.status === 'error') {
      return {
        message: `✗ ${result.error}`,
        type: 'error',
      };
    }

    if (result.status === 'invalid') {
      return {
        message: `✗ Invalid connection: ${result.error}`,
        type: 'error',
      };
    }

    if (result.status === 'valid') {
      if (result.connectivity) {
        const conn = result.connectivity;
        if (conn.reachable) {
          const responseTime = conn.response_time ? ` (${conn.response_time}ms)` : '';
          const workerInfo = conn.worker_info?.device_name
            ? ` - ${conn.worker_info.device_name}`
            : '';
          return {
            message: `✓ Connection successful${responseTime}${workerInfo}`,
            type: 'success',
          };
        } else {
          return {
            message: `✗ Connection failed: ${conn.error}`,
            type: 'error',
          };
        }
      } else {
        // Just validation, no connectivity test
        const details = result.details;
        if (details) {
          return {
            message: `✓ Valid ${details.type} connection (${details.protocol}://${details.host}:${details.port})`,
            type: 'success',
          };
        }
        return {
          message: '✓ Valid connection format',
          type: 'success',
        };
      }
    }

    return {
      message: 'Unknown validation result',
      type: 'warning',
    };
  }
}
