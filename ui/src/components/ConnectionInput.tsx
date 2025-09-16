import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/appStore';
import { createApiClient } from '@/services/apiClient';
import { UI_STYLES, BUTTON_STYLES } from '@/utils/constants';

const apiClient = createApiClient(window.location.origin);

export function ConnectionInput() {
  const { t } = useTranslation();
  const { connectionState, setConnectionState, setMasterIP } = useAppStore();
  const [inputValue, setInputValue] = useState(connectionState.masterIP || window.location.hostname);
  const [isValidating, setIsValidating] = useState(false);

  const validateConnection = async () => {
    if (!inputValue.trim()) return;

    setIsValidating(true);
    setConnectionState({ isValidatingConnection: true });

    try {
      // Test connection to the entered IP
      const testUrl = `http://${inputValue}:${window.location.port || '8188'}/system_stats`;
      await apiClient.checkStatus(testUrl);

      setMasterIP(inputValue);
      setConnectionState({
        isConnected: true,
        isValidatingConnection: false,
        connectionError: undefined
      });
    } catch (error) {
      setConnectionState({
        isConnected: false,
        isValidatingConnection: false,
        connectionError: error instanceof Error ? error.message : 'Connection failed'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateConnection();
  };

  const parseStyle = (styleString: string): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (!styleString) return style;

    styleString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        (style as any)[camelCaseProperty] = value;
      }
    });

    return style;
  };

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid #444' }}>
      <h3 style={{ marginBottom: '12px', color: '#fff' }}>{t('connection.title')}</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ ...parseStyle(UI_STYLES.formGroup), flex: 1 }}>
          <label style={parseStyle(UI_STYLES.formLabel)}>
            {t('connection.masterIP')}:
          </label>
          <input
            type="text"
            style={{
              ...parseStyle(UI_STYLES.formInput),
              borderColor: connectionState.connectionError ? '#c04c4c' : '#444'
            }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('connection.placeholder')}
            disabled={isValidating}
          />
        </div>

        <button
          type="submit"
          style={{
            ...parseStyle(BUTTON_STYLES.base),
            backgroundColor: connectionState.isConnected ? '#4a7c4a' : '#555',
            padding: '6px 14px',
            minWidth: '80px'
          }}
          disabled={isValidating}
          className="distributed-button"
        >
          {isValidating ? 'Testing...' : connectionState.isConnected ? 'Connected' : 'Connect'}
        </button>
      </form>

      {connectionState.connectionError && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#7c4a4a',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Error: {connectionState.connectionError}
        </div>
      )}

      {connectionState.isConnected && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#4a7c4a',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Connected to {connectionState.masterIP}
        </div>
      )}
    </div>
  );
}