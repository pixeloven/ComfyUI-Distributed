// Mock implementation of WorkerManagementPanel for testing
import React from 'react'

export function WorkerManagementPanel() {
  console.log('Mock WorkerManagementPanel called')
  return React.createElement('div', { 'data-testid': 'worker-management-panel' }, 'Worker Management Panel')
}