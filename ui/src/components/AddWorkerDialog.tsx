import React, { useState } from 'react';
import { ConnectionInput } from './ConnectionInput';
import { ConnectionService } from '../services/connectionService';
import { ConnectionValidationResult } from '../types/connection';
import './AddWorkerDialog.css';

interface AddWorkerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWorker: (workerConfig: {
    name: string;
    connection: string;
    host: string;
    port: number;
    type: 'local' | 'remote' | 'cloud';
    cuda_device?: number;
    extra_args?: string;
  }) => void;
}

export const AddWorkerDialog: React.FC<AddWorkerDialogProps> = ({
  isOpen,
  onClose,
  onAddWorker
}) => {
  const [connection, setConnection] = useState('');
  const [name, setName] = useState('');
  const [cudaDevice, setCudaDevice] = useState<number>(0);
  const [extraArgs, setExtraArgs] = useState('');
  const [validationResult, setValidationResult] = useState<ConnectionValidationResult | null>(null);
  const [isValid, setIsValid] = useState(false);

  const connectionService = ConnectionService.getInstance();

  const handleConnectionChange = (value: string) => {
    setConnection(value);

    // Auto-generate name based on connection
    if (value.trim()) {
      const parsed = connectionService.parseConnectionString(value);
      if (parsed) {
        const baseName = parsed.type === 'local' ? 'Local Worker' :
                        parsed.type === 'cloud' ? 'Cloud Worker' :
                        'Remote Worker';
        setName(`${baseName} (${parsed.host}:${parsed.port})`);
      }
    }
  };

  const handleValidation = (result: ConnectionValidationResult) => {
    setValidationResult(result);
    setIsValid(result.status === 'valid');
  };

  const handleConnectionTest = (result: ConnectionValidationResult) => {
    setValidationResult(result);
    setIsValid(result.status === 'valid' && result.connectivity?.reachable === true);
  };

  const handleSubmit = () => {
    if (!isValid || !connection.trim() || !name.trim()) return;

    const parsed = connectionService.parseConnectionString(connection);
    if (!parsed) return;

    onAddWorker({
      name: name.trim(),
      connection: connection.trim(),
      host: parsed.host,
      port: parsed.port,
      type: parsed.type,
      cuda_device: cudaDevice,
      extra_args: extraArgs.trim() || undefined
    });

    // Reset form
    setConnection('');
    setName('');
    setCudaDevice(0);
    setExtraArgs('');
    setValidationResult(null);
    setIsValid(false);
    onClose();
  };

  const handleCancel = () => {
    setConnection('');
    setName('');
    setCudaDevice(0);
    setExtraArgs('');
    setValidationResult(null);
    setIsValid(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="add-worker-dialog-overlay" onClick={handleCancel}>
      <div className="add-worker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="add-worker-dialog-header">
          <h3>Add New Worker</h3>
          <button className="add-worker-dialog-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="add-worker-dialog-content">
          <div className="add-worker-form-group">
            <label>Connection</label>
            <ConnectionInput
              value={connection}
              placeholder="localhost:8189, https://host:port, or cloud URL"
              showPresets={true}
              showTestButton={true}
              validateOnInput={true}
              onChange={handleConnectionChange}
              onValidation={handleValidation}
              onConnectionTest={handleConnectionTest}
            />
          </div>

          <div className="add-worker-form-group">
            <label>Worker Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter worker name"
              className="add-worker-input"
            />
          </div>

          <div className="add-worker-form-row">
            <div className="add-worker-form-group">
              <label>CUDA Device</label>
              <input
                type="number"
                value={cudaDevice}
                onChange={(e) => setCudaDevice(parseInt(e.target.value) || 0)}
                min="0"
                max="7"
                className="add-worker-input"
              />
            </div>

            <div className="add-worker-form-group">
              <label>Extra Arguments (Local workers only)</label>
              <input
                type="text"
                value={extraArgs}
                onChange={(e) => setExtraArgs(e.target.value)}
                placeholder="--cpu --preview-method auto"
                className="add-worker-input"
                disabled={validationResult?.details?.type !== 'local'}
              />
            </div>
          </div>
        </div>

        <div className="add-worker-dialog-footer">
          <button
            className="add-worker-button add-worker-button--secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="add-worker-button add-worker-button--primary"
            onClick={handleSubmit}
            disabled={!isValid || !connection.trim() || !name.trim()}
          >
            Add Worker
          </button>
        </div>
      </div>
    </div>
  );
};