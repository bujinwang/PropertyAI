import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Campaign Controllers
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch campaigns'
    });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { name, type, budget, startDate, endDate, description, targetAudience } = req.body;
    
    const newCampaign = await prisma.marketingCampaign.create({
      data: {
        name,
        type,
        budget,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        targetAudience
      }
    });

    res.status(201).json({
      status: 'success',
      data: newCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create campaign'
    });
  }
};

export const getCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({
        status: 'error',
        message: 'Campaign not found'
      });
    }

    res.json({
      status: 'success',
      data: campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch campaign'
    });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    
    const updatedCampaign = await prisma.marketingCampaign.update({
      where: { id },
      data: updateData
    });

    res.json({
      status: 'success',
      data: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update campaign'
    });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.marketingCampaign.delete({
      where: { id }
    });
    
    res.json({
      status: 'success',
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete campaign'
    });
  }
};

export const pauseCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.marketingCampaign.update({
      where: { id },
      data: { status: 'PAUSED' }
    });
    
    res.json({
      status: 'success',
      message: 'Campaign paused successfully'
    });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to pause campaign'
    });
  }
};

export const resumeCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.marketingCampaign.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });
    
    res.json({
      status: 'success',
      message: 'Campaign resumed successfully'
    });
  } catch (error) {
    console.error('Error resuming campaign:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resume campaign'
    });
  }
};

// Analytics Controllers
export const getAnalyticsOverview = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const campaigns = await prisma.marketingCampaign.findMany({
      where: {
        status: { in: ['ACTIVE', 'PAUSED', 'COMPLETED'] }
      }
    });
    
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
    
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const avgConversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;

    const overview = {
      totalLeads,
      marketingSpend: totalSpend,
      costPerLead: Math.round(costPerLead * 100) / 100,
      avgConversionRate: Math.round(avgConversionRate * 10) / 10,
      periodComparison: {
        leads: 12,
        spend: 8,
        costPerLead: -3,
        conversion: 2.1
      }
    };

    res.json({
      status: 'success',
      data: overview
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics overview'
    });
  }
};

export const getWebsiteTraffic = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const daysAgo = timeRange === '7d' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    const trafficData = await prisma.websiteTraffic.findMany({
      where: {
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    res.json({
      status: 'success',
      data: trafficData
    });
  } catch (error) {
    console.error('Error fetching website traffic:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch website traffic data'
    });
  }
};

export const getLeadSources = async (req: Request, res: Response) => {
  try {
    const leadSources = await prisma.leadSource.findMany({
      orderBy: { leads: 'desc' }
    });

    res.json({
      status: 'success',
      data: leadSources
    });
  } catch (error) {
    console.error('Error fetching lead sources:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lead sources data'
    });
  }
};

export const getPropertyPerformance = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const properties = await prisma.rental.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        Applications: {
          select: { id: true }
        }
      },
      orderBy: { viewCount: 'desc' },
      take: 10
    });

    const propertyPerformance = properties.map(prop => ({
      propertyId: prop.id,
      propertyName: prop.title,
      views: prop.viewCount,
      inquiries: prop.Applications.length,
      conversionRate: prop.viewCount > 0 ? 
        Math.round((prop.Applications.length / prop.viewCount) * 1000) / 10 : 0
    }));

    res.json({
      status: 'success',
      data: propertyPerformance
    });
  } catch (error) {
    console.error('Error fetching property performance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch property performance data'
    });
  }
};

export const getConversionFunnel = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const daysAgo = timeRange === '7d' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    const trafficTotal = await prisma.websiteTraffic.aggregate({
      where: { date: { gte: startDate } },
      _sum: { visitors: true, pageViews: true }
    });
    
    const properties = await prisma.rental.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { viewCount: true }
    });
    
    const applications = await prisma.application.count({
      where: { createdAt: { gte: startDate } }
    });
    
    const approvedApplications = await prisma.application.count({
      where: { 
        createdAt: { gte: startDate },
        status: 'APPROVED'
      }
    });
    
    const leases = await prisma.lease.count({
      where: { signedDate: { gte: startDate } }
    });

    const funnelData = [
      { stage: 'Website Visitors', count: trafficTotal._sum.visitors || 0 },
      { stage: 'Property Views', count: properties._sum.viewCount || 0 },
      { stage: 'Inquiries', count: applications },
      { stage: 'Applications', count: approvedApplications },
      { stage: 'Leases Signed', count: leases }
    ];

    res.json({
      status: 'success',
      data: funnelData
    });
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversion funnel data'
    });
  }
};

// Promotion Controllers
export const getPromotions = async (req: Request, res: Response) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: promotions
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch promotions'
    });
  }
};

export const createPromotion = async (req: Request, res: Response) => {
  try {
    const promotionData = req.body;
    
    if (promotionData.startDate) {
      promotionData.startDate = new Date(promotionData.startDate);
    }
    if (promotionData.endDate) {
      promotionData.endDate = new Date(promotionData.endDate);
    }
    
    const newPromotion = await prisma.promotion.create({
      data: promotionData
    });

    res.status(201).json({
      status: 'success',
      data: newPromotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create promotion'
    });
  }
};

