import ReactDOM from 'react-dom/client';
import App from './App';
import { PULSE_ANIMATION_CSS } from '@/utils/constants';
import '@/locales';

// Declare global ComfyUI types
declare global {
    interface Window {
        app: any;
    }
}

// ComfyUI extension to integrate React app
class DistributedReactExtension {
    private reactRoot: any = null;
    private app: any = null;

    constructor() {
        this.initializeApp();
    }

    async initializeApp() {
        // Wait for ComfyUI app to be available
        while (!window.app) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.app = window.app;
        this.injectStyles();
        this.registerSidebarTab();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = PULSE_ANIMATION_CSS;
        document.head.appendChild(style);
    }

    registerSidebarTab() {
        this.app.extensionManager.registerSidebarTab({
            id: "distributed",
            icon: "pi pi-server",
            title: "Distributed",
            tooltip: "Distributed Control Panel",
            type: "custom",
            render: (el: HTMLElement) => {
                this.mountReactApp(el);
                return el;
            },
            destroy: () => {
                this.unmountReactApp();
            }
        });
    }

    mountReactApp(container: HTMLElement) {
        // Clear any existing content
        container.innerHTML = '';

        // Create container for React app
        const reactContainer = document.createElement('div');
        reactContainer.id = 'distributed-ui-root';
        reactContainer.style.width = '100%';
        reactContainer.style.height = '100%';
        container.appendChild(reactContainer);

        try {
            // Mount the React app
            this.reactRoot = ReactDOM.createRoot(reactContainer);
            this.reactRoot.render(<App />);
            console.log('Distributed React UI mounted successfully');
        } catch (error) {
            console.error('Failed to mount Distributed React UI:', error);
            container.innerHTML = '<div style="color: red; padding: 10px;">Failed to load Distributed React UI</div>';
        }
    }

    unmountReactApp() {
        // Clean up when tab is destroyed
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }
    }
}

// Initialize the extension
new DistributedReactExtension();