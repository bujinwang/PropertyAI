"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulingService = void 0;
const database_1 = require("../config/database");
const googleapis_1 = require("googleapis");
class SchedulingService {
    constructor() {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            // your credentials here
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        this.calendar = googleapis_1.google.calendar({ version: 'v3', auth });
    }
    async scheduleEvent(workOrderId) {
        const workOrder = await database_1.prisma.workOrder.findUnique({
            where: { id: workOrderId },
        });
        if (workOrder) {
            const event = {
                summary: workOrder.title,
                description: workOrder.description,
                start: {
                    dateTime: new Date().toISOString(),
                    timeZone: 'America/Los_Angeles',
                },
                end: {
                    dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
                    timeZone: 'America/Los_Angeles',
                },
            };
            // This is a placeholder for the actual Google Calendar API call.
            // const createdEvent = await this.calendar.events.insert({
            //   calendarId: 'primary',
            //   resource: event,
            // });
            const scheduledEvent = await database_1.prisma.scheduledEvent.create({
                data: {
                    workOrderId,
                    startTime: new Date(event.start.dateTime),
                    endTime: new Date(event.end.dateTime),
                    // googleCalendarEventId: createdEvent.data.id,
                },
            });
            return scheduledEvent;
        }
        return null;
    }
}
exports.schedulingService = new SchedulingService();
//# sourceMappingURL=scheduling.service.js.map