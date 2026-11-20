import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import ManualReviewService from '../services/manualReviewService';
import { prisma } from '../config/database';
import { canModifyApplication, currentUserRole } from '../utils/rentalAccess';

/**
 * Manual review of rental applications.
 *
 * WHY THE CHECKS ARE HERE AND NOT ON THE ROUTER
 * ---------------------------------------------
 * This router previously had NO middleware of its own. It only *looked*
 * protected because `app.use('/api', requireAuth)` authenticates everything
 * before the route barrel runs — so an anonymous caller got 401 and nobody
 * noticed that an authenticated TENANT could call
 * `PUT /api/manual-review/:id/approve` on their own application and be approved.
 * Authentication is not authorization.
 *
 * `checkRole([...])` on the router would NOT have been enough either: the real
 * question is "does this caller control the rental this application is for?",
 * which needs the fetched row. So the decision lives in the single policy module
 * (`utils/rentalAccess.canModifyApplication`) and the router stays free of
 * authorization logic.
 *
 * That helper is deliberately narrower than its read counterpart: it requires an
 * operator role (ADMIN / PROPERTY_MANAGER / OWNER) AND ownership of the parent
 * rental. A resident may read their own application but can never decide it —
 * which is the entire point of a review queue.
 */

const APPLICATION_OWNERSHIP_INCLUDE = {
  Rental: { select: { managerId: true, ownerId: true, createdById: true } },
} as const;

/** Roles that may see the review queue at all. Matches the write policy above. */
const REVIEWER_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.PROPERTY_MANAGER,
  UserRole.OWNER,
];

class ManualReviewController {
  async getApplicationsForReview(req: Request, res: Response) {
    try {
      // The queue is an operator tool. A row filter would be wrong here: there
      // is no meaningful "your own pending queue" for a resident, and returning
      // an empty list would hide the fact that they have no business asking.
      const role = currentUserRole(req) as UserRole | undefined;
      if (!role || !REVIEWER_ROLES.includes(role)) {
        return res
          .status(403)
          .json({ error: 'You do not have access to the review queue' });
      }

      const applications = await ManualReviewService.getApplicationsForReview();
      res.status(200).json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async approveApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const application = await prisma.application.findUnique({
        where: { id },
        include: APPLICATION_OWNERSHIP_INCLUDE,
      });

      // Existence before access, so a legitimate operator who mistypes an id
      // gets a truthful 404 rather than a misleading 403.
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (!canModifyApplication(req, application)) {
        return res
          .status(403)
          .json({ error: 'You do not have access to this application' });
      }

      const approved = await ManualReviewService.approveApplication(id);
      res.status(200).json(approved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async rejectApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const application = await prisma.application.findUnique({
        where: { id },
        include: APPLICATION_OWNERSHIP_INCLUDE,
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (!canModifyApplication(req, application)) {
        return res
          .status(403)
          .json({ error: 'You do not have access to this application' });
      }

      const rejected = await ManualReviewService.rejectApplication(id);
      res.status(200).json(rejected);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ManualReviewController();
