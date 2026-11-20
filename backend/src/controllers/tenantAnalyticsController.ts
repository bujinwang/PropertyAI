import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import {
  canAccessRental,
  messageScopeFilter,
} from '../utils/rentalAccess';

/**
 * Tenant sentiment analytics — `/api/tenant/*`.
 *
 * WHAT WAS WRONG
 * --------------
 * 1. `rentalId` came from the query string and was OPTIONAL:
 *
 *        const { timeframe = '30d', rentalId } = req.query;
 *        if (rentalId) { whereClause.MaintenanceRequest = { rentalId }; }
 *
 *    Omitting a query parameter is what every HTTP client does by default, so
 *    the ordinary request returned every landlord's tenant messages. An
 *    optional filter is an opt-in, not a filter.
 *
 * 2. When `rentalId` WAS supplied it was never authorized — nothing resolved the
 *    rental before using it — so any authenticated user could read any
 *    landlord's portfolio by guessing an id.
 *
 * 3. `getEarlyWarnings` ran a second query (`recentNegativeTrends`) with no
 *    rental filter at all and fed it into `escalationRisks`. A correctly scoped
 *    warning list still disclosed which tenants at OTHER landlords' properties
 *    were "HIGH risk", keyed by `senderId`.
 *
 * 4. `summary.averageScore` divided by `sentimentData.length` without a guard,
 *    so an empty portfolio produced `NaN`. `JSON.stringify` renders that as
 *    `null` — the endpoint reported "no data" as `averageScore: null` instead of
 *    a truthful 0.
 *
 * HOW IT IS FIXED
 * ---------------
 * Scope no longer comes from the query string; it comes from the token, via
 * `messageScopeFilter(req)` in `utils/rentalAccess.ts` (the single policy
 * module). `rentalId` still works, but as a NARROWING filter that is
 * authorized first: existence (404), then access (403), then use.
 *
 * All four handlers share `resolveScope`, so the four endpoints cannot drift
 * apart — the failure mode where one of them keeps an unscoped query is exactly
 * how `escalationRisks` stayed broken while its sibling query was fixed.
 *
 * KNOWN GAP — THESE ENDPOINTS ARE SCOPED BUT STRUCTURALLY EMPTY
 * -------------------------------------------------------------
 * The scoping above is correct and pinned by tests. It is also, for now, the
 * only thing that is correct here. `Message.sentiment`, `sentimentScore`,
 * `category` and `isEarlyWarning` are read by every handler below **and written
 * by nothing in this codebase**. `ConversationService.createMessage` — the one
 * place that computes a sentiment — had no callers and discarded the value; its
 * sibling writes (`ai.service.ts`, `contractor.service.ts`) never set the field
 * at all. So every `sentiment` is the schema default `NEUTRAL`, every
 * `sentimentScore` is null, no message is ever an `isEarlyWarning`, and no
 * message ever has a `category`.
 *
 * The visible consequence is that these endpoints return truthful-looking but
 * empty analytics:
 *   - `common-issues` always returns `[]`          (filters on `category: not null`)
 *   - `early-warnings` always returns `[]` + no risks (filters on `isEarlyWarning`)
 *   - `proactive-suggestions` always returns `[]`  (thresholds need real scores)
 *   - `sentiment-trends` returns buckets but every message is NEUTRAL
 *
 * This is a missing feature, not an authorization bug, so it is NOT worked
 * around by inventing a producer here — guessing a classifier would make the
 * numbers look real while being meaningless. Recorded instead. See the banner
 * in `services/conversation.service.ts` for what a real fix requires
 * (`sentimentService.analyze` returns a bare enum; a numeric `sentimentScore`
 * producer does not exist, so `sentimentScore < -0.5` can never be true).
 */

type Resolved = { ok: true; where: Prisma.MessageWhereInput } | { ok: false };

/**
 * The scope every query in this controller must be built from.
 *
 * Returns a discriminator rather than throwing so the caller can send the
 * correct status; a thrown error would collapse 403 and 404 into a 500.
 */
