import { STATUS_COLORS } from '@/utils/constants';
import { StatusDotProps, WorkerStatus } from '@/types/worker';

const getStatusColor = (status: WorkerStatus): string => {
  switch (status) {
    case 'online':
      return STATUS_COLORS.ONLINE_GREEN;
    case 'offline':
      return STATUS_COLORS.OFFLINE_RED;
    case 'processing':
      return STATUS_COLORS.PROCESSING_YELLOW;
    case 'disabled':
      return STATUS_COLORS.DISABLED_GRAY;
    default:
      return STATUS_COLORS.DISABLED_GRAY;
  }
};

const getStatusTitle = (status: WorkerStatus): string => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'processing':
      return 'Processing';
    case 'disabled':
      return 'Disabled';
    default:
      return 'Unknown';
  }
};

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  isPulsing = false,
  size = 10
}) => {
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
        flexShrink: 0
      }}
      className={isPulsing ? 'status-pulsing' : ''}
      title={title}
    />
  );
};