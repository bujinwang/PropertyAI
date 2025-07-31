import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateUXReviewInput {
  title: string;
  description?: string;
  componentId: string;
  componentType: string;
  reviewerId: string;
  reviewType: string;
  severity: string;
  priority?: string;
  environment?: string;
  url?: string;
  screenshots?: string[];
  annotations?: any[];
  tags?: string[];
  metadata?: any;
}

export interface UpdateUXReviewInput {
  title?: string;
  description?: string;
  severity?: string;
  status?: string;
  priority?: string;
  tags?: string[];
  annotations?: any[];
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface CreateUXReviewCommentInput {
  content: string;
  authorId: string;
  reviewId: string;
  parentId?: string;
  mentions?: string[];
}

export interface AssignUXReviewInput {
  reviewId: string;
  assigneeId: string;
  dueDate?: Date;
}

export interface CreateUXMetricInput {
  reviewId: string;
  metricType: string;
  value: number;
  target?: number;
  unit: string;
  description?: string;
  category: string;
}

export interface CreateUXSurveyInput {
  title: string;
  description?: string;
  questions: any[];
  createdById: string;
}

export interface CreateUXSurveyResponseInput {
  surveyId: string;
  respondentId: string;
  responses: any;
  satisfactionScore?: number;
  completionTime?: number;
}

export interface CreateUXAnalyticsInput {
  metricName: string;
  value: number;
  category: string;
  source: string;
  metadata?: any;
}

export class UXReviewService {
  // UX Review CRUD operations
  async createReview(input: CreateUXReviewInput) {
    return await prisma.uXReview.create({
      data: {
        ...input,
        status: 'OPEN',
        priority: input.priority || 'MEDIUM',
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        assignments: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        metrics: true,
      },
    });
  }

  async getReviewById(id: string) {
    return await prisma.uXReview.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        assignments: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        metrics: true,
      },
    });
  }

  async getReviews(filters: {
    status?: string;
    severity?: string;
    priority?: string;
    reviewerId?: string;
    componentId?: string;
    reviewType?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.priority) where.priority = filters.priority;
    if (filters.reviewerId) where.reviewerId = filters.reviewerId;
    if (filters.componentId) where.componentId = filters.componentId;
    if (filters.reviewType) where.reviewType = filters.reviewType;
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    return await prisma.uXReview.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: filters.offset || 0,
      take: filters.limit || 50,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignments: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        metrics: true,
      },
    });
  }

  async updateReview(id: string, input: UpdateUXReviewInput) {
    return await prisma.uXReview.update({
      where: { id },
      data: input,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        assignments: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        metrics: true,
      },
    });
  }

  async deleteReview(id: string) {
    return await prisma.uXReview.delete({
      where: { id },
    });
  }

  async getReviewStats() {
    const [totalReviews, openReviews, inProgressReviews, resolvedReviews] = await Promise.all([
      prisma.uXReview.count(),
      prisma.uXReview.count({ where: { status: 'OPEN' } }),
      prisma.uXReview.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.uXReview.count({ where: { status: 'RESOLVED' } }),
    ]);

    const severityStats = await prisma.uXReview.groupBy({
      by: ['severity'],
      _count: { _all: true },
    });

    const priorityStats = await prisma.uXReview.groupBy({
      by: ['priority'],
      _count: { _all: true },
    });

    const typeStats = await prisma.uXReview.groupBy({
      by: ['reviewType'],
      _count: { _all: true },
    });

    return {
      totalReviews,
      openReviews,
      inProgressReviews,
      resolvedReviews,
      severityStats,
      priorityStats,
      typeStats,
    };
  }

  // UX Review Comments
  async addComment(input: CreateUXReviewCommentInput) {
    return await prisma.uXReviewComment.create({
      data: input,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getComments(reviewId: string) {
    return await prisma.uXReviewComment.findMany({
      where: { reviewId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // UX Review Assignments
  async assignReview(input: AssignUXReviewInput) {
    return await prisma.uXReviewAssignment.upsert({
      where: {
        reviewId_assigneeId: {
          reviewId: input.reviewId,
          assigneeId: input.assigneeId,
        },
      },
      update: {
        dueDate: input.dueDate,
        status: 'PENDING',
      },
      create: {
        reviewId: input.reviewId,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        review: true,
      },
    });
  }

  async getAssignments(assigneeId: string) {
    return await prisma.uXReviewAssignment.findMany({
      where: { assigneeId },
      include: {
        review: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  // UX Metrics
  async addMetric(input: CreateUXMetricInput) {
    return await prisma.uXMetric.create({
      data: input,
    });
  }

  async getMetrics(reviewId: string) {
    return await prisma.uXMetric.findMany({
      where: { reviewId },
    });
  }

  // UX Surveys
  async createSurvey(input: CreateUXSurveyInput) {
    return await prisma.uXSurvey.create({
      data: input,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getSurveys(status?: string) {
    const where = status ? { status } : {};
    return await prisma.uXSurvey.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        responses: {
          select: {
            id: true,
            satisfactionScore: true,
            completionTime: true,
            createdAt: true,
            respondent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addSurveyResponse(input: CreateUXSurveyResponseInput) {
    return await prisma.uXSurveyResponse.upsert({
      where: {
        surveyId_respondentId: {
          surveyId: input.surveyId,
          respondentId: input.respondentId,
        },
      },
      update: input,
      create: input,
    });
  }

  // UX Analytics
  async recordAnalytics(input: CreateUXAnalyticsInput) {
    return await prisma.uXAnalytics.create({
      data: input,
    });
  }

  async getAnalytics(filters: {
    metricName?: string;
    category?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    
    if (filters.metricName) where.metricName = filters.metricName;
    if (filters.category) where.category = filters.category;
    if (filters.source) where.source = filters.source;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    return await prisma.uXAnalytics.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getAnalyticsSummary(startDate: Date, endDate: Date) {
    const analytics = await prisma.uXAnalytics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const groupedByMetric = analytics.reduce((acc, item) => {
      if (!acc[item.metricName]) {
        acc[item.metricName] = [];
      }
      acc[item.metricName].push(item.value);
      return acc;
    }, {} as Record<string, number[]>);

    const summary = Object.entries(groupedByMetric).map(([metricName, values]) => ({
      metricName,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }));

    return summary;
  }
}

export const uxReviewService = new UXReviewService();