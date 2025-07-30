import { Router, Request, Response } from 'express';
import { googleCalendarService } from '../services/googleCalendar.service';
import { authenticateToken } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';

const router = Router();

// Get Google Calendar authorization URL
router.get('/auth', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const authUrl = googleCalendarService.getAuthUrl(userId);
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generating Google Calendar auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
});

// Handle Google Calendar OAuth callback
router.get('/callback', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or state'
      });
    }

    const userId = state as string;
    
    if (userId !== (req as any).user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized user'
      });
    }

    await googleCalendarService.handleCallback(code as string, userId);
    
    res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?success=true`);
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=auth_failed`);
  }
});

// Check if Google Calendar is connected for user
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const isConnected = await googleCalendarService.isConnected(userId);
    
    res.json({
      success: true,
      connected: isConnected
    });
  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check connection status'
    });
  }
});

// Disconnect Google Calendar
router.post('/disconnect', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    await googleCalendarService.disconnectUser(userId);
    
    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Google Calendar'
    });
  }
});

// Get calendar events
router.get('/events', authenticateToken, [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { startDate, endDate } = req.query;
    
    const events = await googleCalendarService.getEvents(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json({
      success: true,
      events
    });
  } catch (error: any) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get calendar events'
    });
  }
});

// Create calendar event
router.post('/events', authenticateToken, [
  body('summary').isString().notEmpty(),
  body('description').optional().isString(),
  body('start').isISO8601().toDate(),
  body('end').isISO8601().toDate(),
  body('attendees').optional().isArray(),
  body('attendees.*.email').optional().isEmail(),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { summary, description, start, end, attendees } = req.body;
    
    const event: any = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: attendees || []
    };
    
    const eventId = await googleCalendarService.createEvent(userId, event);
    
    res.json({
      success: true,
      eventId
    });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create calendar event'
    });
  }
});

// Update calendar event
router.put('/events/:eventId', authenticateToken, [
  param('eventId').isString().notEmpty(),
  body('summary').optional().isString(),
  body('description').optional().isString(),
  body('start').optional().isISO8601().toDate(),
  body('end').optional().isISO8601().toDate(),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { eventId } = req.params;
    const updateData = req.body;
    
    await googleCalendarService.updateEvent(userId, eventId, updateData);
    
    res.json({
      success: true,
      message: 'Event updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update calendar event'
    });
  }
});

// Delete calendar event
router.delete('/events/:eventId', authenticateToken, [
  param('eventId').isString().notEmpty(),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { eventId } = req.params;
    
    await googleCalendarService.deleteEvent(userId, eventId);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete calendar event'
    });
  }
});

// Create maintenance event
router.post('/maintenance-events/:maintenanceRequestId', authenticateToken, [
  param('maintenanceRequestId').isString().notEmpty(),
  body('scheduledDate').isISO8601().toDate(),
  body('duration').isInt({ min: 15 }),
  body('attendees').optional().isArray(),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { maintenanceRequestId } = req.params;
    const { scheduledDate, duration, attendees } = req.body;
    
    // Get maintenance request details
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
      include: {
        property: true,
        unit: true
      }
    });

    if (!maintenanceRequest) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance request not found'
      });
    }

    const eventId = await googleCalendarService.createMaintenanceEvent(
      userId,
      maintenanceRequestId,
      {
        title: maintenanceRequest.title,
        description: `Maintenance request for ${maintenanceRequest.property.name} - Unit ${maintenanceRequest.unit.unitNumber}: ${maintenanceRequest.description}`,
        scheduledDate: new Date(scheduledDate),
        duration,
        attendees
      }
    );

    res.json({
      success: true,
      eventId,
      message: 'Maintenance event scheduled successfully'
    });
  } catch (error: any) {
    console.error('Error creating maintenance calendar event:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create maintenance calendar event'
    });
  }
});

export default router;