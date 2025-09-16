/**
 * Connection Input Component for ComfyUI-Distributed
 *
 * Provides a unified input field for worker connections with real-time validation,
 * preset buttons, and connection testing capabilities.
 */

import { UI_COLORS, BUTTON_STYLES } from './constants.js';

export class ConnectionInput {
    constructor(options = {}) {
        this.options = {
            placeholder: "e.g., localhost:8190, http://192.168.1.100:8191, https://worker.trycloudflare.com",
            showPresets: true,
            showTestButton: true,
            validateOnInput: true,
            debounceMs: 500,
            ...options
        };

        this.container = null;
        this.input = null;
        this.validationStatus = null;
        this.testButton = null;
        this.presetsContainer = null;
        this.statusIcon = null;

        this.validationTimeout = null;
        this.lastValidationResult = null;
        this.onValidation = options.onValidation || (() => {});
        this.onConnectionTest = options.onConnectionTest || (() => {});
        this.onChange = options.onChange || (() => {});

        this.isValidating = false;
        this.isTesting = false;
    }

    /**
     * Create and return the connection input component
     */
    create() {
        this.container = document.createElement('div');
        this.container.className = 'connection-input-container';
        this.container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 8px 0;
        `;

        // Create main input row
        const inputRow = this.createInputRow();
        this.container.appendChild(inputRow);

        // Create presets if enabled
        if (this.options.showPresets) {
            this.presetsContainer = this.createPresets();
            this.container.appendChild(this.presetsContainer);
        }

        // Create validation status
        this.validationStatus = this.createValidationStatus();
        this.container.appendChild(this.validationStatus);

        return this.container;
    }

    createInputRow() {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;

        // Status icon
        this.statusIcon = document.createElement('span');
        this.statusIcon.style.cssText = `
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: ${UI_COLORS.BORDER_LIGHT};
            flex-shrink: 0;
            transition: background-color 0.2s ease;
        `;

        // Main input field
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = this.options.placeholder;
        this.input.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            background: #333;
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            transition: border-color 0.2s ease;
        `;

        // Test connection button
        if (this.options.showTestButton) {
            this.testButton = document.createElement('button');
            this.testButton.textContent = 'Test';
            this.testButton.style.cssText = BUTTON_STYLES.base + BUTTON_STYLES.workerControl + `
                background-color: #4a7c4a;
                min-width: 60px;
                flex-shrink: 0;
            `;
            this.testButton.onclick = () => this.testConnection();
        }

        // Event listeners
        this.input.oninput = () => this.handleInput();
        this.input.onblur = () => this.handleBlur();
        this.input.onfocus = () => this.handleFocus();

        row.appendChild(this.statusIcon);
        row.appendChild(this.input);
        if (this.testButton) {
            row.appendChild(this.testButton);
        }

        return row;
    }

