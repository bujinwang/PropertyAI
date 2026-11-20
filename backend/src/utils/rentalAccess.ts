import { Request } from 'express';
import { UserRole } from '@prisma/client';

/**
 * Access control for the `Rental` aggregate.
 *
 * WHY THIS IS IN THE CONTROLLER LAYER (not middleware)
 * ---------------------------------------------------
 * Deciding "may this user touch this rental?" requires the ROW: ownership is
 * `managerId` / `ownerId` / `createdById` on the rental itself. Route-level
 * middleware such as `checkRole` only sees the JWT and the URL, so it can gate
 * *roles* but can never answer "is this YOUR rental". Anything that needs the
 * row must therefore run after the fetch, in the handler.
 *
 * WHAT "VISIBLE" MEANS
 * --------------------
 *   ADMIN             -> every rental (platform operator)
 *   PROPERTY_MANAGER  -> rentals they manage, own, or created
 *   OWNER             -> rentals they own, manage, or created
 *   TENANT / USER     -> only rentals where they hold a Lease or an active
 *                        Application (a renter must be able to see their home
 *                        and the unit they applied for)
 *   VENDOR            -> none by default (vendors work through work orders)
 *
 * Writes are narrower than reads: only the operator roles above may create or
 * mutate. A tenant reading is normal; a tenant editing their landlord's rent is
 * not.
 *
 * A role that manages no rentals is not an error condition — it means "an empty
 * portfolio", so reads return an empty list and writes are forbidden. Do NOT
 * turn "no rows" into a 403 on the collection endpoints; that would leak
 * nothing but break every fresh account.
 */

const OPERATOR_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.PROPERTY_MANAGER,
  UserRole.OWNER,
];

/** Roles that may read a rental only through a Lease / Application relationship. */
const RESIDENT_ROLES: readonly UserRole[] = [UserRole.TENANT, UserRole.USER];

/** The authenticated user, as hydrated by requireAuth / authMiddleware.protect. */
export type AuthUser = { id?: string; role?: UserRole | string } | undefined;

export function currentUser(req: Request): AuthUser {
  return req.user as unknown as AuthUser;
}

export function currentUserId(req: Request): string | undefined {
  return currentUser(req)?.id;
}

export function currentUserRole(req: Request): UserRole | string | undefined {
  return currentUser(req)?.role;
}

export function isAdmin(req: Request): boolean {
  return currentUserRole(req) === UserRole.ADMIN;
}

/**
 * True when the user holds an OPERATOR role (ADMIN / PROPERTY_MANAGER / OWNER).
 *
 * Exported because it is also the correct gate for GLOBAL collections that have
 * no tenancy path at all (e.g. AI-generated marketing copy, whose `createdBy` is
 * a bare string with no `Rental` hop). Those surfaces have no row to compare
 * against a caller, so "who may write this kind of record" is a pure role
 * question — but it must still be asked from THIS module, so the definition of
 * "operator" cannot drift between the rental surfaces and the global ones.
 */
export function isOperator(req: Request): boolean {
  const role = currentUserRole(req) as UserRole | undefined;
  return !!role && OPERATOR_ROLES.includes(role);
}

/** True when the user may WRITE rentals at all. Residents and vendors cannot. */
export function canWriteRentals(req: Request): boolean {
  return isOperator(req);
}

/** True when the user may READ rentals through a Lease/Application link. */
function isResident(req: Request): boolean {
  const role = currentUserRole(req) as UserRole | undefined;
  return !!role && RESIDENT_ROLES.includes(role);
}

/**
 * The Prisma `where` fragment that limits a collection query to the caller's
 * own rows. `undefined` means "unrestricted" (ADMIN).
 */
export function rentalScopeFilter(req: Request): Record<string, unknown> | undefined {
  if (isAdmin(req)) return undefined;

  const userId = currentUserId(req);
  if (!userId) return { id: '__no_user__' };

  if (canWriteRentals(req)) {
    return {
      OR: [{ managerId: userId }, { ownerId: userId }, { createdById: userId }],
    };
  }

  if (isResident(req)) {
    // Leases tie a renter to a rental. Applications cover the "I applied but no
    // lease yet" window so a prospective tenant can follow their own request.
    return {
      OR: [
        { Leases: { some: { tenantId: userId } } },
        { Applications: { some: { applicantId: userId } } },
      ],
    };
  }

  return { id: '__no_access__' };
}

