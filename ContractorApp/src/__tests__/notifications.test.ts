import { notificationService } from '../services/notifications';

/**
 * Unit tests for the pure logic in the notification service. Importing the
 * module also exercises its top-level `setNotificationHandler` call against the
 * mocked `expo-notifications` module, proving the service initialises cleanly.
 */
describe('notificationService.handleNotificationData', () => {
  it('routes a notification carrying a workOrderId to the detail screen', () => {
    const result = notificationService.handleNotificationData({ workOrderId: 'wo-123' });

    expect(result).toEqual({
      screen: 'WorkOrderDetail',
      params: { id: 'wo-123' },
    });
  });

  it('passes through an explicit screen and params', () => {
    const result = notificationService.handleNotificationData({
      screen: 'Messages',
      params: { conversationId: 'conv-1' },
    });

    expect(result).toEqual({
      screen: 'Messages',
      params: { conversationId: 'conv-1' },
    });
  });

  it('defaults params to an empty object when only a screen is provided', () => {
    const result = notificationService.handleNotificationData({ screen: 'Profile' });

    expect(result).toEqual({ screen: 'Profile', params: {} });
  });

  it('returns an empty route when there is nothing to navigate to', () => {
    expect(notificationService.handleNotificationData({})).toEqual({});
  });
});
