/**
 * Quota Monitor Service Tests
 * Tests for cloud storage quota monitoring functionality
 */

import {
  QuotaMonitorService,
  DEFAULT_QUOTA_CONFIG,
  QuotaStatus,
  QuotaNotification,
} from '../quotaMonitor';
import { CloudStorageService } from '../cloudStorage';
import { User } from 'firebase/auth';

// Mock CloudStorageService
const mockCloudStorage = {
  listCloudSaves: jest.fn(),
} as unknown as CloudStorageService;

// Mock user
const mockUser = {
  uid: 'test-user-123',
} as User;

describe('QuotaMonitorService', () => {
  let quotaService: QuotaMonitorService;
  let mockEventHandlers: any;

  beforeEach(() => {
    mockEventHandlers = {
      onQuotaWarning: jest.fn(),
      onQuotaCritical: jest.fn(),
      onQuotaExceeded: jest.fn(),
      onCleanupPerformed: jest.fn(),
      onNotification: jest.fn(),
    };

    quotaService = new QuotaMonitorService(
      mockCloudStorage,
      {
        maxStorageBytes: 1000, // 1KB for testing
        warningThreshold: 75,
        criticalThreshold: 90,
      },
      mockEventHandlers
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    quotaService.stopMonitoring();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const service = new QuotaMonitorService(mockCloudStorage);
      const config = service.getConfig();

      expect(config.maxStorageBytes).toBe(DEFAULT_QUOTA_CONFIG.maxStorageBytes);
      expect(config.warningThreshold).toBe(DEFAULT_QUOTA_CONFIG.warningThreshold);
    });

    it('should merge custom configuration', () => {
      const service = new QuotaMonitorService(mockCloudStorage, {
        maxStorageBytes: 2000,
        warningThreshold: 80,
      });

      const config = service.getConfig();
      expect(config.maxStorageBytes).toBe(2000);
      expect(config.warningThreshold).toBe(80);
      expect(config.criticalThreshold).toBe(DEFAULT_QUOTA_CONFIG.criticalThreshold);
    });

    it('should allow configuration updates', () => {
      quotaService.updateConfig({ warningThreshold: 85 });
      const config = quotaService.getConfig();

      expect(config.warningThreshold).toBe(85);
    });
  });

  describe('Quota Status Calculation', () => {
    it('should calculate normal status', async () => {
      // Mock 500 bytes usage (50% of 1000 byte limit)
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test Save',
            compressedSize: 500,
            dataSize: 600,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const status = await quotaService.checkQuota(mockUser);

      expect(status.status).toBe('normal');
      expect(status.usagePercentage).toBe(50);
      expect(status.usedBytes).toBe(500);
      expect(status.availableBytes).toBe(500);
    });

    it('should calculate warning status', async () => {
      // Mock 800 bytes usage (80% of 1000 byte limit)
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Large Save',
            compressedSize: 800,
            dataSize: 900,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const status = await quotaService.checkQuota(mockUser);

      expect(status.status).toBe('warning');
      expect(status.usagePercentage).toBe(80);
      expect(mockEventHandlers.onQuotaWarning).toHaveBeenCalledWith(status);
    });

    it('should calculate critical status', async () => {
      // Mock 950 bytes usage (95% of 1000 byte limit)
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Critical Save',
            compressedSize: 950,
            dataSize: 1000,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const status = await quotaService.checkQuota(mockUser);

      expect(status.status).toBe('critical');
      expect(status.usagePercentage).toBe(95);
      expect(mockEventHandlers.onQuotaCritical).toHaveBeenCalledWith(status);
    });

    it('should calculate exceeded status', async () => {
      // Mock 1200 bytes usage (120% of 1000 byte limit)
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Exceeded Save',
            compressedSize: 1200,
            dataSize: 1300,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const status = await quotaService.checkQuota(mockUser);

      expect(status.status).toBe('exceeded');
      expect(status.usagePercentage).toBe(120);
      expect(mockEventHandlers.onQuotaExceeded).toHaveBeenCalledWith(status);
    });
  });

  describe('Save Breakdown', () => {
    it('should provide detailed save breakdown', async () => {
      const mockSaves = [
        {
          slotNumber: 1,
          saveName: 'Save 1',
          compressedSize: 300,
          dataSize: 350,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
        {
          slotNumber: 2,
          saveName: 'Save 2',
          compressedSize: 200,
          dataSize: 250,
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-04'),
        },
      ];

      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSaves,
      });

      const status = await quotaService.checkQuota(mockUser);

      expect(status.saveBreakdown).toHaveLength(2);
      expect(status.saveBreakdown[0].slotNumber).toBe(1);
      expect(status.saveBreakdown[0].sizeBytes).toBe(300);
      expect(status.saveBreakdown[1].slotNumber).toBe(2);
      expect(status.saveBreakdown[1].sizeBytes).toBe(200);
      expect(status.totalSaves).toBe(2);
    });
  });

  describe('Notifications', () => {
    it('should create warning notification', async () => {
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 800,
            dataSize: 900,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);

      expect(mockEventHandlers.onNotification).toHaveBeenCalled();
      const notification: QuotaNotification = mockEventHandlers.onNotification.mock.calls[0][0];
      expect(notification.type).toBe('warning');
      expect(notification.title).toBe('Storage Warning');
      expect(notification.actions).toContainEqual(
        expect.objectContaining({ label: 'Manage Saves', action: 'manage' })
      );
    });

    it('should create exceeded notification with cleanup action', async () => {
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 1200,
            dataSize: 1300,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);

      expect(mockEventHandlers.onNotification).toHaveBeenCalled();
      const notification: QuotaNotification = mockEventHandlers.onNotification.mock.calls[0][0];
      expect(notification.type).toBe('exceeded');
      expect(notification.actions).toContainEqual(
        expect.objectContaining({ label: 'Clean Up Now', action: 'cleanup' })
      );
    });
  });

  describe('Notification Management', () => {
    it('should track notifications', async () => {
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 800,
            dataSize: 900,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);

      const notifications = quotaService.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].isRead).toBe(false);
    });

    it('should mark notifications as read', async () => {
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 800,
            dataSize: 900,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);

      const notifications = quotaService.getNotifications();
      const notificationId = notifications[0].id;

      quotaService.markNotificationRead(notificationId);

      const updatedNotifications = quotaService.getNotifications();
      expect(updatedNotifications[0].isRead).toBe(true);
    });

    it('should get unread notifications count', async () => {
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 800,
            dataSize: 900,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);

      const unreadNotifications = quotaService.getUnreadNotifications();
      expect(unreadNotifications).toHaveLength(1);

      quotaService.markAllNotificationsRead();

      const afterMarkAll = quotaService.getUnreadNotifications();
      expect(afterMarkAll).toHaveLength(0);
    });
  });

  describe('Monitoring Lifecycle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start and stop monitoring', () => {
      expect(quotaService['isMonitoring']).toBe(false);

      quotaService.startMonitoring(mockUser);
      expect(quotaService['isMonitoring']).toBe(true);

      quotaService.stopMonitoring();
      expect(quotaService['isMonitoring']).toBe(false);
    });

    it('should not start monitoring twice', () => {
      const spySetInterval = jest.spyOn(global, 'setInterval');

      quotaService.startMonitoring(mockUser);
      quotaService.startMonitoring(mockUser); // Second call should be ignored

      expect(spySetInterval).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle cloud storage errors gracefully', async () => {
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Network error' },
      });

      const status = await quotaService.checkQuota(mockUser);

      // Should return error status but not crash
      expect(status.usedBytes).toBe(0);
      expect(status.status).toBe('normal');
      expect(status.message).toBe('Unable to check storage usage');
    });

    it('should handle network exceptions', async () => {
      (mockCloudStorage.listCloudSaves as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      const status = await quotaService.checkQuota(mockUser);

      expect(status.usedBytes).toBe(0);
      expect(status.message).toBe('Unable to check storage usage');
    });
  });

  describe('Status Change Detection', () => {
    it('should detect status changes', async () => {
      // First check - normal status
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 400,
            dataSize: 500,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);

      // Clear any initial notifications (status initialization can trigger "normal" notification)
      jest.clearAllMocks();

      // Second check - warning status
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 800,
            dataSize: 900,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);
      expect(mockEventHandlers.onNotification).toHaveBeenCalled();
      expect(mockEventHandlers.onQuotaWarning).toHaveBeenCalled();
    });

    it('should not trigger notifications for small changes', async () => {
      // First check - 50% usage
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 500,
            dataSize: 600,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await quotaService.checkQuota(mockUser);

      // Second check - 52% usage (small change)
      (mockCloudStorage.listCloudSaves as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            slotNumber: 1,
            saveName: 'Test',
            compressedSize: 520,
            dataSize: 620,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      jest.clearAllMocks();
      await quotaService.checkQuota(mockUser);

      expect(mockEventHandlers.onNotification).not.toHaveBeenCalled();
    });
  });
});
