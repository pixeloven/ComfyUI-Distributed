import { useState } from 'react';
import { Worker } from '@/types/worker';
import { StatusDot } from './StatusDot';
import { WorkerLogModal } from './WorkerLogModal';
import { UI_COLORS } from '@/utils/constants';

interface WorkerCardProps {
  worker: Worker;
  onToggle?: (workerId: string, enabled: boolean) => void;
  onStart?: (workerId: string) => void;
  onStop?: (workerId: string) => void;
  onDelete?: (workerId: string) => void;
  onSaveSettings?: (workerId: string, settings: Partial<Worker>) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  onToggle,
  onStart,
  onStop,
  onDelete,
  onSaveSettings
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedWorker, setEditedWorker] = useState<Partial<Worker>>(worker);
  const [showLogModal, setShowLogModal] = useState(false);

  const isRemote = worker.type === 'remote' || worker.type === 'cloud';
  const isCloud = worker.type === 'cloud';
  const isLocal = worker.type === 'local';

  const getConnectionDisplay = () => {
    if (worker.connection) {
      return worker.connection.replace(/^https?:\/\//, '');
    }
    if (isCloud) {
      return worker.host;
    }
    if (isRemote) {
      return `${worker.host}:${worker.port}`;
    }
    return `Port ${worker.port}`;
  };

  const getInfoText = () => {
    const connectionDisplay = getConnectionDisplay();

    if (isLocal) {
      const cudaInfo = worker.cuda_device !== undefined ? `CUDA ${worker.cuda_device} • ` : '';
      return { main: worker.name, sub: `${cudaInfo}${connectionDisplay}` };
    } else {
      const typeInfo = isCloud ? '☁️ ' : '🌐 ';
      return { main: worker.name, sub: `${typeInfo}${connectionDisplay}` };
    }
  };

  const handleToggle = () => {
    onToggle?.(worker.id, !worker.enabled);
  };

  const infoText = getInfoText();
  const status = worker.enabled ? (worker.status || 'offline') : 'disabled';
  const isPulsing = worker.enabled && worker.status === 'offline';

  return (
    <div style={{
      marginBottom: '12px',
      borderRadius: '6px',
      overflow: 'hidden',
      display: 'flex',
      background: UI_COLORS.BACKGROUND_DARK,
      border: `1px solid ${UI_COLORS.BORDER_DARKER}`
    }}>
      {/* Checkbox Column */}
      <div style={{
        flex: '0 0 44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: `1px solid ${UI_COLORS.BORDER_DARKER}`,
        background: 'rgba(0,0,0,0.1)'
      }}>
        <input
          type="checkbox"
          checked={worker.enabled}
          onChange={handleToggle}
          title="Enable/disable this worker"
          style={{ margin: 0 }}
        />
      </div>

      {/* Content Column */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        {/* Info Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            cursor: 'pointer',
            minHeight: '64px'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1' }}>
            <StatusDot status={status} isPulsing={isPulsing} />
            <div style={{ flex: '1' }}>
              <strong>{infoText.main}</strong>
              <br />
              <small style={{ color: UI_COLORS.MUTED_TEXT }}>
                {infoText.sub}
              </small>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {worker.enabled && (
              <>
                {worker.status === 'online' ? (
                  <button
                    style={{
                      padding: '4px 14px',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: '#7c4a4a'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStop?.(worker.id);
                    }}
                    className="distributed-button"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    style={{
                      padding: '4px 14px',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: '#4a7c4a'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart?.(worker.id);
                    }}
                    className="distributed-button"
                  >
                    Start
                  </button>
                )}
                <button
                  style={{
                    padding: '4px 14px',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: '#685434'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLogModal(true);
                  }}
                  className="distributed-button"
                >
                  Log
                </button>
              </>
            )}

            {/* Dropdown arrow indicator */}
            <span
              style={{
                fontSize: '12px',
                color: '#888',
                cursor: 'pointer',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                userSelect: 'none',
                padding: '4px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              ▶
            </span>
          </div>
        </div>

        {/* Settings Panel */}
        {isExpanded && (
          <div style={{
            margin: '0 12px 12px 12px',
            padding: '12px',
            background: UI_COLORS.BACKGROUND_DARKER,
            borderRadius: '4px',
            border: `1px solid ${UI_COLORS.BACKGROUND_DARK}`
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
              {/* Name */}
              <label style={{ fontSize: '12px', color: '#ccc' }}>Name</label>
              <input
                type="text"
                value={editedWorker.name || ''}
                onChange={(e) => {
                  setEditedWorker({ ...editedWorker, name: e.target.value });
                  onSaveSettings?.(worker.id, { ...editedWorker, name: e.target.value });
                }}
                style={{
                  padding: '4px 8px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#ddd',
                  fontSize: '12px',
                  borderRadius: '3px',
                  width: '150px'
                }}
              />

              {/* Connection */}
              <label style={{ fontSize: '12px', color: '#ccc' }}>Connection</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editedWorker.connection || ''}
                  onChange={(e) => {
                    setEditedWorker({ ...editedWorker, connection: e.target.value });
                    onSaveSettings?.(worker.id, { ...editedWorker, connection: e.target.value });
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#222',
                    border: '1px solid #333',
                    color: '#ddd',
                    fontSize: '12px',
                    borderRadius: '3px',
                    width: '120px'
                  }}
                  placeholder="host:port or URL"
                />
                <button
                  style={{
                    padding: '4px 8px',
                    background: '#4a7c4a',
                    border: 'none',
                    color: '#fff',
                    fontSize: '10px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    // TODO: Implement connection test
                    console.log('Testing connection to:', editedWorker.connection);
                  }}
                >
                  Test
                </button>
              </div>

              {/* Worker Type */}
              <label style={{ fontSize: '12px', color: '#ccc' }}>Worker Type</label>
              <select
                value={editedWorker.type || 'local'}
                onChange={(e) => {
                  setEditedWorker({ ...editedWorker, type: e.target.value as any });
                  onSaveSettings?.(worker.id, { ...editedWorker, type: e.target.value as any });
                }}
                style={{
                  padding: '4px 8px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#ddd',
                  fontSize: '12px',
                  borderRadius: '3px',
                  width: '100px'
                }}
              >
                <option value="local">Local</option>
                <option value="remote">Remote</option>
                <option value="cloud">Cloud</option>
              </select>

              {/* CUDA Device */}
              <label style={{ fontSize: '12px', color: '#ccc' }}>CUDA Device</label>
              <input
                type="number"
                value={editedWorker.cuda_device ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                  setEditedWorker({ ...editedWorker, cuda_device: value });
                  onSaveSettings?.(worker.id, { ...editedWorker, cuda_device: value });
                }}
                style={{
                  padding: '4px 8px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#ddd',
                  fontSize: '12px',
                  borderRadius: '3px',
                  width: '60px'
                }}
                min="0"
                placeholder="auto"
              />

              {/* Extra Args */}
              <label style={{ fontSize: '12px', color: '#ccc' }}>Extra Args</label>
              <input
                type="text"
                value={editedWorker.extra_args || ''}
                onChange={(e) => {
                  setEditedWorker({ ...editedWorker, extra_args: e.target.value });
                  onSaveSettings?.(worker.id, { ...editedWorker, extra_args: e.target.value });
                }}
                style={{
                  padding: '4px 8px',
                  background: '#222',
                  border: '1px solid #333',
                  color: '#ddd',
                  fontSize: '12px',
                  borderRadius: '3px',
                  width: '150px'
                }}
                placeholder="--listen --port 8190"
              />
            </div>
          </div>
        )}

        {/* Delete Button (when expanded) */}
        {isExpanded && (
          <div style={{ margin: '0 12px 12px 12px' }}>
            <div style={{
              padding: '8px 12px',
              borderTop: '1px solid #444',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => onDelete?.(worker.id)}
                style={{
                  padding: '4px 14px',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#7c4a4a',
                  flex: '1'
                }}
                className="distributed-button"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Worker Log Modal */}
      <WorkerLogModal
        isOpen={showLogModal}
        workerId={worker.id}
        workerName={worker.name}
        onClose={() => setShowLogModal(false)}
      />
    </div>
  );
};