import React from 'react';
import { useAppStore } from '@/stores/appStore';
import { UI_STYLES, BUTTON_STYLES } from '@/utils/constants';

export function ExecutionPanel() {
  const { executionState, workers, clearExecutionErrors } = useAppStore();
  const selectedWorkers = workers.filter(worker => worker.isSelected && worker.status === 'online');

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

  const handleInterruptWorkers = () => {
    console.log('Interrupting workers...');
  };

  const handleClearMemory = () => {
    console.log('Clearing memory...');
  };

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid #444' }}>
      <h3 style={{ marginBottom: '12px', color: '#fff' }}>Execution Control</h3>

      {/* Status Info */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={parseStyle(UI_STYLES.infoBox)}>
          Workers Online: {selectedWorkers.length}
        </div>

        {executionState.isExecuting && (
          <div style={parseStyle(UI_STYLES.infoBox)}>
            Progress: {Math.round(executionState.progress)}%
          </div>
        )}

        {executionState.totalBatches > 0 && (
          <div style={parseStyle(UI_STYLES.infoBox)}>
            Batches: {executionState.completedBatches}/{executionState.totalBatches}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {executionState.isExecuting && (
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#333',
          borderRadius: '3px',
          marginBottom: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${executionState.progress}%`,
            height: '100%',
            backgroundColor: '#4a7c4a',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {/* Control Buttons */}
      <div style={parseStyle(UI_STYLES.controlsDiv)}>
        <button
          style={{
            ...parseStyle(BUTTON_STYLES.base),
            ...parseStyle(BUTTON_STYLES.interrupt),
            flex: 1
          }}
          onClick={handleInterruptWorkers}
          disabled={!executionState.isExecuting}
          className="distributed-button"
        >
          Interrupt Workers
        </button>

        <button
          style={{
            ...parseStyle(BUTTON_STYLES.base),
            ...parseStyle(BUTTON_STYLES.clearMemory),
            flex: 1
          }}
          onClick={handleClearMemory}
          className="distributed-button"
        >
          Clear Memory
        </button>
      </div>

      {/* Execution Errors */}
      {executionState.errors.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#7c4a4a',
          borderRadius: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <strong style={{ color: '#fff', fontSize: '12px' }}>
              Execution Errors ({executionState.errors.length})
            </strong>
            <button
              style={{
                ...parseStyle(BUTTON_STYLES.base),
                backgroundColor: 'transparent',
                border: '1px solid #999',
                padding: '2px 8px',
                fontSize: '10px'
              }}
              onClick={clearExecutionErrors}
              className="distributed-button"
            >
              Clear
            </button>
          </div>

          <div style={{
            maxHeight: '120px',
            overflowY: 'auto',
            fontSize: '11px',
            color: '#fff'
          }}>
            {executionState.errors.map((error, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Worker Status Warning */}
      {selectedWorkers.length === 0 && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#685434',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          No workers are online and selected for distributed processing
        </div>
      )}
    </div>
  );
}