    createPresets() {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            align-items: center;
        `;

        const label = document.createElement('span');
        label.textContent = 'Quick:';
        label.style.cssText = `
            font-size: 11px;
            color: ${UI_COLORS.MUTED_TEXT};
            margin-right: 4px;
        `;

        const presets = [
            { label: 'Local 8189', value: 'localhost:8189' },
            { label: 'Local 8190', value: 'localhost:8190' },
            { label: 'Local 8191', value: 'localhost:8191' },
            { label: 'Local 8192', value: 'localhost:8192' }
        ];

        container.appendChild(label);

        presets.forEach(preset => {
            const button = document.createElement('button');
            button.textContent = preset.label;
            button.style.cssText = `
                padding: 2px 6px;
                font-size: 10px;
                background: transparent;
                color: ${UI_COLORS.ACCENT_COLOR};
                border: 1px solid ${UI_COLORS.BORDER_DARK};
                border-radius: 3px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            button.onmouseover = () => {
                button.style.backgroundColor = UI_COLORS.BORDER_DARK;
                button.style.color = '#fff';
            };
            button.onmouseout = () => {
                button.style.backgroundColor = 'transparent';
                button.style.color = UI_COLORS.ACCENT_COLOR;
            };
            button.onclick = () => this.setConnectionString(preset.value);

            container.appendChild(button);
        });

        return container;
    }

    createValidationStatus() {
        const status = document.createElement('div');
        status.style.cssText = `
            font-size: 11px;
            line-height: 1.3;
            min-height: 16px;
            display: none;
        `;

        return status;
    }

    handleInput() {
        const value = this.input.value.trim();
        this.onChange(value);

        if (this.options.validateOnInput) {
            // Debounce validation
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
            }

            this.validationTimeout = setTimeout(() => {
                this.validateConnection();
            }, this.options.debounceMs);
        }

        // Update UI state
        this.updateInputState('typing');
    }

    handleFocus() {
        this.input.style.borderColor = UI_COLORS.ACCENT_COLOR;
        if (this.presetsContainer) {
            this.presetsContainer.style.display = 'flex';
        }
    }

    handleBlur() {
        this.input.style.borderColor = '#555';
        // Don't hide presets immediately - let user click them
        setTimeout(() => {
            if (!this.container.contains(document.activeElement)) {
                if (this.presetsContainer) {
                    this.presetsContainer.style.display = this.input.value ? 'none' : 'flex';
                }
            }
        }, 150);
    }

    async validateConnection() {
        const value = this.input.value.trim();

        if (!value) {
            this.updateValidationState('empty');
            return;
        }

        if (this.isValidating) return;

        this.isValidating = true;
        this.updateInputState('validating');

        try {
            const response = await fetch('/distributed/validate_connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connection: value,
                    test_connectivity: false
                })
            });

            const result = await response.json();
            this.lastValidationResult = result;

            if (result.status === 'valid') {
                this.updateValidationState('valid', result.details);
            } else {
                this.updateValidationState('invalid', null, result.error);
            }

            this.onValidation(result);

        } catch (error) {
            this.updateValidationState('error', null, 'Validation service unavailable');
        } finally {
            this.isValidating = false;
        }
    }

    async testConnection() {
        const value = this.input.value.trim();

        if (!value) {
            this.showValidationMessage('Enter a connection string to test', 'error');
            return;
        }

        if (this.isTesting) return;

        this.isTesting = true;
        this.testButton.textContent = 'Testing...';
        this.testButton.disabled = true;
        this.updateInputState('testing');

        try {
            const response = await fetch('/distributed/validate_connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connection: value,
                    test_connectivity: true,
                    timeout: 10
                })
            });

            const result = await response.json();

            if (result.status === 'valid' && result.connectivity) {
                const conn = result.connectivity;
                if (conn.reachable) {
                    const responseTime = conn.response_time ? `${conn.response_time}ms` : '';
                    const workerInfo = conn.worker_info?.device_name ?
                        ` (${conn.worker_info.device_name})` : '';
                    this.showValidationMessage(
                        `✓ Connection successful ${responseTime}${workerInfo}`,
                        'success'
                    );
                } else {
                    this.showValidationMessage(
                        `✗ Connection failed: ${conn.error}`,
                        'error'
                    );
                }
            } else if (result.status === 'invalid') {
                this.showValidationMessage(`✗ Invalid connection: ${result.error}`, 'error');
            } else {
                this.showValidationMessage('✗ Connection test failed', 'error');
            }

            this.onConnectionTest(result);

        } catch (error) {
            this.showValidationMessage('✗ Test service unavailable', 'error');
        } finally {
            this.isTesting = false;
            this.testButton.textContent = 'Test';
            this.testButton.disabled = false;
            this.updateInputState('normal');
        }
    }

    updateInputState(state) {
        const colors = {
            normal: '#555',
            typing: UI_COLORS.ACCENT_COLOR,
            validating: '#ffa500',
            testing: '#4a7c4a',
            valid: '#4a7c4a',
            invalid: '#c04c4c',
            error: '#c04c4c'
        };

        const statusColors = {
            normal: UI_COLORS.BORDER_LIGHT,
            typing: UI_COLORS.ACCENT_COLOR,
            validating: '#ffa500',
            testing: '#4a7c4a',
            valid: '#4a7c4a',
            invalid: '#c04c4c',
            error: '#c04c4c'
        };

        this.input.style.borderColor = colors[state] || colors.normal;
        this.statusIcon.style.backgroundColor = statusColors[state] || statusColors.normal;
    }

    updateValidationState(state, details = null, error = null) {
        this.updateInputState(state);

        if (state === 'empty') {
            this.hideValidationMessage();
            return;
        }

        if (state === 'valid' && details) {
            const typeText = details.worker_type === 'cloud' ? 'Cloud' :
                           details.worker_type === 'remote' ? 'Remote' : 'Local';
            const protocolText = details.is_secure ? 'HTTPS' : 'HTTP';
            this.showValidationMessage(
                `✓ Valid ${typeText} worker (${protocolText}://${details.host}:${details.port})`,
                'success'
            );
        } else if (state === 'invalid' && error) {
            this.showValidationMessage(`✗ ${error}`, 'error');
        } else if (state === 'error' && error) {
            this.showValidationMessage(`⚠ ${error}`, 'warning');
        }
    }

    showValidationMessage(message, type = 'info') {
        const colors = {
            success: '#4a7c4a',
            error: '#c04c4c',
            warning: '#ffa500',
            info: UI_COLORS.MUTED_TEXT
        };

        this.validationStatus.textContent = message;
        this.validationStatus.style.color = colors[type];
        this.validationStatus.style.display = 'block';
    }

    hideValidationMessage() {
        this.validationStatus.style.display = 'none';
    }

    setConnectionString(value) {
        this.input.value = value;
        this.input.focus();
        this.handleInput();
    }

    getValue() {
        return this.input.value.trim();
    }

    setValue(value) {
        this.input.value = value || '';
        if (value && this.options.validateOnInput) {
            this.validateConnection();
        }
    }

    setEnabled(enabled) {
        this.input.disabled = !enabled;
        if (this.testButton) {
            this.testButton.disabled = !enabled;
        }
    }

    getValidationResult() {
        return this.lastValidationResult;
    }

    destroy() {
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}