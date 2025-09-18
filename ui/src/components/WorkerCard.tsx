import { useState } from 'react'

import { createApiClient } from '@/services/apiClient'
import type { Worker, WorkerStatus } from '@/types'
import { UI_COLORS } from '@/utils/constants'

import { StatusDot } from './StatusDot'

interface WorkerCardProps {
  worker: Worker
  onToggle?: (workerId: string, enabled: boolean) => void
  onDelete?: (workerId: string) => void
  onSaveSettings?: (workerId: string, settings: Partial<Worker>) => void
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  onToggle,
  onDelete,
  onSaveSettings
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editedWorker, setEditedWorker] = useState<Partial<Worker>>(worker)
  const [connectionTestResult, setConnectionTestResult] = useState<{
    message: string
    type: 'success' | 'error' | 'warning'
  } | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const isRemote = worker.type === 'remote' || worker.type === 'cloud'
  const isCloud = worker.type === 'cloud'
  const isLocal = worker.type === 'local'

  const getConnectionDisplay = () => {
    if (worker.connection) {
      return worker.connection.replace(/^https?:\/\//, '')
    }
    if (isCloud) {
      return worker.host
    }
    if (isRemote) {
      return `${worker.host}:${worker.port}`
    }
    return `Port ${worker.port}`
  }

  const getInfoText = () => {
    const connectionDisplay = getConnectionDisplay()

    if (isLocal) {
      const cudaInfo =
        worker.cuda_device !== undefined ? `CUDA ${worker.cuda_device} • ` : ''
      return { main: worker.name, sub: `${cudaInfo}${connectionDisplay}` }
    } else {
      const typeInfo = isCloud ? '☁️ ' : '🌐 '
      return { main: worker.name, sub: `${typeInfo}${connectionDisplay}` }
    }
  }

  const handleToggle = () => {
    onToggle?.(worker.id, !worker.enabled)
  }

  const handleSaveSettings = () => {
    onSaveSettings?.(worker.id, editedWorker)
    setHasUnsavedChanges(false)
    setConnectionTestResult(null)
  }

  const handleCancelSettings = () => {
    setEditedWorker(worker)
    setHasUnsavedChanges(false)
    setConnectionTestResult(null)
  }

  const handleFieldChange = (field: keyof Worker, value: any) => {
    setEditedWorker((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    setConnectionTestResult(null)
  }

  const infoText = getInfoText()
  const status = worker.enabled
    ? worker.status || WorkerStatus.OFFLINE
    : WorkerStatus.DISABLED
  const isPulsing = worker.enabled && worker.status === WorkerStatus.OFFLINE

  return (
    <div
      style={{
        marginBottom: '12px',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        background: UI_COLORS.BACKGROUND_DARK,
        border: `1px solid ${UI_COLORS.BORDER_DARKER}`
      }}
    >
      {/* Checkbox Column */}
      <div
        style={{
          flex: '0 0 44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: `1px solid ${UI_COLORS.BORDER_DARKER}`,
          background: 'rgba(0,0,0,0.1)'
        }}
      >
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: '1'
            }}
          >
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
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              ▶
            </span>
          </div>
        </div>

        {/* Settings Panel */}
        {isExpanded && (
          <div
            style={{
              margin: '0 12px 12px 12px',
              padding: '12px',
              background: UI_COLORS.BACKGROUND_DARKER,
              borderRadius: '4px',
              border: `1px solid ${UI_COLORS.BACKGROUND_DARK}`
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {/* Name */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <label
                  htmlFor="worker-name-edit"
                  style={{ fontSize: '12px', color: '#ccc' }}
                >
                  Name
                </label>
                <input
                  id="worker-name-edit"
                  type="text"
                  value={editedWorker.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  style={{
                    padding: '4px 8px',
                    background: '#222',
                    border: '1px solid #333',
                    color: '#ddd',
                    fontSize: '12px',
                    borderRadius: '3px',
                    width: '100%'
                  }}
                />
              </div>

              {/* Connection */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <label
                  htmlFor="worker-connection-edit"
                  style={{ fontSize: '12px', color: '#ccc' }}
                >
                  Connection
                </label>
                <div
                  style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
                >
                  <input
                    id="worker-connection-edit"
                    type="text"
                    value={editedWorker.connection || ''}
                    onChange={(e) =>
                      handleFieldChange('connection', e.target.value)
                    }
                    style={{
                      padding: '4px 8px',
                      background: '#222',
                      border: '1px solid #333',
                      color: '#ddd',
                      fontSize: '12px',
                      borderRadius: '3px',
                      flex: '1'
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
                    onClick={async () => {
                      const connectionStr =
                        editedWorker.connection ||
                        `${editedWorker.host}:${editedWorker.port}`

                      if (!connectionStr.trim()) {
                        setConnectionTestResult({
                          message: '✗ Enter a connection string to test',
                          type: 'error'
                        })
                        return
                      }

                      setIsTestingConnection(true)
                      setConnectionTestResult({
                        message: 'Testing connection...',
                        type: 'warning'
                      })

                      try {
                        const apiClient = createApiClient(
                          window.location.origin
                        )
                        const result = await apiClient.validateConnection(
                          connectionStr,
                          true,
                          10
                        )

                        if (
                          result.status === 'valid' &&
                          result.connectivity?.reachable
                        ) {
                          const responseTime = result.connectivity.response_time
                            ? ` ${result.connectivity.response_time}ms`
                            : ''
                          const workerInfo = result.connectivity.worker_info
                            ?.device_name
                            ? ` (${result.connectivity.worker_info.device_name})`
                            : ''
                          setConnectionTestResult({
                            message: `✓ Connection successful${responseTime}${workerInfo}`,
                            type: 'success'
                          })
                        } else if (
                          result.status === 'valid' &&
                          result.connectivity &&
                          !result.connectivity.reachable
                        ) {
                          setConnectionTestResult({
                            message: `✗ Connection failed: ${result.connectivity.error}`,
                            type: 'error'
                          })
                        } else if (result.status === 'invalid') {
                          setConnectionTestResult({
                            message: `✗ Invalid connection: ${result.error}`,
                            type: 'error'
                          })
                        } else {
                          setConnectionTestResult({
                            message: '✗ Connection test failed',
                            type: 'error'
                          })
                        }
                      } catch (error) {
                        setConnectionTestResult({
                          message: '✗ Test service unavailable',
                          type: 'error'
                        })
                      } finally {
                        setIsTestingConnection(false)
                      }
                    }}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? 'Testing...' : 'Test'}
                  </button>
                </div>

                {/* Connection Test Result */}
                {connectionTestResult && (
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '4px',
                      color:
                        connectionTestResult.type === 'success'
                          ? '#4a7c4a'
                          : connectionTestResult.type === 'error'
                            ? '#c04c4c'
                            : '#ffa500'
                    }}
                  >
                    {connectionTestResult.message}
                  </div>
                )}

                {/* Quick Presets for Local Workers */}
                {editedWorker.type === 'local' && !editedWorker.connection && (
                  <div style={{ marginTop: '8px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#999',
                        marginBottom: '4px'
                      }}
                    >
                      Quick Setup:
                    </div>
                    <div
                      style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}
                    >
                      {[
                        'localhost:8189',
                        'localhost:8190',
                        'localhost:8191'
                      ].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => {
                            handleFieldChange('connection', preset)
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '10px',
                            background: '#444',
                            border: '1px solid #555',
                            color: '#ddd',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#555'
                            e.currentTarget.style.borderColor = '#666'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#444'
                            e.currentTarget.style.borderColor = '#555'
                          }}
                        >
                          {preset.split(':')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Worker Type */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <label
                  htmlFor="worker-type-edit"
                  style={{ fontSize: '12px', color: '#ccc' }}
                >
                  Worker Type
                </label>
                <select
                  id="worker-type-edit"
                  value={editedWorker.type || 'local'}
                  onChange={(e) =>
                    handleFieldChange('type', e.target.value as any)
                  }
                  style={{
                    padding: '4px 8px',
                    background: '#222',
                    border: '1px solid #333',
                    color: '#ddd',
                    fontSize: '12px',
                    borderRadius: '3px',
                    width: '100%'
                  }}
                >
                  <option value="local">Local</option>
                  <option value="remote">Remote</option>
                  <option value="cloud">Cloud</option>
                </select>
              </div>

              {/* CUDA Device */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <label
                  htmlFor="worker-cuda-device-edit"
                  style={{ fontSize: '12px', color: '#ccc' }}
                >
                  CUDA Device
                </label>
                <input
                  id="worker-cuda-device-edit"
                  type="number"
                  value={editedWorker.cuda_device ?? ''}
                  onChange={(e) => {
                    const value =
                      e.target.value === ''
                        ? undefined
                        : parseInt(e.target.value)
                    handleFieldChange('cuda_device', value)
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#222',
                    border: '1px solid #333',
                    color: '#ddd',
                    fontSize: '12px',
                    borderRadius: '3px',
                    width: '100%'
                  }}
                  min="0"
                  placeholder="auto"
                />
              </div>

              {/* Extra Args */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <label
                  htmlFor="worker-extra-args-edit"
                  style={{ fontSize: '12px', color: '#ccc' }}
                >
                  Extra Args
                </label>
                <input
                  id="worker-extra-args-edit"
                  type="text"
                  value={editedWorker.extra_args || ''}
                  onChange={(e) =>
                    handleFieldChange('extra_args', e.target.value)
                  }
                  style={{
                    padding: '4px 8px',
                    background: '#222',
                    border: '1px solid #333',
                    color: '#ddd',
                    fontSize: '12px',
                    borderRadius: '3px',
                    width: '100%'
                  }}
                  placeholder="--listen --port 8190"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons (when expanded) */}
        {isExpanded && (
          <div style={{ margin: '0 12px 12px 12px' }}>
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid #444',
                display: 'flex',
                gap: '6px'
              }}
            >
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
                  backgroundColor: hasUnsavedChanges ? '#4a7c4a' : '#666',
                  flex: '1',
                  opacity: hasUnsavedChanges ? 1 : 0.6
                }}
                className="distributed-button"
                disabled={!hasUnsavedChanges}
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
                  backgroundColor: hasUnsavedChanges ? '#555' : '#666',
                  flex: '1',
                  opacity: hasUnsavedChanges ? 1 : 0.6
                }}
                className="distributed-button"
                disabled={!hasUnsavedChanges}
              >
                Cancel
              </button>
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
    </div>
  )
}
