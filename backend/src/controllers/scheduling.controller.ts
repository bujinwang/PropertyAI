import { Request, Response } from 'express';
import { schedulingService } from '../services/scheduling.service';

class SchedulingController {
  public async scheduleEvent(req: Request, res: Response): Promise<void> {
    try {
      const { workOrderId } = req.params;
      const scheduledEvent = await schedulingService.scheduleEvent(workOrderId);
      if (scheduledEvent) {
        res.status(201).json(scheduledEvent);
      } else {
        res.status(404).json({ message: 'Could not schedule event.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error scheduling event.', error });
    }
  }
}

export const schedulingController = new SchedulingController();
