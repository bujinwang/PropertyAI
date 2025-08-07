import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryRatings {
  cleanliness: number;
  communication: number;
  paymentHistory: number;
  propertyCare: number;
}

interface CreateEnhancedRatingData {
  leaseId: string;
  tenantId: string;
  raterId: string;
  categories: CategoryRatings;
  comment?: string;
  tags?: string[];
  attachments?: string[];
}

interface UpdateEnhancedRatingData extends Partial<CreateEnhancedRatingData> {}

export class TenantRatingService {
  // Calculate overall rating from categories
  private calculateOverallRating(categories: CategoryRatings): number {
    const values = Object.values(categories);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  async createTenantRating(data: CreateEnhancedRatingData) {
    const overallRating = this.calculateOverallRating(data.categories);
    
    // Ensure raterId is provided
    if (!data.raterId) {
      throw new Error('raterId is required');
    }
    
    return prisma.tenantRating.create({
      data: {
        leaseId: data.leaseId,
        tenantId: data.tenantId,
        raterId: data.raterId,
        rating: Math.round(overallRating), // Keep for backward compatibility as integer
        overallRating,
        categories: data.categories as any,
        comment: data.comment,
        tags: data.tags || [],
        attachments: data.attachments || [],
      },
      include: {
        User_TenantRating_raterIdToUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async getTenantRatings(tenantId: string) {
    const ratings = await prisma.tenantRating.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        leaseId: true,
        tenantId: true,
        raterId: true,
        rating: true,
        overallRating: true,
        categories: true,
        comment: true,
        tags: true,
        attachments: true,
        createdAt: true,
        updatedAt: true,
        User_TenantRating_raterIdToUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected interface
    return ratings.map(rating => ({
      ...rating,
      rater: {
        firstName: rating.User_TenantRating_raterIdToUser?.firstName || 'Unknown',
        lastName: rating.User_TenantRating_raterIdToUser?.lastName || 'User'
      }
    }));
  }

  async updateTenantRating(id: string, data: UpdateEnhancedRatingData) {
    const updateData: any = { ...data };
    
    if (data.categories) {
      updateData.overallRating = this.calculateOverallRating(data.categories);
      updateData.rating = Math.round(updateData.overallRating); // Keep for backward compatibility as integer
    }

    return prisma.tenantRating.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        leaseId: true,
        tenantId: true,
        raterId: true,
        rating: true,
        overallRating: true,
        categories: true,
        comment: true,
        tags: true,
        attachments: true,
        createdAt: true,
        updatedAt: true,
        User_TenantRating_raterIdToUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async deleteTenantRating(id: string) {
    return prisma.tenantRating.delete({
      where: { id }
    });
  }

  async getTenantRatingAnalytics(tenantId: string) {
    const ratings = await prisma.tenantRating.findMany({
      where: { tenantId },
      select: {
        id: true,
        rating: true,
        overallRating: true,
        categories: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (ratings.length === 0) {
      return {
        averageRatings: {
          overall: 0,
          cleanliness: 0,
          communication: 0,
          paymentHistory: 0,
          propertyCare: 0
        },
        ratingDistribution: {},
        trendData: [],
        totalRatings: 0
      };
    }

    // Calculate average ratings
    const totals = ratings.reduce((acc, rating) => {
      const categories = (rating.categories as any) as CategoryRatings || {
        cleanliness: rating.rating || 0,
        communication: rating.rating || 0,
        paymentHistory: rating.rating || 0,
        propertyCare: rating.rating || 0
      };

      return {
        overall: acc.overall + (Number(rating.overallRating) || rating.rating || 0),
        cleanliness: acc.cleanliness + categories.cleanliness,
        communication: acc.communication + categories.communication,
        paymentHistory: acc.paymentHistory + categories.paymentHistory,
        propertyCare: acc.propertyCare + categories.propertyCare
      };
    }, {
      overall: 0,
      cleanliness: 0,
      communication: 0,
      paymentHistory: 0,
      propertyCare: 0
    });

    const averageRatings = {
      overall: Math.round((totals.overall / ratings.length) * 10) / 10,
      cleanliness: Math.round((totals.cleanliness / ratings.length) * 10) / 10,
      communication: Math.round((totals.communication / ratings.length) * 10) / 10,
      paymentHistory: Math.round((totals.paymentHistory / ratings.length) * 10) / 10,
      propertyCare: Math.round((totals.propertyCare / ratings.length) * 10) / 10
    };

    // Calculate rating distribution
    const ratingDistribution = ratings.reduce((acc, rating) => {
      const overallRating = Math.round(Number(rating.overallRating) || rating.rating || 0);
      acc[overallRating] = (acc[overallRating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    // Generate trend data (last 12 months)
    const trendData = ratings
      .slice(0, 12)
      .reverse()
      .map(rating => ({
        date: rating.createdAt.toISOString().split('T')[0],
        rating: rating.overallRating || rating.rating || 0
      }));

    return {
      averageRatings,
      ratingDistribution,
      trendData,
      totalRatings: ratings.length
    };
  }
}