/**
 * Row-level check for READS. `rental` is the fetched row; owners match on the
 * three ownership ids, residents match on an attached Lease/Application.
 *
 * The lease/application relations must be present on the fetched row for the
 * resident branch to work — pass an argument `include` when the caller is not
 * an operator, or use `canAccessRentalWithResidency` after an explicit fetch.
 */
export function canAccessRental(req: Request, rental: unknown): boolean {
  if (isAdmin(req)) return true;
  if (!rental || typeof rental !== 'object') return false;

  const userId = currentUserId(req);
  if (!userId) return false;

  const row = rental as {
    managerId?: string;
    ownerId?: string;
    createdById?: string;
    Leases?: Array<{ tenantId?: string }>;
    Applications?: Array<{ applicantId?: string }>;
  };

  if (canWriteRentals(req)) {
    return row.managerId === userId || row.ownerId === userId || row.createdById === userId;
  }

  if (isResident(req)) {
    const hasLease = Array.isArray(row.Leases) && row.Leases.some((l) => l.tenantId === userId);
    const hasApplication =
      Array.isArray(row.Applications) && row.Applications.some((a) => a.applicantId === userId);
    return hasLease || hasApplication;
  }

  return false;
}

/**
 * Row-level check for WRITES. Strictly narrower than `canAccessRental`: a
 * resident can read the home they lease but must never be able to mutate it
 * (rent, availability, address). Using the read check on a mutation path is the
 * bug this function exists to prevent — it made `PUT /api/rentals/:id` return
 * 200 to the tenant living in the unit.
 */
export function canModifyRental(req: Request, rental: unknown): boolean {
  if (!rental || typeof rental !== 'object') return false;
  // Residents and vendors are not operators, regardless of the row.
  if (!canWriteRentals(req)) return false;
  return canAccessRental(req, rental);
}

/* ------------------------------------------------------------------------- *
 * Lease + Transaction
 *
 * Both aggregates are ONE HOP from `Rental`, so their tenancy is the rental
 * policy rather than a new rule:
 *
 *   Lease       -> belongs to the rental in `Lease.rentalId`
 *   Transaction -> belongs to the lease in `Transaction.leaseId`
 *
 * They live here (not in each controller) so there is exactly one place where
 * "who may see this" is decided. A second copy of the rule is how the two
 * surfaces drift apart.
 *
 * Residents are treated slightly differently from `rentalScopeFilter`: a tenant
 * sees a lease because `Lease.tenantId` is THEM, and their transactions because
 * the lease is theirs. They do NOT get rows of a rental they merely applied for
 * — an application is not a tenancy, and financial records are not part of the
 * application relationship.
 * ------------------------------------------------------------------------- */

/** The `Rental` fields that decide ownership, as seen through a relation. */
type RentalOwnership = {
  managerId?: string;
  ownerId?: string;
  createdById?: string;
};

function ownsRentalRow(req: Request, rental: RentalOwnership | undefined | null): boolean {
  if (!rental || typeof rental !== 'object') return false;
  const userId = currentUserId(req);
  if (!userId || !canWriteRentals(req)) return false;
  return (
    rental.managerId === userId ||
    rental.ownerId === userId ||
    rental.createdById === userId
  );
}

/** Prisma `where` fragment limiting `Lease` rows to the caller's own. */
export function leaseScopeFilter(req: Request): Record<string, unknown> | undefined {
  if (isAdmin(req)) return undefined;

  const userId = currentUserId(req);
  if (!userId) return { id: '__no_user__' };

  if (canWriteRentals(req)) {
    return {
      Rental: {
        OR: [{ managerId: userId }, { ownerId: userId }, { createdById: userId }],
      },
    };
  }

  if (isResident(req)) {
    return { tenantId: userId };
  }

  return { id: '__no_access__' };
}

/**
 * Row-level READ check for a lease. `lease` must carry `Rental` ownership ids
 * (or `tenantId`) for the branch in question — pass an `include` when the
 * caller is not an ADMIN.
 */
