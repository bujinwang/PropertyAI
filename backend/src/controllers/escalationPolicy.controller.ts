import { Request, Response } from 'express';
import { prisma } from '../config/database';
import * as escalationPolicyService from '../services/escalationPolicy.service';
import {
  canAccessRental,
  canModifyRental,
  currentUserId,
} from '../utils/rentalAccess';

/**
 * `/api/escalation-policies` — escalation policies hang off `Rental.rentalId`.
 *
 * WHY THIS FILE WAS REWRITTEN
 * ---------------------------
 * Not one handler read `req.user`. The surface was authenticated (the global
 * `app.use('/api', requireAuth)` in app.ts runs first) and completely
 * unauthorized. Concretely, before this change any authenticated user could:
 *
 *   - `GET /properties/:propertyId/escalation-policies` — enumerate ANY
 *     landlord's policies, including the user assigned to each escalation step
 *     (an internal staff directory).
 *   - `POST /escalation-policies` — create a policy on ANY rental by passing its
 *     `rentalId` in the body.
 *   - `PUT /escalation-policies/:id` — rewrite ANY policy, including which user
 *     an escalation notifies.
 *   - `DELETE /escalation-policies/:id` — delete ANY policy, silently disabling
 *     a landlord's emergency escalation chain.
 *
 * The policy itself lives in `utils/rentalAccess.ts` — there is exactly one
 * place where "who may see this rental" is decided, and a second copy is how
 * these surfaces drift apart. `EscalationPolicy.rentalId` is one hop from
 * `Rental`, so this is the rental rule, not a new one.
 *
 * RESIDENTS MAY READ, NOT WRITE. A tenant living in the unit should be able to
 * see the escalation chain that applies to them; they must never be able to
 * rewrite who gets notified. That is why the reads use `canAccessRental` and
 * every mutation uses `canModifyRental`.
 */

/** The ownership columns + residency links needed to decide access. */
const RENTAL_ACCESS_INCLUDE = {
  Leases: { select: { tenantId: true } },
  Applications: { select: { applicantId: true } },
} as const;

/** Descriptive fields a caller may set. Deliberately excludes `rentalId`. */
const POLICY_WRITABLE = ['name', 'description'] as const;

/** Fields a caller may set on a rule. `policyId` is re-derived, never trusted. */
const RULE_WRITABLE = ['order', 'action', 'threshold', 'assignedToUserId'] as const;

function pickWritable(
  body: unknown,
  allowed: readonly string[]
): Record<string, unknown> {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of allowed) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
}

/**
 * Load a rental and decide READ access. Returns null and writes the response
 * when the caller may not proceed, so handlers stay flat.
 */
async function authorizeRentalRead(req: Request, res: Response, rentalId: string) {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: RENTAL_ACCESS_INCLUDE,
  });
  if (!rental) {
    res.status(404).json({ message: 'Property not found' });
    return null;
  }
  if (!canAccessRental(req, rental)) {
    res.status(403).json({ message: 'You do not have access to this property' });
    return null;
  }
  return rental;
}

/** Same, for writes: residents are excluded even though they may read. */
async function authorizeRentalWrite(req: Request, res: Response, rentalId: string) {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: RENTAL_ACCESS_INCLUDE,
  });
  if (!rental) {
    res.status(404).json({ message: 'Property not found' });
    return null;
  }
  if (!canModifyRental(req, rental)) {
    res.status(403).json({ message: 'You do not have access to this property' });
    return null;
  }
  return rental;
}

/**
 * Load a policy by id and authorize against the rental it belongs to.
 * Existence is checked BEFORE access so a legitimate operator who mistypes an
 * id gets a truthful 404 rather than a misleading 403.
 */
async function authorizePolicy(req: Request, res: Response, policyId: string, mode: 'read' | 'write') {
  const policy = await prisma.escalationPolicy.findUnique({
    where: { id: policyId },
    include: { Rental: { include: RENTAL_ACCESS_INCLUDE } },
  });
  if (!policy) {
    res.status(404).json({ message: 'Escalation policy not found' });
    return null;
  }
  const allowed =
    mode === 'read'
      ? canAccessRental(req, policy.Rental)
      : canModifyRental(req, policy.Rental);
  if (!allowed) {
    res.status(403).json({ message: 'You do not have access to this escalation policy' });
    return null;
  }
  return policy;
}

