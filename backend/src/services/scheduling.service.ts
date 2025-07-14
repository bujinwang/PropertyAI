import { prisma } from '../config/database';
import { WorkOrder, ScheduledEvent } from '@prisma/client';
import { google } from 'googleapis';

class SchedulingService {
  private calendar;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      // your credentials here
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  public async scheduleEvent(workOrderId: string): Promise<ScheduledEvent | null> {
    const workOrder = await prisma.workOrder.findUnique({
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

      const scheduledEvent = await prisma.scheduledEvent.create({
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

export const schedulingService = new SchedulingService();