export function canAccessLease(req: Request, lease: unknown): boolean {
  if (isAdmin(req)) return true;
  if (!lease || typeof lease !== 'object') return false;

  const userId = currentUserId(req);
  if (!userId) return false;

  const row = lease as { tenantId?: string; Rental?: RentalOwnership };

  if (canWriteRentals(req)) {
    return ownsRentalRow(req, row.Rental);
  }

  if (isResident(req)) {
    return row.tenantId === userId;
  }

  return false;
}

/** Row-level WRITE check for a lease. Residents never pass. */
export function canModifyLease(req: Request, lease: unknown): boolean {
  if (!lease || typeof lease !== 'object') return false;
  if (!canWriteRentals(req)) return false;
  return canAccessLease(req, lease);
}

/** Prisma `where` fragment limiting `Transaction` rows to the caller's own. */
export function transactionScopeFilter(req: Request): Record<string, unknown> | undefined {
  if (isAdmin(req)) return undefined;

  const userId = currentUserId(req);
  if (!userId) return { id: '__no_user__' };

  if (canWriteRentals(req)) {
    return {
      Lease: {
        Rental: {
          OR: [{ managerId: userId }, { ownerId: userId }, { createdById: userId }],
        },
      },
    };
  }

  if (isResident(req)) {
    return { Lease: { tenantId: userId } };
  }

  return { id: '__no_access__' };
}

/** Row-level READ check for a transaction; needs `Lease.Rental` ownership ids. */
export function canAccessTransaction(req: Request, transaction: unknown): boolean {
  if (isAdmin(req)) return true;
  if (!transaction || typeof transaction !== 'object') return false;

  const userId = currentUserId(req);
  if (!userId) return false;

  const row = transaction as {
    Lease?: { tenantId?: string; Rental?: RentalOwnership };
  };
  const lease = row.Lease;
  if (!lease) return false;

  if (canWriteRentals(req)) {
    return ownsRentalRow(req, lease.Rental);
  }

  if (isResident(req)) {
    return lease.tenantId === userId;
  }

  return false;
}

/** Row-level WRITE check for a transaction. Residents never pass. */
export function canModifyTransaction(req: Request, transaction: unknown): boolean {
  if (!transaction || typeof transaction !== 'object') return false;
  if (!canWriteRentals(req)) return false;
  return canAccessTransaction(req, transaction);
}

/* ------------------------------------------------------------------------- *
 * Application + MaintenanceRequest
 *
 * Both also hang off `Rental` (`rentalId`), but unlike leases and transactions
 * a RESIDENT has a legitimate direct relationship to the row:
 *
 *   Application        -> `applicantId` is the person applying
 *   MaintenanceRequest -> `requestedById` is the person reporting the fault
 *
 * So the read rule is: operators see rows under rentals they own; a resident
 * sees the rows that name them. Writes stay operator-only, with one deliberate
 * exception handled in the controller (a resident may CREATE a maintenance
 * request for the home they lease) — that is a self-service action, not a
 * mutation of existing data.
 * ------------------------------------------------------------------------- */

/** Prisma `where` limiting `Application` rows to the caller's own. */
export function applicationScopeFilter(req: Request): Record<string, unknown> | undefined {
  if (isAdmin(req)) return undefined;

  const userId = currentUserId(req);
  if (!userId) return { id: '__no_user__' };

  if (canWriteRentals(req)) {
    return {
      Rental: {
        OR: [{ managerId: userId }, { ownerId: userId }, { createdById: userId }],
      },
    };
  }

  if (isResident(req)) {
    return { applicantId: userId };
  }

  return { id: '__no_access__' };
}

/**
 * Row-level READ check for an application. Needs `applicantId` and, for
 * operators, `Rental` ownership ids.
 */
export function canAccessApplication(req: Request, application: unknown): boolean {
  if (isAdmin(req)) return true;
  if (!application || typeof application !== 'object') return false;

  const userId = currentUserId(req);
  if (!userId) return false;

  const row = application as { applicantId?: string; Rental?: RentalOwnership };

  if (canWriteRentals(req)) {
    return ownsRentalRow(req, row.Rental);
  }

  if (isResident(req)) {
    return row.applicantId === userId;
  }

  return false;
}

/** Row-level WRITE check for an application. Residents never pass. */
export function canModifyApplication(req: Request, application: unknown): boolean {
  if (!application || typeof application !== 'object') return false;
  if (!canWriteRentals(req)) return false;
  return canAccessApplication(req, application);
}

