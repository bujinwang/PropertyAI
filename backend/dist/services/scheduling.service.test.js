"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scheduling_service_1 = require("./scheduling.service");
const database_1 = require("../config/database");
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
        database_1.prisma.workOrder.findUnique.mockResolvedValue(mockWorkOrder);
        database_1.prisma.scheduledEvent.create.mockResolvedValue(mockScheduledEvent);
        const scheduledEvent = await scheduling_service_1.schedulingService.scheduleEvent('work-order-1');
        expect(scheduledEvent).toEqual(mockScheduledEvent);
    });
});
//# sourceMappingURL=scheduling.service.test.js.map