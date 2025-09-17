import { useState } from 'react';
import { MasterNode, WorkerStatus } from '@/types/worker';
import { StatusDot } from './StatusDot';
import { UI_COLORS } from '@/utils/constants';

interface MasterCardProps {
  master: MasterNode;
  onSaveSettings?: (settings: Partial<MasterNode>) => void;
}

export const MasterCard: React.FC<MasterCardProps> = ({ master, onSaveSettings }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedMaster, setEditedMaster] = useState<Partial<MasterNode>>(master);

  const handleSaveSettings = () => {
    onSaveSettings?.(editedMaster);
  };

  const handleCancelSettings = () => {
    setEditedMaster(master);
  };

  const cudaInfo = master.cuda_device !== undefined ? `CUDA ${master.cuda_device} • ` : '';
  const port =
    master.port || window.location.port || (window.location.protocol === 'https:' ? '443' : '80');

  return (
    <div
      style={{
        marginBottom: '12px',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        background: UI_COLORS.BACKGROUND_DARK,
        border: `1px solid ${UI_COLORS.BORDER_DARKER}`,
      }}
    >
      {/* Checkbox Column - Master is always enabled */}
      <div
        style={{
          flex: '0 0 44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: `1px solid ${UI_COLORS.BORDER_DARKER}`,
          background: 'rgba(0,0,0,0.1)',
        }}
      >
        <input
          type='checkbox'
          checked={true}
          disabled={true}
          title='Master node is always enabled'
          style={{ margin: 0, opacity: 0.6 }}
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
            minHeight: '64px',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1' }}>
            <StatusDot status={WorkerStatus.ONLINE} isPulsing={false} />
            <div style={{ flex: '1' }}>
              <strong id='master-name-display'>{master.name || 'Master'}</strong>
              <br />
              <small style={{ color: UI_COLORS.MUTED_TEXT }}>
                <span id='master-cuda-info'>
                  {cudaInfo}Port {port}
                </span>
              </small>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div
              style={{
                padding: '4px 14px',
                color: '#999',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: '#333',
                textAlign: 'center',
              }}
            >
              Master
            </div>

            {/* Dropdown arrow indicator */}
            <span
              style={{
                fontSize: '12px',
                color: '#888',
                cursor: 'pointer',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                userSelect: 'none',
                padding: '4px',
              }}
              onClick={e => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              ▶
            </span>
          </div>
        </div>

        {/* Settings Panel */}
        <div className={`worker-settings ${isExpanded ? 'expanded' : ''}`}>
          <div
            style={{
              margin: '0 12px',
              padding: '12px',
              background: UI_COLORS.BACKGROUND_DARKER,
              borderRadius: '4px',
              border: `1px solid ${UI_COLORS.BACKGROUND_DARK}`,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label
                  htmlFor="master-name"
                  style={{ fontSize: '12px', color: UI_COLORS.SECONDARY_TEXT, fontWeight: '500' }}
                >
                  Name:
                </label>
                <input
                  id="master-name"
                  type='text'
                  value={editedMaster.name || ''}
                  onChange={e => setEditedMaster({ ...editedMaster, name: e.target.value })}
                  style={{
                    padding: '6px 10px',
                    background: UI_COLORS.BACKGROUND_DARK,
                    border: `1px solid ${UI_COLORS.BORDER_DARK}`,
                    color: 'white',
                    fontSize: '12px',
                    borderRadius: '4px',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button
                  onClick={handleSaveSettings}
                  style={{
                    padding: '4px 14px',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#4a7c4a',
                    flex: '1',
                  }}
                  className='distributed-button'
                >
                  Save
                </button>
                <button
                  onClick={handleCancelSettings}
                  style={{
                    padding: '4px 14px',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#555',
                    flex: '1',
                  }}
                  className='distributed-button'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