export const getPromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const promotion = await prisma.promotion.findUnique({
      where: { id }
    });

    if (!promotion) {
      return res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
    }

    res.json({
      status: 'success',
      data: promotion
    });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch promotion'
    });
  }
};

export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    
    const updatedPromotion = await prisma.promotion.update({
      where: { id },
      data: updateData
    });

    res.json({
      status: 'success',
      data: updatedPromotion
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update promotion'
    });
  }
};

export const deletePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.promotion.delete({
      where: { id }
    });
    
    res.json({
      status: 'success',
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete promotion'
    });
  }
};

export const activatePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.promotion.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });
    
    res.json({
      status: 'success',
      message: 'Promotion activated successfully'
    });
  } catch (error) {
    console.error('Error activating promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate promotion'
    });
  }
};

export const deactivatePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.promotion.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });
    
    res.json({
      status: 'success',
      message: 'Promotion deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate promotion'
    });
  }
};

export const validatePromotionCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    const promotion = await prisma.promotion.findUnique({
      where: { code }
    });
    
    if (!promotion) {
      return res.json({
        status: 'success',
        data: {
          valid: false,
          message: 'Invalid promotion code'
        }
      });
    }
    
    const now = new Date();
    const isActive = promotion.status === 'ACTIVE';
    const isInDateRange = now >= promotion.startDate && now <= promotion.endDate;
    const hasUsageLeft = !promotion.usageLimit || promotion.usageCount < promotion.usageLimit;
    
    if (isActive && isInDateRange && hasUsageLeft) {
      res.json({
        status: 'success',
        data: {
          valid: true,
          promotion: {
            id: promotion.id,
            name: promotion.name,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            description: promotion.description
          }
        }
      });
    } else {
      let message = 'Invalid promotion code';
      if (!isActive) message = 'Promotion is not active';
      else if (!isInDateRange) message = 'Promotion has expired or not started yet';
      else if (!hasUsageLeft) message = 'Promotion usage limit reached';
      
      res.json({
        status: 'success',
        data: {
          valid: false,
          message
        }
      });
    }
  } catch (error) {
    console.error('Error validating promotion code:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate promotion code'
    });
  }
};

// Syndication Controllers
export const getSyndicationPlatforms = async (req: Request, res: Response) => {
  try {
    const platforms = await prisma.syndicationPlatform.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      status: 'success',
      data: platforms
    });
  } catch (error) {
    console.error('Error fetching syndication platforms:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch syndication platforms'
    });
  }
};

export const updateSyndicationPlatform = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedPlatform = await prisma.syndicationPlatform.update({
      where: { id },
      data: updateData
    });

    res.json({
      status: 'success',
      data: updatedPlatform
    });
  } catch (error) {
    console.error('Error updating syndication platform:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update syndication platform'
    });
  }
};

export const syncPlatform = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.syndicationPlatform.update({
      where: { id },
      data: { 
        status: 'SYNCING',
        lastSync: new Date()
      }
    });
    
    await prisma.syncActivity.create({
      data: {
        platformId: id,
        action: 'sync',
        status: 'initiated',
        details: 'Manual sync initiated'
      }
    });
    
    setTimeout(async () => {
      try {
        await prisma.syndicationPlatform.update({
          where: { id },
          data: { status: 'CONNECTED' }
        });
        
        await prisma.syncActivity.create({
          data: {
            platformId: id,
            action: 'sync',
            status: 'success',
            details: 'Sync completed successfully'
          }
        });
      } catch (err) {
        console.error('Error completing sync:', err);
      }
    }, 5000);
    
    res.json({
      status: 'success',
      message: 'Platform sync initiated successfully'
    });
  } catch (error) {
    console.error('Error syncing platform:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync platform'
    });
  }
};

export const syncAllPlatforms = async (req: Request, res: Response) => {
  try {
    const platforms = await prisma.syndicationPlatform.findMany({
      where: { enabled: true }
    });
    
    const syncPromises = platforms.map(platform => 
      prisma.syndicationPlatform.update({
        where: { id: platform.id },
        data: { 
          status: 'SYNCING',
          lastSync: new Date()
        }
      })
    );
    
    await Promise.all(syncPromises);
    
    const activityPromises = platforms.map(platform =>
      prisma.syncActivity.create({
        data: {
          platformId: platform.id,
          action: 'sync_all',
          status: 'initiated',
          details: 'Bulk sync initiated'
        }
      })
    );
    
    await Promise.all(activityPromises);
    
    res.json({
      status: 'success',
      message: 'All platforms sync initiated successfully'
    });
  } catch (error) {
    console.error('Error syncing all platforms:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync all platforms'
    });
  }
};

export const getSyncActivity = async (req: Request, res: Response) => {
  try {
    const activity = await prisma.syncActivity.findMany({
      include: {
        platform: {
          select: { name: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    const formattedActivity = activity.map(item => ({
      id: item.id,
      platform: item.platform.name,
      action: item.action,
      status: item.status,
      timestamp: item.timestamp,
      details: item.details
    }));

    res.json({
      status: 'success',
      data: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching sync activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sync activity'
    });
  }
};