/** Prisma `where` limiting `MaintenanceRequest` rows to the caller's own. */
export function maintenanceScopeFilter(req: Request): Record<string, unknown> | undefined {
  if (isAdmin(req)) return undefined;

  const userId = currentUserId(req);
  if (!userId) return { id: '__no_user__' };

  if (canWriteRentals(req)) {
    return {
      Rental: {
        OR: [{ managerId: userId }, { ownerId: userId }, { createdById: userId }],
      },
    };
  }

  if (isResident(req)) {
    return { requestedById: userId };
  }

  return { id: '__no_access__' };
}

/** Row-level READ check for a maintenance request. */
export function canAccessMaintenanceRequest(req: Request, request_: unknown): boolean {
  if (isAdmin(req)) return true;
  if (!request_ || typeof request_ !== 'object') return false;

  const userId = currentUserId(req);
  if (!userId) return false;

  const row = request_ as { requestedById?: string; Rental?: RentalOwnership };

  if (canWriteRentals(req)) {
    return ownsRentalRow(req, row.Rental);
  }

  if (isResident(req)) {
    return row.requestedById === userId;
  }

  return false;
}

/** Row-level WRITE check for a maintenance request. Residents never pass. */
export function canModifyMaintenanceRequest(req: Request, request_: unknown): boolean {
  if (!request_ || typeof request_ !== 'object') return false;
  if (!canWriteRentals(req)) return false;
  return canAccessMaintenanceRequest(req, request_);
}

/* ------------------------------------------------------------------------- *
 * Message
 *
 * `Message` is the one aggregate in this file whose tenancy is NOT a direct
 * foreign key. It has no `rentalId`; the only path to a property is
 *
 *   Message -> MaintenanceRequest -> Rental
 *
 * and `Message.maintenanceRequestId` is NULLABLE. A message with no
 * maintenance request (a general conversation between two people) therefore has
 * NO resolvable property at all. That is a policy decision, not an oversight,
 * and it is made here so the analytics surface cannot silently disagree with
 * the messaging surface later:
 *
 *   operators (ADMIN/PM/OWNER)  see messages attached to their rentals, and
 *                               NOTHING else — an unattached message is not
 *                               property analytics and carries no landlord
 *   residents (TENANT/USER)     see the messages they sent or received — a
 *                               person may read their own correspondence even
 *                               when it concerns no property
 *
 * The asymmetry is deliberate. It is the difference between "who owns this
 * record" (needs a property) and "who is party to this conversation" (does not).
 * ------------------------------------------------------------------------- */

/** Prisma `where` limiting `Message` rows to the caller's own. */
export function messageScopeFilter(req: Request): Record<string, unknown> | undefined {
  if (isAdmin(req)) return undefined;

  const userId = currentUserId(req);
  if (!userId) return { id: '__no_user__' };

  if (canWriteRentals(req)) {
    // `MaintenanceRequest: { Rental: ... }` is a to-one relation filter, so it
    // also excludes rows whose `maintenanceRequestId` is null. That exclusion is
    // the point: an unattached message belongs to no portfolio.
    return {
      MaintenanceRequest: {
        Rental: {
          OR: [{ managerId: userId }, { ownerId: userId }, { createdById: userId }],
        },
      },
    };
  }

  if (isResident(req)) {
    return { OR: [{ senderId: userId }, { receiverId: userId }] };
  }

  return { id: '__no_access__' };
}

/**
 * Row-level READ check for a message. Needs `MaintenanceRequest.Rental`
 * ownership ids for operators; `senderId`/`receiverId` for residents.
 */
export function canAccessMessage(req: Request, message: unknown): boolean {
  if (isAdmin(req)) return true;
  if (!message || typeof message !== 'object') return false;

  const userId = currentUserId(req);
  if (!userId) return false;

  const row = message as {
    senderId?: string;
    receiverId?: string;
    MaintenanceRequest?: { Rental?: RentalOwnership } | null;
  };

  if (canWriteRentals(req)) {
    return ownsRentalRow(req, row.MaintenanceRequest?.Rental);
  }

  if (isResident(req)) {
    return row.senderId === userId || row.receiverId === userId;
  }

  return false;
}
