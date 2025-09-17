import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionService } from '../services/connectionService';
import { ConnectionInputProps, ConnectionInputState } from '../types/connection';
import './ConnectionInput.css';

export const ConnectionInput: React.FC<ConnectionInputProps> = ({
  value = '',
  placeholder = 'localhost:8189 or https://host:port',
  showPresets = true,
  showTestButton = true,
  validateOnInput = true,
  debounceMs = 500,
  disabled = false,
  id,
  onChange,
  onValidation,
  onConnectionTest,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [state, setState] = useState<ConnectionInputState>('normal');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const connectionService = ConnectionService.getInstance();

  // Debounced validation
  useEffect(() => {
    if (!validateOnInput || !inputValue.trim()) {
      setState('normal');
      setValidationMessage('');
      return;
    }

    setState('typing');

    const timeoutId = setTimeout(async () => {
      setState('validating');

      try {
        const result = await connectionService.validateConnection(inputValue, false);
        const formatted = connectionService.formatValidationMessage(result);

        setValidationMessage(formatted.message);
        setMessageType(formatted.type);
        setState(
          result.status === 'valid' ? 'valid' : result.status === 'invalid' ? 'invalid' : 'error'
        );

        onValidation?.(result);
      } catch (error) {
        setState('error');
        setValidationMessage('✗ Validation failed');
        setMessageType('error');
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [inputValue, validateOnInput, debounceMs, onValidation]);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handlePresetClick = useCallback(
    (presetValue: string) => {
      setInputValue(presetValue);
      onChange?.(presetValue);
    },
    [onChange]
  );

  const handleTestConnection = useCallback(async () => {
    if (!inputValue.trim()) return;

    setState('testing');
    setValidationMessage('Testing connection...');
    setMessageType('info');

    try {
      const result = await connectionService.validateConnection(inputValue, true, 10);
      const formatted = connectionService.formatValidationMessage(result);

      setValidationMessage(formatted.message);
      setMessageType(formatted.type);
      setState(result.status === 'valid' && result.connectivity?.reachable ? 'valid' : 'error');

      onConnectionTest?.(result);
    } catch (error) {
      setState('error');
      setValidationMessage('✗ Connection test failed');
      setMessageType('error');
    }
  }, [inputValue, onConnectionTest]);

  const getInputClassName = () => {
    const baseClass = 'connection-input';
    const stateClass = `connection-input--${state}`;
    const disabledClass = disabled ? 'connection-input--disabled' : '';
    return `${baseClass} ${stateClass} ${disabledClass}`.trim();
  };

  const getMessageClassName = () => {
    return `connection-message connection-message--${messageType}`;
  };

  const presets = connectionService.getConnectionPresets();

  return (
    <div className='connection-input-container'>
      <div className='connection-input-wrapper'>
        <input
          id={id}
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || state === 'validating' || state === 'testing'}
          className={getInputClassName()}
        />

        {showTestButton && (
          <button
            type='button'
            onClick={handleTestConnection}
            disabled={
              disabled || !inputValue.trim() || state === 'validating' || state === 'testing'
            }
            className='connection-test-button'
          >
            {state === 'testing' ? 'Testing...' : 'Test'}
          </button>
        )}
      </div>

      {showPresets && (
        <div className='connection-presets'>
          {presets.map(preset => (
            <button
              key={preset.value}
              type='button'
              onClick={() => handlePresetClick(preset.value)}
              disabled={disabled}
              className='connection-preset-button'
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {validationMessage && <div className={getMessageClassName()}>{validationMessage}</div>}
    </div>
  );
};
