import React, { useState } from 'react'

import { ToastService } from '@/services/toastService'
import { useAppStore } from '@/stores/appStore'
import { BUTTON_STYLES, UI_STYLES } from '@/utils/constants'

const toastService = ToastService.getInstance()

export function ExecutionPanel() {
  const { executionState, workers, clearExecutionErrors } = useAppStore()
  const selectedWorkers = workers.filter(
    (worker) => worker.enabled && worker.status === 'online'
  )
  const [interruptLoading, setInterruptLoading] = useState(false)
  const [clearMemoryLoading, setClearMemoryLoading] = useState(false)

  const parseStyle = (styleString: string): React.CSSProperties => {
    const style: React.CSSProperties = {}
    if (!styleString) return style

    styleString.split(';').forEach((rule) => {
      const [property, value] = rule.split(':').map((s) => s.trim())
      if (property && value) {
        const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        )
        ;(style as any)[camelCaseProperty] = value
      }
    })

    return style
  }

  const performWorkerOperation = async (
    endpoint: string,
    setLoading: (loading: boolean) => void,
    operationName: string
  ) => {
    const enabledWorkers = workers.filter((worker) => worker.enabled)

    if (enabledWorkers.length === 0) {
      console.log(`No enabled workers for ${operationName}`)
      toastService.warn(
        'No Workers',
        'No enabled workers available for this operation'
      )
      return
    }

    setLoading(true)

    const results = await Promise.allSettled(
      enabledWorkers.map(async (worker) => {
        const workerUrl =
          worker.connection || `http://${worker.host}:${worker.port}`
        const url = `${workerUrl}${endpoint}`

        try {
          const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          console.log(`${operationName} successful on worker ${worker.name}`)
          return { worker, success: true }
        } catch (error) {
          console.error(
            `${operationName} failed on worker ${worker.name}:`,
            error
          )
          return { worker, success: false, error }
        }
      })
    )

    const failures = results
      .filter((result) => result.status === 'rejected' || !result.value.success)
      .map((result) =>
        result.status === 'fulfilled'
          ? result.value.worker.name
          : 'Unknown worker'
      )

    const successCount = enabledWorkers.length - failures.length

    toastService.workerOperationResult(
      operationName,
      successCount,
      enabledWorkers.length,
      failures
    )

    setLoading(false)
  }

  const handleInterruptWorkers = () => {
    void performWorkerOperation(
      '/interrupt',
      setInterruptLoading,
      'Interrupt operation'
    )
  }

  const handleClearMemory = () => {
    void performWorkerOperation(
      '/distributed/clear_memory',
      setClearMemoryLoading,
      'Clear memory operation'
    )
  }

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
            Batches: {executionState.completedBatches}/
            {executionState.totalBatches}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {executionState.isExecuting && (
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#333',
            borderRadius: '3px',
            marginBottom: '12px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${executionState.progress}%`,
              height: '100%',
              backgroundColor: '#4a7c4a',
              transition: 'width 0.3s ease'
            }}
          />
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
          disabled={interruptLoading || selectedWorkers.length === 0}
          className="distributed-button"
        >
          {interruptLoading ? 'Interrupting...' : 'Interrupt Workers'}
        </button>

        <button
          style={{
            ...parseStyle(BUTTON_STYLES.base),
            ...parseStyle(BUTTON_STYLES.clearMemory),
            flex: 1
          }}
          onClick={handleClearMemory}
          disabled={clearMemoryLoading || selectedWorkers.length === 0}
          className="distributed-button"
        >
          {clearMemoryLoading ? 'Clearing...' : 'Clear Memory'}
        </button>
      </div>

      {/* Execution Errors */}
      {executionState.errors.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#7c4a4a',
            borderRadius: '4px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
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

          <div
            style={{
              maxHeight: '120px',
              overflowY: 'auto',
              fontSize: '11px',
              color: '#fff'
            }}
          >
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
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#685434',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          No workers are online and selected for distributed processing
        </div>
      )}
    </div>
  )
}
