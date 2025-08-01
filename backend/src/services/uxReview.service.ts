import { PrismaClient, UXReviewStatus, UXReviewPriority, UXComponentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateUXReviewInput {
  title: string;
  description?: string;
  componentType: UXComponentType;
  reviewerId: string;
  priority?: UXReviewPriority;
  status?: UXReviewStatus;
}

export interface UpdateUXReviewInput {
  title?: string;
  description?: string;
  status?: UXReviewStatus;
  priority?: UXReviewPriority;
}

export interface CreateUXReviewCommentInput {
  content: string;
  authorId: string;
  reviewId: string;
}

export interface AssignUXReviewInput {
  reviewId: string;
  assigneeId: string;
}

export interface CreateUXSurveyInput {
  title: string;
  description?: string;
  createdById: string;
  questions?: any[];
}

export interface CreateUXSurveyResponseInput {
  surveyId: string;
  respondentId: string;
  responses: any[];
  satisfactionScore: number;
}

export class UXReviewService {
  async createReview(data: CreateUXReviewInput) {
    return await prisma.uXReview.create({
      data: {
        title: data.title,
        description: data.description,
        componentType: data.componentType,
        reviewerId: data.reviewerId,
        priority: data.priority || UXReviewPriority.MEDIUM,
        status: data.status || UXReviewStatus.PENDING,
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
      },
    });
  }

  async getReviews(filters?: any) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    
    if (filters?.componentType) {
      where.componentType = filters.componentType;
    }
    
    if (filters?.reviewerId) {
      where.reviewerId = filters.reviewerId;
    }

    return await prisma.uXReview.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
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
      },
    });
  }

  async updateReview(id: string, data: UpdateUXReviewInput) {
    return await prisma.uXReview.update({
      where: { id },
      data,
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
      },
    });
  }

  async deleteReview(id: string) {
    return await prisma.uXReview.delete({
      where: { id },
    });
  }

  async createComment(data: CreateUXReviewCommentInput) {
    return await prisma.uXReviewComment.create({
      data,
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

  async assignReview(data: AssignUXReviewInput) {
    return await prisma.uXReviewAssignment.create({
      data,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        review: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });
  }

  async createSurvey(data: CreateUXSurveyInput) {
    return await prisma.uXSurvey.create({
      data: {
        title: data.title,
        description: data.description,
        createdById: data.createdById,
      },
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

  async getSurveys(filters?: any) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }

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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSurveyResponse(data: CreateUXSurveyResponseInput) {
    return await prisma.uXSurveyResponse.create({
      data: {
        surveyId: data.surveyId,
        respondentId: data.respondentId,
      },
      include: {
        respondent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        survey: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}

export const uxReviewService = new UXReviewService();