async function resolveScope(req: Request, res: Response): Promise<Resolved> {
  const scope = messageScopeFilter(req) as Prisma.MessageWhereInput | undefined;

  // ADMIN: `undefined` means unrestricted, but never "no filter at all" —
  // every caller below merges its own conditions into this object.
  const base: Prisma.MessageWhereInput = scope ? { AND: [scope] } : {};

  const rentalId = req.query.rentalId;
  if (rentalId !== undefined && rentalId !== '') {
    if (typeof rentalId !== 'string') {
      res.status(400).json({ success: false, error: 'rentalId must be a single value' });
      return { ok: false };
    }

    // Existence BEFORE access, so a typo answers "not found" rather than a
    // misleading "forbidden". The include is required for the resident branch
    // of `canAccessRental` to see Leases/Applications.
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        Leases: { select: { tenantId: true } },
        Applications: { select: { applicantId: true } },
      },
    });
    if (!rental) {
      res.status(404).json({ success: false, error: 'Rental not found' });
      return { ok: false };
    }
    if (!canAccessRental(req, rental)) {
      res.status(403).json({ success: false, error: 'You do not have access to this rental' });
      return { ok: false };
    }

    // AND, never an overwrite: a caller-supplied rentalId must NARROW the
    // token scope, never replace it. Assigning `MaintenanceRequest` here would
    // let a resident point the whole query at another landlord's portfolio.
    base.AND = [
      ...(Array.isArray(base.AND) ? base.AND : base.AND ? [base.AND] : []),
      { MaintenanceRequest: { rentalId } },
    ] as Prisma.MessageWhereInput[];
  }

  return { ok: true, where: base };
}

/** `timeframe` is presentation, not scope: it maps to a start date. */
function startDateFor(timeframe: unknown): Date {
  const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  return startDate;
}