/** Load a rule and authorize through `rule.policyId -> policy.rentalId`. */
async function authorizeRule(req: Request, res: Response, ruleId: string, mode: 'read' | 'write') {
  const rule = await prisma.escalationPolicyRule.findUnique({
    where: { id: ruleId },
    include: {
      EscalationPolicy: { include: { Rental: { include: RENTAL_ACCESS_INCLUDE } } },
    },
  });
  if (!rule) {
    res.status(404).json({ message: 'Escalation policy rule not found' });
    return null;
  }
  const rental = rule.EscalationPolicy.Rental;
  const allowed = mode === 'read' ? canAccessRental(req, rental) : canModifyRental(req, rental);
  if (!allowed) {
    res.status(403).json({ message: 'You do not have access to this escalation policy' });
    return null;
  }
  return rule;
}

export const getEscalationPoliciesByPropertyId = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const rental = await authorizeRentalRead(req, res, propertyId);
    if (!rental) return;

    const escalationPolicies =
      await escalationPolicyService.getEscalationPoliciesByPropertyId(propertyId);
    return res.status(200).json(escalationPolicies);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createEscalationPolicy = async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const rentalId = body.rentalId as string | undefined;

    if (!rentalId) {
      return res.status(400).json({ message: 'rentalId is required' });
    }

    // WRITE check on the TARGET rental: otherwise `rentalId` in the body is an
    // arbitrary pointer and a caller can plant a policy on someone else's
    // property (and, through `assignedToUserId`, a notification recipient).
    const rental = await authorizeRentalWrite(req, res, rentalId);
    if (!rental) return;

    const escalationPolicy = await escalationPolicyService.createEscalationPolicy({
      name: body.name as string,
      description: body.description as string | undefined,
      rentalId,
    });
    return res.status(201).json(escalationPolicy);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateEscalationPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await authorizePolicy(req, res, id, 'write');
    if (!policy) return;

    // `rentalId` is not writable: a PUT must never re-point a policy at another
    // landlord's property.
    const updateData = pickWritable(req.body, POLICY_WRITABLE);
    const escalationPolicy = await escalationPolicyService.updateEscalationPolicy(
      id,
      updateData
    );
    return res.status(200).json(escalationPolicy);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteEscalationPolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await authorizePolicy(req, res, id, 'write');
    if (!policy) return;

    await escalationPolicyService.deleteEscalationPolicy(id);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createEscalationPolicyRule = async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const policyId = body.policyId as string | undefined;

    if (!policyId) {
      return res.status(400).json({ message: 'policyId is required' });
    }

    // Authorize the PARENT policy — `policyId` from the body is otherwise an
    // unvalidated pointer that can attach a rule to any landlord's policy.
    const parent = await prisma.escalationPolicy.findUnique({
      where: { id: policyId },
      include: { Rental: { include: RENTAL_ACCESS_INCLUDE } },
    });
    if (!parent) {
      return res.status(404).json({ message: 'Escalation policy not found' });
    }
    if (!canModifyRental(req, parent.Rental)) {
      return res
        .status(403)
        .json({ message: 'You do not have access to this escalation policy' });
    }

    const escalationPolicyRule = await escalationPolicyService.createEscalationPolicyRule({
      policyId,
      userId: body.userId as string,
      order: body.order as number,
      priority: body.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY',
      escalateToId: body.escalateToId as string,
      delayMinutes: body.delayMinutes as number,
    });
    return res.status(201).json(escalationPolicyRule);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateEscalationPolicyRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await authorizeRule(req, res, id, 'write');
    if (!rule) return;

    // `policyId` is not writable — a rule must not be moved to another policy.
    const updateData = pickWritable(req.body, RULE_WRITABLE);
    const escalationPolicyRule = await escalationPolicyService.updateEscalationPolicyRule(
      id,
      updateData
    );
    return res.status(200).json(escalationPolicyRule);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteEscalationPolicyRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await authorizeRule(req, res, id, 'write');
    if (!rule) return;

    await escalationPolicyService.deleteEscalationPolicyRule(id);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
