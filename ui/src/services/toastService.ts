/**
 * Toast Notification Service for ComfyUI-Distributed
 *
 * Integrates with ComfyUI's built-in toast notification system
 */

export type ToastSeverity = 'success' | 'error' | 'warn' | 'info';

interface ToastOptions {
  severity: ToastSeverity;
  summary: string;
  detail: string;
  life?: number; // Duration in milliseconds
}

export class ToastService {
  private static instance: ToastService;

  private constructor() {}

  public static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  /**
   * Show a toast notification using ComfyUI's built-in system
   */
  public show(options: ToastOptions): void {
    try {
      const app = (window as any).app;
      if (app?.extensionManager?.toast) {
        app.extensionManager.toast.add({
          severity: options.severity,
          summary: options.summary,
          detail: options.detail,
          life: options.life || 3000,
        });
      } else {
        // Fallback to console logging if toast system is not available
        console.log(`[${options.severity.toUpperCase()}] ${options.summary}: ${options.detail}`);
      }
    } catch (error) {
      console.error('Failed to show toast notification:', error);
      console.log(`[${options.severity.toUpperCase()}] ${options.summary}: ${options.detail}`);
    }
  }

  /**
   * Show a success notification
   */
  public success(summary: string, detail: string, life?: number): void {
    this.show({
      severity: 'success',
      summary,
      detail,
      life,
    });
  }

  /**
   * Show an error notification
   */
  public error(summary: string, detail: string, life?: number): void {
    this.show({
      severity: 'error',
      summary,
      detail,
      life: life || 5000, // Errors shown longer by default
    });
  }

  /**
   * Show a warning notification
   */
  public warn(summary: string, detail: string, life?: number): void {
    this.show({
      severity: 'warn',
      summary,
      detail,
      life,
    });
  }

  /**
   * Show an info notification
   */
  public info(summary: string, detail: string, life?: number): void {
    this.show({
      severity: 'info',
      summary,
      detail,
      life,
    });
  }

  /**
   * Show worker operation result notifications
   */
  public workerOperationResult(
    operationName: string,
    successCount: number,
    totalCount: number,
    failures: string[] = []
  ): void {
    if (failures.length === 0) {
      this.success(
        `${operationName} Completed`,
        `Successfully completed on all ${successCount} worker(s)`,
        3000
      );
    } else if (successCount > 0) {
      this.warn(
        `${operationName} Partial Success`,
        `Completed on ${successCount}/${totalCount} worker(s). Failed: ${failures.join(', ')}`,
        5000
      );
    } else {
      this.error(
        `${operationName} Failed`,
        `Failed on all worker(s): ${failures.join(', ')}`,
        5000
      );
    }
  }

  /**
   * Show connection test result notification
   */
  public connectionTestResult(workerName: string, success: boolean, message: string): void {
    if (success) {
      this.success('Connection Test', `${workerName}: ${message}`, 3000);
    } else {
      this.error('Connection Test Failed', `${workerName}: ${message}`, 5000);
    }
  }

  /**
   * Show worker action notifications (start, stop, delete)
   */
  public workerAction(
    action: string,
    workerName: string,
    success: boolean,
    message?: string
  ): void {
    const actionPast =
      {
        start: 'started',
        stop: 'stopped',
        delete: 'deleted',
        launch: 'launched',
      }[action] || action;

    if (success) {
      this.success(
        `Worker ${actionPast.charAt(0).toUpperCase() + actionPast.slice(1)}`,
        `${workerName} has been ${actionPast}`,
        3000
      );
    } else {
      this.error(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
        `Failed to ${action} ${workerName}${message ? `: ${message}` : ''}`,
        5000
      );
    }
  }

  /**
   * Show validation error notifications
   */
  public validationError(field: string, message: string): void {
    this.error('Validation Error', `${field}: ${message}`, 3000);
  }

  /**
   * Show distributed execution notifications
   */
  public distributedExecution(
    type: 'offline_workers' | 'master_unreachable' | 'execution_failed',
    details: string
  ): void {
    switch (type) {
      case 'offline_workers':
        this.error('All Workers Offline', details, 5000);
        break;
      case 'master_unreachable':
        this.error('Master Unreachable', details, 5000);
        break;
      case 'execution_failed':
        this.error('Execution Failed', details, 5000);
        break;
    }
  }
}
