import { BUTTON_STYLES, STATUS_COLORS, TIMEOUTS } from '../../utils/constants';

describe('Constants', () => {
  describe('BUTTON_STYLES', () => {
    test('should have base style', () => {
      expect(BUTTON_STYLES.base).toContain('width: 100%');
      expect(BUTTON_STYLES.base).toContain('padding: 4px 14px');
    });

    test('should have color variants', () => {
      expect(BUTTON_STYLES.success).toContain('#4a7c4a');
      expect(BUTTON_STYLES.error).toContain('#7c4a4a');
    });
  });

  describe('STATUS_COLORS', () => {
    test('should have all status colors defined', () => {
      expect(STATUS_COLORS.ONLINE_GREEN).toBe('#3ca03c');
      expect(STATUS_COLORS.OFFLINE_RED).toBe('#c04c4c');
      expect(STATUS_COLORS.PROCESSING_YELLOW).toBe('#f0ad4e');
      expect(STATUS_COLORS.DISABLED_GRAY).toBe('#666');
    });
  });

  describe('TIMEOUTS', () => {
    test('should have reasonable timeout values', () => {
      expect(TIMEOUTS.DEFAULT_FETCH).toBe(5000);
      expect(TIMEOUTS.STATUS_CHECK).toBe(1200);
      expect(TIMEOUTS.LAUNCH).toBe(90000);
    });
  });
});
