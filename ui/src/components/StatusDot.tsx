import { STATUS_COLORS } from '@/utils/constants';
import { StatusDotProps, WorkerStatus } from '@/types/worker';

const getStatusColor = (status: WorkerStatus): string => {
  switch (status) {
    case WorkerStatus.ONLINE:
      return STATUS_COLORS.ONLINE_GREEN;
    case WorkerStatus.OFFLINE:
      return STATUS_COLORS.OFFLINE_RED;
    case WorkerStatus.PROCESSING:
      return STATUS_COLORS.PROCESSING_YELLOW;
    case WorkerStatus.DISABLED:
      return STATUS_COLORS.DISABLED_GRAY;
    default:
      return STATUS_COLORS.DISABLED_GRAY;
  }
};

const getStatusTitle = (status: WorkerStatus): string => {
  switch (status) {
    case WorkerStatus.ONLINE:
      return 'Online';
    case WorkerStatus.OFFLINE:
      return 'Offline';
    case WorkerStatus.PROCESSING:
      return 'Processing';
    case WorkerStatus.DISABLED:
      return 'Disabled';
    default:
      return 'Unknown';
  }
};

export const StatusDot: React.FC<StatusDotProps> = ({ status, isPulsing = false, size = 10 }) => {
  const color = getStatusColor(status);
  const title = getStatusTitle(status);

  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: '10px',
        flexShrink: 0,
      }}
      className={isPulsing ? 'status-pulsing' : ''}
      title={title}
    />
  );
};
