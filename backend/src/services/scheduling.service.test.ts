import { schedulingService } from './scheduling.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
  prisma: {
    workOrder: {
      findUnique: jest.fn(),
    },
    scheduledEvent: {
      create: jest.fn(),
    },
  },
}));

jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn(() => ({})),
    },
    calendar: jest.fn(() => ({
      events: {
        insert: jest.fn(),
      },
    })),
  },
}));

describe('SchedulingService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should schedule an event', async () => {
    const mockWorkOrder = {
      id: 'work-order-1',
      title: 'Test Work Order',
      description: 'Test Description',
    };
    const mockScheduledEvent = {
      id: '1',
      workOrderId: 'work-order-1',
      startTime: new Date(),
      endTime: new Date(),
    };
    (prisma.workOrder.findUnique as jest.Mock).mockResolvedValue(mockWorkOrder);
    (prisma.scheduledEvent.create as jest.Mock).mockResolvedValue(mockScheduledEvent);

    const scheduledEvent = await schedulingService.scheduleEvent('work-order-1');
    expect(scheduledEvent).toEqual(mockScheduledEvent);
  });
});
