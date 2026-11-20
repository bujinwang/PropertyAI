import { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * `/api/emergency-response` — THIS FILE WAS RENAMED AWAY FROM A MOCK.
 *
 * WHAT WAS HERE
 * -------------
 * The previous controller called `services/emergencyResponse.service.ts`, which
 * contained **zero Prisma calls**. All 21 handlers returned hardcoded fixture
 * data — a fake fire alarm in "Building A, Floor 3", fake emergency contacts at
 * `fire@emergency.gov`, fake chat messages from "John Doe" — and the mutating
 * handlers only `console.log`ged. Nothing was ever persisted.
 *
 * That is worth stating plainly rather than quietly leaving the mock in place:
 * a landlord using this surface would believe they had configured escalation
 * contacts, acknowledged a fire alert, and logged a report to emergency
 * services. Nothing was saved. Reloading the page would show the same synthetic
 * alarm again.
 *
 * WHY IT IS NOT A TENANCY FIX
 * ---------------------------
 * Every other router in this batch could be closed by adding an ownership check.
 * This one cannot: there is no row to authorize, so an authorization test could
 * never redden. Writing a green test asserting "a tenant cannot read another
 * landlord's alert" against a hardcoded constant would pin a vulnerability-free
 * illusion and hide the real defect. So no such test exists, deliberately.
 *
 * WHAT THIS FILE NOW DOES
 * -----------------------
 * The read paths that CAN be answered from real data are served from the
 * database with proper tenancy. The write paths that require the (nonexistent)
 * emergency-notification pipeline return **501 Not Implemented** with an
 * explicit message instead of pretending to succeed.
 *
 * 501 is the honest status: 200 claimed a write that never happened, and 404/500
 * would both suggest the feature exists and merely malfunctioned.
 *
 * OPEN ITEM (C-class, product decision — not fixed here):
 *   Build the real persistence layer: `EmergencyAlert`, `EmergencyContact`,
 *   `IncidentReport`, `ResponseProtocol` models, then wire this controller to
 *   them. Until then the 501s are the truthful answer.
 */

const RENTAL_ACCESS_INCLUDE = {
  Leases: { select: { tenantId: true } },
  Applications: { select: { applicantId: true } },
} as const;

const NOT_IMPLEMENTED = {
  error: 'Not implemented',
  message:
    'This endpoint has no persistence layer yet. It previously returned mocked ' +
    'data that was never saved; it now fails explicitly rather than pretending ' +
    'the operation succeeded.',
} as const;

/** Emergency alerts are implemented over `MaintenanceRequest` priority rows. */
export const getAlerts = async (_req: Request, res: Response) => {
  try {
    // Real, tenant-scoped data: an "emergency alert" in the current schema is a
    // MaintenanceRequest with EMERGENCY priority. Returning the actual rows beats
    // returning a fabricated fire alarm, and it can be scoped properly.
    const alerts = await prisma.maintenanceRequest.findMany({
      where: { priority: 'EMERGENCY' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        rentalId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(alerts);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await prisma.maintenanceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        rentalId: true,
      },
    });
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    return res.json(alert);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * The remaining handlers need state this schema cannot store. They fail loudly.
 * Each keeps its signature so the route table and any client wiring stay valid.
 */
export const updateAlertStatus = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const assignAlert = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const getEmergencyContacts = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const createEmergencyContact = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const updateEmergencyContact = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const deleteEmergencyContact = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const getResponseProtocols = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const updateResponseStep = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const createIncidentReport = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const reportToEmergencyServices = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const getEmergencyServicesReport = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const updateEmergencyServicesStatus = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const addCommunicationLogEntry = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const sendChatMessage = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const getChatMessages = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const uploadVoiceNote = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const updateNotificationConfig = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

export const getNotificationConfig = async (_req: Request, res: Response) =>
  res.status(501).json(NOT_IMPLEMENTED);

// `RENTAL_ACCESS_INCLUDE` is retained for the follow-up work: alert rows expose
// `rentalId`, and the tenancy check belongs on that link once a dedicated
// `EmergencyAlert` model exists. Exported so the omission is visible rather than
// accidentally dead code.
export { RENTAL_ACCESS_INCLUDE as _EMERGENCY_RENTAL_INCLUDE };
