import { render, screen } from '@testing-library/react';
import App from '../../App';

// Mock the child components
jest.mock('../../components/WorkerManagementPanel', () => {
  return function WorkerManagementPanel() {
    return <div data-testid='worker-management-panel'>Worker Management Panel</div>;
  };
});

jest.mock('../../components/ConnectionInput', () => {
  return function ConnectionInput() {
    return <div data-testid='connection-input'>Connection Input</div>;
  };
});

jest.mock('../../components/ExecutionPanel', () => {
  return function ExecutionPanel() {
    return <div data-testid='execution-panel'>Execution Panel</div>;
  };
});

// Mock the API client
jest.mock('../../services/apiClient', () => ({
  createApiClient: jest.fn(() => ({
    getConfig: jest.fn().mockResolvedValue({ workers: {} }),
  })),
}));

describe('App Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders main components', () => {
    render(<App />);

    expect(screen.getByTestId('connection-input')).toBeInTheDocument();
    expect(screen.getByTestId('execution-panel')).toBeInTheDocument();
    expect(screen.getByTestId('worker-management-panel')).toBeInTheDocument();
  });

  test('has distributed-ui class', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toHaveClass('distributed-ui');
  });
});
