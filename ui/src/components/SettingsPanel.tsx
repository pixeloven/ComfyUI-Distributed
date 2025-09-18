import React, { useEffect, useState } from 'react'

import { createApiClient } from '../services/apiClient'
import { ToastService } from '../services/toastService'

interface Settings {
  debug: boolean
  auto_launch_workers: boolean
  stop_workers_on_master_exit: boolean
  worker_timeout_seconds: number
}

const toastService = ToastService.getInstance()
const apiClient = createApiClient(window.location.origin)

export const SettingsPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    debug: false,
    auto_launch_workers: false,
    stop_workers_on_master_exit: true,
    worker_timeout_seconds: 60
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/distributed/config')
      const config = await response.json()

      if (config.settings) {
        setSettings({
          debug: config.settings.debug || false,
          auto_launch_workers: config.settings.auto_launch_workers || false,
          stop_workers_on_master_exit:
            config.settings.stop_workers_on_master_exit !== false, // Default true
          worker_timeout_seconds: config.settings.worker_timeout_seconds || 60
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = async (
    key: keyof Settings,
    value: boolean | number
  ) => {
    try {
      await apiClient.updateSetting(key, value)

      // Update local state
      setSettings((prev) => ({ ...prev, [key]: value }))

      // Show success notification
      const prettyKey = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
      let detail: string

      if (typeof value === 'boolean') {
        detail = `${prettyKey} ${value ? 'enabled' : 'disabled'}`
      } else {
        detail = `${prettyKey} set to ${value}`
      }

      toastService.success('Setting Updated', detail, 2000)
    } catch (error) {
      console.error(`Error updating setting '${key}':`, error)
      toastService.error(
        'Setting Update Failed',
        error instanceof Error ? error.message : 'Unknown error occurred',
        3000
      )
    }
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleCheckboxChange =
    (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
      void updateSetting(key, e.target.checked)
    }

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (Number.isFinite(value) && value > 0) {
      void updateSetting('worker_timeout_seconds', value)
    }
  }

  if (isLoading) {
    return (
      <div style={{ borderTop: '1px solid #444', padding: '16px 0' }}>
        <div style={{ color: '#888', fontSize: '12px' }}>
          Loading settings...
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderTop: '1px solid #444', marginBottom: '10px' }}>
      {/* Settings Toggle Header */}
      <div
        style={{
          padding: '16.5px 0',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={handleToggle}
        onMouseEnter={(e) => {
          const toggle = e.currentTarget.querySelector('.settings-toggle')
          if (toggle) (toggle as HTMLElement).style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          const toggle = e.currentTarget.querySelector('.settings-toggle')
          if (toggle) (toggle as HTMLElement).style.color = '#888'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>
            Settings
          </h4>
          <span
            className="settings-toggle"
            style={{
              fontSize: '12px',
              color: '#888',
              transition: 'all 0.2s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }}
          >
            ▶
          </span>
        </div>
      </div>

      {/* Bottom separator when collapsed */}
      {!isExpanded && (
        <div style={{ borderBottom: '1px solid #444', margin: 0 }} />
      )}

      {/* Settings Content */}
      <div
        style={{
          maxHeight: isExpanded ? '200px' : '0',
          overflow: 'hidden',
          opacity: isExpanded ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.3s ease'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            rowGap: '10px',
            columnGap: '10px',
            paddingTop: '10px',
            alignItems: 'center'
          }}
        >
          {/* General Section */}
          <div
            style={{
              gridColumn: '1 / -1',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#fff',
              marginTop: '5px'
            }}
          >
            General
          </div>

          {/* Debug Mode */}
          <label
            htmlFor="setting-debug"
            style={{
              fontSize: '12px',
              color: '#ddd',
              cursor: 'pointer'
            }}
          >
            Debug Mode
          </label>
          <div>
            <input
              type="checkbox"
              id="setting-debug"
              checked={settings.debug}
              onChange={handleCheckboxChange('debug')}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Auto Launch Workers */}
          <label
            htmlFor="setting-auto-launch"
            style={{
              fontSize: '12px',
              color: '#ddd',
              cursor: 'pointer'
            }}
          >
            Auto-launch Workers
          </label>
          <div>
            <input
              type="checkbox"
              id="setting-auto-launch"
              checked={settings.auto_launch_workers}
              onChange={handleCheckboxChange('auto_launch_workers')}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Stop Local Workers on Master Exit */}
          <label
            htmlFor="setting-stop-on-exit"
            style={{
              fontSize: '12px',
              color: '#ddd',
              cursor: 'pointer'
            }}
          >
            Stop Local Workers on Master Exit
          </label>
          <div>
            <input
              type="checkbox"
              id="setting-stop-on-exit"
              checked={settings.stop_workers_on_master_exit}
              onChange={handleCheckboxChange('stop_workers_on_master_exit')}
              style={{ cursor: 'pointer' }}
            />
          </div>

          {/* Timeouts Section */}
          <div
            style={{
              gridColumn: '1 / -1',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#fff',
              marginTop: '10px'
            }}
          >
            Timeouts
          </div>

          {/* Worker Timeout */}
          <label
            htmlFor="setting-timeout"
            style={{
              fontSize: '12px',
              color: '#ddd',
              cursor: 'pointer'
            }}
          >
            Worker Timeout (seconds)
          </label>
          <div>
            <input
              type="number"
              id="setting-timeout"
              min="10"
              step="1"
              value={settings.worker_timeout_seconds}
              onChange={handleTimeoutChange}
              style={{
                width: '80px',
                padding: '2px 6px',
                background: '#222',
                color: '#ddd',
                border: '1px solid #333',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
