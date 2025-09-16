import React, { useState } from 'react';
import type { Worker } from '@/types';
import { UI_STYLES, STATUS_COLORS, BUTTON_STYLES } from '@/utils/constants';

interface WorkerCardProps {
  worker: Worker;
  onLaunch: () => void;
  onStop: () => void;
  onToggle: () => void;
}

export function WorkerCard({ worker, onLaunch, onStop, onToggle }: WorkerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    switch (worker.status) {
      case 'online': return STATUS_COLORS.ONLINE_GREEN;
      case 'processing': return STATUS_COLORS.PROCESSING_YELLOW;
      case 'disabled': return STATUS_COLORS.DISABLED_GRAY;
      default: return STATUS_COLORS.OFFLINE_RED;
    }
  };

  const getStatusText = () => {
    switch (worker.status) {
      case 'online': return 'Online';
      case 'processing': return 'Processing';
      case 'disabled': return 'Disabled';
      default: return 'Offline';
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div style={{ ...parseStyle(UI_STYLES.workerCard), marginBottom: '12px' }}>
      {/* Checkbox Column */}
      <div style={parseStyle(UI_STYLES.checkboxColumn)}>
        <input
          type="checkbox"
          checked={worker.isSelected}
          onChange={handleCheckboxChange}
          title="Enable/disable this worker"
        />
      </div>

      {/* Content Column */}
      <div style={parseStyle(UI_STYLES.contentColumn)}>
        <div
          style={parseStyle(UI_STYLES.infoRow)}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={parseStyle(UI_STYLES.workerContent)}>
            {/* Status Dot */}
            <div
              style={{
                ...parseStyle(UI_STYLES.statusDot),
                backgroundColor: getStatusColor()
              }}
              title={getStatusText()}
              className={worker.status === 'processing' ? 'status-pulsing' : ''}
            />

            {/* Worker Info */}
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#fff' }}>
                Worker {worker.id}
              </strong>
              <br />
              <small style={{ color: '#888' }}>
                {worker.address}:{worker.port}
                {worker.isLocal && ' • Local'}
                {worker.processId && ` • PID: ${worker.processId}`}
              </small>
            </div>

            {/* Expand Arrow */}
            <div style={{
              ...parseStyle(UI_STYLES.settingsArrow),
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }}>
              ▶
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={parseStyle(UI_STYLES.controlsDiv)}>
          {worker.status === 'offline' && worker.isSelected && (
            <button
              style={{
                ...parseStyle(BUTTON_STYLES.base),
                ...parseStyle(BUTTON_STYLES.launch),
                ...parseStyle(BUTTON_STYLES.workerControl)
              }}
              onClick={onLaunch}
              className="distributed-button"
            >
              Launch
            </button>
          )}

          {worker.status === 'online' && (
            <button
              style={{
                ...parseStyle(BUTTON_STYLES.base),
                ...parseStyle(BUTTON_STYLES.stop),
                ...parseStyle(BUTTON_STYLES.workerControl)
              }}
              onClick={onStop}
              className="distributed-button"
            >
              Stop
            </button>
          )}

          {worker.status === 'processing' && (
            <button
              style={{
                ...parseStyle(BUTTON_STYLES.base),
                ...parseStyle(BUTTON_STYLES.info),
                ...parseStyle(BUTTON_STYLES.workerControl)
              }}
              disabled
              className="distributed-button"
            >
              Processing...
            </button>
          )}

          <button
            style={{
              ...parseStyle(BUTTON_STYLES.base),
              ...parseStyle(BUTTON_STYLES.log),
              ...parseStyle(BUTTON_STYLES.workerControl)
            }}
            onClick={() => console.log('View logs for', worker.id)}
            className="distributed-button"
          >
            Logs
          </button>
        </div>

        {/* Expanded Settings */}
        {isExpanded && (
          <div style={{
            ...parseStyle(UI_STYLES.workerSettings),
            opacity: 1,
            maxHeight: '500px',
            padding: '12px'
          }}>
            <div style={parseStyle(UI_STYLES.settingsForm)}>
              <div style={parseStyle(UI_STYLES.checkboxGroup)}>
                <input
                  type="checkbox"
                  checked={worker.config?.autoLaunch || false}
                  onChange={(e) => console.log('Auto launch:', e.target.checked)}
                />
                <label style={parseStyle(UI_STYLES.formLabelClickable)}>
                  Auto-launch with master
                </label>
              </div>

              <div style={parseStyle(UI_STYLES.checkboxGroup)}>
                <input
                  type="checkbox"
                  checked={worker.config?.enableCors || false}
                  onChange={(e) => console.log('Enable CORS:', e.target.checked)}
                />
                <label style={parseStyle(UI_STYLES.formLabelClickable)}>
                  Enable CORS headers
                </label>
              </div>

              <div style={parseStyle(UI_STYLES.formGroup)}>
                <label style={parseStyle(UI_STYLES.formLabel)}>
                  Additional Arguments:
                </label>
                <input
                  type="text"
                  style={parseStyle(UI_STYLES.formInput)}
                  value={worker.config?.additionalArgs || ''}
                  onChange={(e) => console.log('Additional args:', e.target.value)}
                  placeholder="--arg1 value1 --arg2 value2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to parse CSS-in-JS style strings
function parseStyle(styleString: string): React.CSSProperties {
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
}