class TenantAnalyticsController {
  /**
   * GET /api/tenant/sentiment-trends
   */
  static async getSentimentTrends(req: Request, res: Response) {
    try {
      const scope = await resolveScope(req, res);
      if (!scope.ok) return;

      const sentimentData = await prisma.message.findMany({
        where: {
          AND: [scope.where, { sentAt: { gte: startDateFor(req.query.timeframe) } }],
        },
        select: {
          sentAt: true,
          sentiment: true,
          sentimentScore: true,
          category: true,
        },
        orderBy: { sentAt: 'asc' },
      });

      const trendData = sentimentData.reduce((acc: any, message) => {
        const date = message.sentAt.toISOString().split('T')[0];

        if (!acc[date]) {
          acc[date] = {
            date,
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0,
            averageScore: 0,
            scores: [],
          };
        }

        const bucket = message.sentiment?.toLowerCase();
        // Guard against a sentiment value with no matching counter: an
        // unrecognised enum would otherwise make `acc[date][x]++` `NaN` and
        // poison `total`.
        if (bucket === 'positive' || bucket === 'negative' || bucket === 'neutral') {
          acc[date][bucket]++;
        }
        acc[date].total++;
        if (message.sentimentScore !== null) {
          acc[date].scores.push(message.sentimentScore);
        }

        return acc;
      }, {});

      const trends = Object.values(trendData).map((day: any) => {
        // `total` is guaranteed >= 1 by construction, but the guard documents
        // the invariant that keeps the percentages finite.
        const total = day.total || 1;
        return {
          ...day,
          averageScore:
            day.scores.length > 0
              ? day.scores.reduce((sum: number, score: number) => sum + score, 0) /
                day.scores.length
              : 0,
          positivePercentage: (day.positive / total) * 100,
          negativePercentage: (day.negative / total) * 100,
          neutralPercentage: (day.neutral / total) * 100,
        };
      });

      // An empty portfolio averages 0 messages, not `0/0`. Without this guard
      // the value is NaN and `JSON.stringify` emits `null`.
      const averageScore =
        sentimentData.length > 0
          ? sentimentData.reduce((sum, msg) => sum + (msg.sentimentScore || 0), 0) /
            sentimentData.length
          : 0;

      res.json({
        success: true,
        data: {
          trends,
          summary: {
            totalMessages: sentimentData.length,
            averageScore,
            sentimentDistribution: {
              positive: sentimentData.filter((m) => m.sentiment === 'POSITIVE').length,
              negative: sentimentData.filter((m) => m.sentiment === 'NEGATIVE').length,
              neutral: sentimentData.filter((m) => m.sentiment === 'NEUTRAL').length,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching sentiment trends:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch sentiment trends' });
    }
  }

  /**
   * GET /api/tenant/common-issues
   */
  static async getCommonIssues(req: Request, res: Response) {
    try {
      const scope = await resolveScope(req, res);
      if (!scope.ok) return;

      // Built ONCE and reused by both the groupBy and the example query below.
      // Two independently built clauses is how the example query kept leaking
      // after the aggregate had been fixed.
      const where: Prisma.MessageWhereInput = {
        AND: [
          scope.where,
          { sentAt: { gte: startDateFor(req.query.timeframe) } },
          { category: { not: null } },
          { sentiment: 'NEGATIVE' },
        ],
      };

      const issueData = await prisma.message.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
        _avg: { sentimentScore: true },
        orderBy: { _count: { category: 'desc' } },
      });

      const issuesWithExamples = await Promise.all(
        issueData.slice(0, 10).map(async (issue) => {
          const examples = await prisma.message.findMany({
            where: { AND: [where, { category: issue.category }] },
            select: {
              content: true,
              sentAt: true,
              sentimentScore: true,
              MaintenanceRequest: {
                select: { title: true, Rental: { select: { title: true } } },
              },
            },
            orderBy: { sentAt: 'desc' },
            take: 3,
          });

          return {
            category: issue.category,
            count: issue._count.category,
            averageSentiment: issue._avg.sentimentScore || 0,
            examples: examples.map((ex) => ({
              content: ex.content.substring(0, 100) + (ex.content.length > 100 ? '...' : ''),
              date: ex.sentAt,
              property: ex.MaintenanceRequest?.Rental?.title || 'General',
              sentimentScore: ex.sentimentScore,
            })),
          };
        })
      );

      res.json({
        success: true,
        data: {
          commonIssues: issuesWithExamples,
          totalIssues: issueData.reduce((sum, issue) => sum + issue._count.category, 0),
        },
      });
    } catch (error) {
      console.error('Error fetching common issues:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch common issues' });
    }
  }

  /**
   * GET /api/tenant/early-warnings
   */
  static async getEarlyWarnings(req: Request, res: Response) {
    try {
      const scope = await resolveScope(req, res);
      if (!scope.ok) return;

      const earlyWarnings = await prisma.message.findMany({
        where: {
          AND: [
            scope.where,
            { isEarlyWarning: true },
            { sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: {
          id: true,
          content: true,
          sentAt: true,
          sentiment: true,
          sentimentScore: true,
          category: true,
          User_Message_senderIdToUser: { select: { firstName: true, lastName: true } },
          MaintenanceRequest: {
            select: {
              id: true,
              title: true,
              priority: true,
              status: true,
              Rental: { select: { title: true, address: true } },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      });

      // THE SECOND QUERY NOW CARRIES THE SAME SCOPE.
      // Previously this had no rental filter whatsoever, so `escalationRisks`
      // named tenants from every landlord on the platform even when the caller
      // had supplied a correct `rentalId`.
      const recentNegativeTrends = await prisma.message.findMany({
        where: {
          AND: [
            scope.where,
            { sentAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
            { sentiment: 'NEGATIVE' },
            { sentimentScore: { lt: -0.5 } },
          ],
        },
        select: {
          senderId: true,
          category: true,
          sentAt: true,
          MaintenanceRequest: {
            select: { rentalId: true, Rental: { select: { title: true } } },
          },
        },
      });

      const tenantConcerns = recentNegativeTrends.reduce((acc: any, message) => {
        const key = message.senderId;
        if (!acc[key]) {
          acc[key] = {
            senderId: key,
            negativeMessages: 0,
            categories: new Set(),
            properties: new Set(),
          };
        }
        acc[key].negativeMessages++;
        if (message.category) acc[key].categories.add(message.category);
        if (message.MaintenanceRequest?.Rental?.title) {
          acc[key].properties.add(message.MaintenanceRequest.Rental.title);
        }
        return acc;
      }, {});

      const escalationRisks = Object.values(tenantConcerns)
        .filter((tenant: any) => tenant.negativeMessages >= 2)
        .map((tenant: any) => ({
          ...tenant,
          categories: Array.from(tenant.categories),
          properties: Array.from(tenant.properties),
          riskLevel: tenant.negativeMessages >= 3 ? 'HIGH' : 'MEDIUM',
        }));

      res.json({
        success: true,
        data: {
          activeWarnings: earlyWarnings.map((warning) => ({
            id: warning.id,
            message:
              warning.content.substring(0, 150) + (warning.content.length > 150 ? '...' : ''),
            // The tenant's name is derived data about a person, but it is only
            // ever reached through a message on a rental the caller owns (or
            // one they sent themselves), so it is in scope by construction.
            tenant: `${warning.User_Message_senderIdToUser.firstName} ${warning.User_Message_senderIdToUser.lastName}`,
            category: warning.category,
            sentiment: warning.sentiment,
            sentimentScore: warning.sentimentScore,
            date: warning.sentAt,
            property: warning.MaintenanceRequest?.Rental?.title || 'General',
            maintenanceRequest: warning.MaintenanceRequest
              ? {
                  id: warning.MaintenanceRequest.id,
                  title: warning.MaintenanceRequest.title,
                  priority: warning.MaintenanceRequest.priority,
                  status: warning.MaintenanceRequest.status,
                }
              : null,
          })),
          escalationRisks,
          summary: {
            totalWarnings: earlyWarnings.length,
            highRiskTenants: escalationRisks.filter((r: any) => r.riskLevel === 'HIGH').length,
            mediumRiskTenants: escalationRisks.filter((r: any) => r.riskLevel === 'MEDIUM').length,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching early warnings:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch early warnings' });
    }
  }

  /**
   * GET /api/tenant/proactive-suggestions
   */
  static async getProactiveSuggestions(req: Request, res: Response) {
    try {
      const scope = await resolveScope(req, res);
      if (!scope.ok) return;

      const recentMessages = await prisma.message.findMany({
        where: {
          AND: [
            scope.where,
            { sentAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: {
          category: true,
          sentiment: true,
          sentimentScore: true,
          isEarlyWarning: true,
          MaintenanceRequest: {
            select: {
              priority: true,
              status: true,
              Rental: { select: { id: true, title: true } },
            },
          },
        },
      });

      const suggestions: Array<Record<string, unknown>> = [];

      const categoryStats = recentMessages.reduce((acc: any, msg) => {
        if (msg.category) {
          if (!acc[msg.category]) {
            acc[msg.category] = { count: 0, negativeCount: 0, avgSentiment: 0, scores: [] };
          }
          acc[msg.category].count++;
          if (msg.sentiment === 'NEGATIVE') acc[msg.category].negativeCount++;
          if (msg.sentimentScore !== null) acc[msg.category].scores.push(msg.sentimentScore);
        }
        return acc;
      }, {});

      Object.entries(categoryStats).forEach(([category, stats]: [string, any]) => {
        stats.avgSentiment =
          stats.scores.length > 0
            ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) /
              stats.scores.length
            : 0;

        if (stats.negativeCount >= 2 && stats.avgSentiment < -0.3) {
          let suggestion = '';
          let priority = 'MEDIUM';

          switch (category) {
            case 'plumbing':
              suggestion =
                'Consider scheduling preventive plumbing maintenance across affected properties to address recurring water pressure and leak issues.';
              priority = 'HIGH';
              break;
            case 'hvac':
              suggestion =
                'HVAC systems may need inspection. Consider scheduling seasonal maintenance to prevent cooling/heating issues.';
              priority = 'HIGH';
              break;
            case 'noise_complaint':
              suggestion =
                'Implement noise policies and consider soundproofing improvements in units with recurring complaints.';
              priority = 'MEDIUM';
              break;
            case 'accessibility':
              suggestion =
                'Review accessibility features and ensure all building systems (elevators, ramps) are functioning properly.';
              priority = 'HIGH';
              break;
            case 'emergency':
              suggestion =
                'Review emergency response procedures and ensure all safety systems are up to date.';
              priority = 'CRITICAL';
              break;
            default:
              suggestion = `Address recurring ${category} issues proactively to improve tenant satisfaction.`;
          }

          suggestions.push({
            type: 'category_trend',
            category,
            priority,
            suggestion,
            affectedMessages: stats.count,
            negativeMessages: stats.negativeCount,
            averageSentiment: stats.avgSentiment,
          });
        }
      });

      const earlyWarningCount = recentMessages.filter((m) => m.isEarlyWarning).length;
      if (earlyWarningCount >= 3) {
        suggestions.push({
          type: 'early_warning_trend',
          priority: 'HIGH',
          suggestion:
            'Multiple early warning indicators detected. Consider implementing proactive communication and maintenance scheduling.',
          affectedMessages: earlyWarningCount,
        });
      }

      const propertyStats = recentMessages.reduce((acc: any, msg) => {
        const propertyId = msg.MaintenanceRequest?.Rental?.id;
        if (propertyId) {
          if (!acc[propertyId]) {
            acc[propertyId] = {
              title: msg.MaintenanceRequest?.Rental?.title,
              negativeCount: 0,
              totalCount: 0,
              scores: [],
            };
          }
          acc[propertyId].totalCount++;
          if (msg.sentiment === 'NEGATIVE') acc[propertyId].negativeCount++;
          if (msg.sentimentScore !== null) acc[propertyId].scores.push(msg.sentimentScore);
        }
        return acc;
      }, {});

      Object.entries(propertyStats).forEach(([, stats]: [string, any]) => {
        const negativeRatio = stats.negativeCount / stats.totalCount;
        const avgSentiment =
          stats.scores.length > 0
            ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) /
              stats.scores.length
            : 0;

        if (negativeRatio > 0.4 && avgSentiment < -0.2) {
          suggestions.push({
            type: 'property_concern',
            priority: 'MEDIUM',
            suggestion: `Property "${stats.title}" showing concerning tenant sentiment trends. Consider scheduling a property review and tenant check-in.`,
            property: stats.title,
            negativeRatio: Math.round(negativeRatio * 100),
            averageSentiment: avgSentiment,
          });
        }
      });

      const priorityOrder: Record<string, number> = {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
      };
      suggestions.sort(
        (a, b) =>
          (priorityOrder[a.priority as string] ?? 9) - (priorityOrder[b.priority as string] ?? 9)
      );

      res.json({
        success: true,
        data: {
          suggestions,
          summary: {
            totalSuggestions: suggestions.length,
            criticalSuggestions: suggestions.filter((s) => s.priority === 'CRITICAL').length,
            highPrioritySuggestions: suggestions.filter((s) => s.priority === 'HIGH').length,
            mediumPrioritySuggestions: suggestions.filter((s) => s.priority === 'MEDIUM').length,
          },
        },
      });
    } catch (error) {
      console.error('Error generating proactive suggestions:', error);
      res.status(500).json({ success: false, error: 'Failed to generate proactive suggestions' });
    }
  }
}

export default TenantAnalyticsController;
