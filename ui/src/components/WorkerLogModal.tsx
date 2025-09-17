import React, { useState, useEffect, useRef } from 'react';

interface WorkerLogModalProps {
  isOpen: boolean;
  workerId: string;
  workerName: string;
  onClose: () => void;
}

interface LogData {
  content: string;
  log_file: string;
  file_size: number;
  lines_shown: number;
  truncated: boolean;
}

export const WorkerLogModal: React.FC<WorkerLogModalProps> = ({
  isOpen,
  workerId,
  workerName,
  onClose,
}) => {
  const [logData, setLogData] = useState<LogData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logContentRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<number | null>(null);

  // Load initial log data
  useEffect(() => {
    if (isOpen && workerId) {
      loadLogData();
    }
  }, [isOpen, workerId]);

  // Handle auto-refresh
  useEffect(() => {
    if (isOpen && autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [isOpen, autoRefresh, workerId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const loadLogData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`/distributed/worker_log/${workerId}?lines=1000`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LogData = await response.json();

      // Check if we should auto-scroll (user is at bottom)
      const shouldAutoScroll = logContentRef.current
        ? logContentRef.current.scrollTop + logContentRef.current.clientHeight >=
          logContentRef.current.scrollHeight - 50
        : true;

      setLogData(data);

      // Auto-scroll to bottom if user was already there
      if (shouldAutoScroll) {
        setTimeout(() => {
          if (logContentRef.current) {
            logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
          }
        }, 0);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!silent) {
        setError(`Failed to load log: ${errorMessage}`);
      }
      console.error('Failed to load worker log:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const startAutoRefresh = () => {
    stopAutoRefresh();
    autoRefreshIntervalRef.current = window.setInterval(() => {
      loadLogData(true); // Silent refresh
    }, 2000);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };

  const handleRefresh = () => {
    loadLogData();
  };

  const handleAutoRefreshToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(e.target.checked);
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={handleModalClick}
    >
      <div
        style={{
          backgroundColor: '#2b2b2b',
          borderRadius: '8px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '800px',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '15px 20px',
            borderBottom: '1px solid #444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>{workerName} - Log Viewer</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Auto-refresh toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#ccc',
                cursor: 'pointer',
              }}
            >
              <input
                type='checkbox'
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                style={{ cursor: 'pointer' }}
              />
              Auto-refresh
            </label>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4a7c4a',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                backgroundColor: '#c04c4c',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: '1',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={logContentRef}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '15px',
            backgroundColor: '#1e1e1e',
            color: '#f0f0f0',
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '12px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {error ? (
            <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '20px' }}>{error}</div>
          ) : logData ? (
            logData.content || 'Log file is empty'
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              Loading log data...
            </div>
          )}
        </div>

        {/* Status bar */}
        {logData && (
          <div
            style={{
              padding: '8px 15px',
              borderTop: '1px solid #444',
              fontSize: '11px',
              color: '#888',
              backgroundColor: '#333',
            }}
          >
            Log file: {logData.log_file}
            {logData.truncated && (
              <span>
                {' '}
                (showing last {logData.lines_shown} lines of {formatFileSize(logData.file_size)})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
