import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import { PULSE_ANIMATION_CSS } from '@/utils/constants';

declare global {
  interface Window {
    app: any;
  }
}

export class ComfyUIDistributedExtension {
  private reactRoot: any = null;
  private statusCheckInterval: number | null = null;

  constructor() {
    this.injectStyles();
    this.loadConfig().then(() => {
      this.registerSidebarTab();
      this.setupInterceptor();
      this.loadManagedWorkers();
      this.detectMasterIP();
    });
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = PULSE_ANIMATION_CSS;
    document.head.appendChild(style);
  }

  private async loadConfig() {
    try {
      const response = await fetch('/distributed/config');
      await response.json();
    } catch (error) {
      console.error('Failed to load distributed config:', error);
    }
  }

  private registerSidebarTab() {
    if (!window.app?.extensionManager) {
      console.error('ComfyUI app not available');
      return;
    }

    window.app.extensionManager.registerSidebarTab({
      id: "distributed",
      icon: "pi pi-server",
      title: "Distributed",
      tooltip: "Distributed Control Panel",
      type: "custom",
      render: (el: HTMLElement) => {
        this.onPanelOpen();
        return this.renderReactApp(el);
      },
      destroy: () => {
        this.onPanelClose();
      }
    });
  }

  private renderReactApp(container: HTMLElement) {
    // Clear container
    container.innerHTML = '';

    // Create React root container
    const rootDiv = document.createElement('div');
    rootDiv.id = 'distributed-ui-root';
    rootDiv.style.width = '100%';
    rootDiv.style.height = '100%';
    container.appendChild(rootDiv);

    // Mount React app
    this.reactRoot = ReactDOM.createRoot(rootDiv);
    this.reactRoot.render(React.createElement(App));

    return container;
  }

  private onPanelOpen() {
    console.log('Distributed panel opened - starting status polling');
    this.startStatusChecking();
  }

  private onPanelClose() {
    console.log('Distributed panel closed - stopping status polling');
    this.stopStatusChecking();

    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }

  private startStatusChecking() {
    if (this.statusCheckInterval) return;

    this.statusCheckInterval = window.setInterval(() => {
      // Status checking will be handled by React components
    }, 2000);
  }

  private stopStatusChecking() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  private setupInterceptor() {
    // This would integrate with ComfyUI's queue system
    // For now, we'll just log that it's set up
    console.log('Distributed execution interceptor set up');
  }

  private async loadManagedWorkers() {
    try {
      const response = await fetch('/distributed/managed_workers');
      const data = await response.json();
      console.log('Loaded managed workers:', data);
    } catch (error) {
      console.error('Failed to load managed workers:', error);
    }
  }

  private async detectMasterIP() {
    try {
      const response = await fetch('/distributed/network_info');
      const data = await response.json();
      console.log('Network info:', data);
    } catch (error) {
      console.error('Failed to detect master IP:', error);
    }
  }
}

// Export component for direct React usage
export function ComfyUIIntegration() {
  const extensionRef = useRef<ComfyUIDistributedExtension | null>(null);

  useEffect(() => {
    // Initialize extension when component mounts
    if (!extensionRef.current) {
      extensionRef.current = new ComfyUIDistributedExtension();
    }

    return () => {
      // Cleanup on unmount
      if (extensionRef.current) {
        extensionRef.current = null;
      }
    };
  }, []);

  return null; // This component handles ComfyUI integration, no visual render
}