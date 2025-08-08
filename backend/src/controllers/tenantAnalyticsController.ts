import { Request, Response } from 'express';
import { PrismaClient, Sentiment } from '@prisma/client';

const prisma = new PrismaClient();

class TenantAnalyticsController {
  /**
   * GET /api/tenant/sentiment-trends
   * Returns sentiment trends over time
   */
  static async getSentimentTrends(req: Request, res: Response) {
    try {
      const { timeframe = '30d', rentalId } = req.query;
      
      // Calculate date range
      const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Build where clause
      const whereClause: any = {
        sentAt: {
          gte: startDate
        },
        sentiment: {
          not: null
        }
      };

      if (rentalId) {
        whereClause.MaintenanceRequest = {
          rentalId: rentalId as string
        };
      }

      // Get sentiment data grouped by day
      const sentimentData = await prisma.message.findMany({
        where: whereClause,
        select: {
          sentAt: true,
          sentiment: true,
          sentimentScore: true,
          category: true,
          MaintenanceRequest: {
            select: {
              rentalId: true,
              Rental: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        orderBy: {
          sentAt: 'asc'
        }
      });

      // Group by day and calculate averages
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
            scores: []
          };
        }
        
        acc[date][message.sentiment?.toLowerCase() || 'neutral']++;
        acc[date].total++;
        if (message.sentimentScore !== null) {
          acc[date].scores.push(message.sentimentScore);
        }
        
        return acc;
      }, {});

      // Calculate average scores and format response
      const trends = Object.values(trendData).map((day: any) => ({
        ...day,
        averageScore: day.scores.length > 0 
          ? day.scores.reduce((sum: number, score: number) => sum + score, 0) / day.scores.length 
          : 0,
        positivePercentage: (day.positive / day.total) * 100,
        negativePercentage: (day.negative / day.total) * 100,
        neutralPercentage: (day.neutral / day.total) * 100
      }));

      res.json({
        success: true,
        data: {
          trends,
          summary: {
            totalMessages: sentimentData.length,
            averageScore: sentimentData.reduce((sum, msg) => sum + (msg.sentimentScore || 0), 0) / sentimentData.length,
            sentimentDistribution: {
              positive: sentimentData.filter(m => m.sentiment === 'POSITIVE').length,
              negative: sentimentData.filter(m => m.sentiment === 'NEGATIVE').length,
              neutral: sentimentData.filter(m => m.sentiment === 'NEUTRAL').length
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching sentiment trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sentiment trends'
      });
    }
  }

  /**
   * GET /api/tenant/common-issues
   * Returns most common complaint categories
   */
  static async getCommonIssues(req: Request, res: Response) {
    try {
      const { timeframe = '30d', rentalId } = req.query;
      
      const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const whereClause: any = {
        sentAt: {
          gte: startDate
        },
        category: {
          not: null
        },
        sentiment: 'NEGATIVE' // Focus on negative sentiment for issues
      };

      if (rentalId) {
        whereClause.MaintenanceRequest = {
          rentalId: rentalId as string
        };
      }

      // Get issue categories with counts
      const issueData = await prisma.message.groupBy({
        by: ['category'],
        where: whereClause,
        _count: {
          category: true
        },
        _avg: {
          sentimentScore: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        }
      });

      // Get recent examples for each category
      const issuesWithExamples = await Promise.all(
        issueData.slice(0, 10).map(async (issue) => {
          const examples = await prisma.message.findMany({
            where: {
              ...whereClause,
              category: issue.category
            },
            select: {
              content: true,
              sentAt: true,
              sentimentScore: true,
              MaintenanceRequest: {
                select: {
                  title: true,
                  Rental: {
                    select: {
                      title: true
                    }
                  }
                }
              }
            },
            orderBy: {
              sentAt: 'desc'
            },
            take: 3
          });

          return {
            category: issue.category,
            count: issue._count.category,
            averageSentiment: issue._avg.sentimentScore || 0,
            examples: examples.map(ex => ({
              content: ex.content.substring(0, 100) + (ex.content.length > 100 ? '...' : ''),
              date: ex.sentAt,
              property: ex.MaintenanceRequest?.Rental?.title || 'General',
              sentimentScore: ex.sentimentScore
            }))
          };
        })
      );

      res.json({
        success: true,
        data: {
          commonIssues: issuesWithExamples,
          totalIssues: issueData.reduce((sum, issue) => sum + issue._count.category, 0)
        }
      });
    } catch (error) {
      console.error('Error fetching common issues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch common issues'
      });
    }
  }

  /**
   * GET /api/tenant/early-warnings
   * Returns early warning indicators
   */
  static async getEarlyWarnings(req: Request, res: Response) {
    try {
      const { rentalId } = req.query;
      
      // Get messages marked as early warnings
      const whereClause: any = {
        isEarlyWarning: true,
        sentAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      };

      if (rentalId) {
        whereClause.MaintenanceRequest = {
          rentalId: rentalId as string
        };
      }

      const earlyWarnings = await prisma.message.findMany({
        where: whereClause,
        select: {
          id: true,
          content: true,
          sentAt: true,
          sentiment: true,
          sentimentScore: true,
          category: true,
          User_Message_senderIdToUser: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          MaintenanceRequest: {
            select: {
              id: true,
              title: true,
              priority: true,
              status: true,
              Rental: {
                select: {
                  title: true,
                  address: true
                }
              }
            }
          }
        },
        orderBy: {
          sentAt: 'desc'
        }
      });

      // Analyze patterns for additional warnings
      const recentNegativeTrends = await prisma.message.findMany({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          },
          sentiment: 'NEGATIVE',
          sentimentScore: {
            lt: -0.5
          }
        },
        select: {
          senderId: true,
          category: true,
          sentAt: true,
          MaintenanceRequest: {
            select: {
              rentalId: true,
              Rental: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      });

      // Group by sender to identify tenants with multiple negative messages
      const tenantConcerns = recentNegativeTrends.reduce((acc: any, message) => {
        const key = message.senderId;
        if (!acc[key]) {
          acc[key] = {
            senderId: key,
            negativeMessages: 0,
            categories: new Set(),
            properties: new Set()
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
          riskLevel: tenant.negativeMessages >= 3 ? 'HIGH' : 'MEDIUM'
        }));

      res.json({
        success: true,
        data: {
          activeWarnings: earlyWarnings.map(warning => ({
            id: warning.id,
            message: warning.content.substring(0, 150) + (warning.content.length > 150 ? '...' : ''),
            tenant: `${warning.User_Message_senderIdToUser.firstName} ${warning.User_Message_senderIdToUser.lastName}`,
            category: warning.category,
            sentiment: warning.sentiment,
            sentimentScore: warning.sentimentScore,
            date: warning.sentAt,
            property: warning.MaintenanceRequest?.Rental?.title || 'General',
            maintenanceRequest: warning.MaintenanceRequest ? {
              id: warning.MaintenanceRequest.id,
              title: warning.MaintenanceRequest.title,
              priority: warning.MaintenanceRequest.priority,
              status: warning.MaintenanceRequest.status
            } : null
          })),
          escalationRisks,
          summary: {
            totalWarnings: earlyWarnings.length,
            highRiskTenants: escalationRisks.filter((r: any) => r.riskLevel === 'HIGH').length,
            mediumRiskTenants: escalationRisks.filter((r: any) => r.riskLevel === 'MEDIUM').length
          }
        }
      });
    } catch (error) {
      console.error('Error fetching early warnings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch early warnings'
      });
    }
  }

  /**
   * GET /api/tenant/proactive-suggestions
   * Returns proactive suggestions based on analytics
   */
  static async getProactiveSuggestions(req: Request, res: Response) {
    try {
      const { rentalId } = req.query;

      // Analyze recent patterns to generate suggestions
      const recentMessages = await prisma.message.findMany({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          ...(rentalId && {
            MaintenanceRequest: {
              rentalId: rentalId as string
            }
          })
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
              Rental: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });

      // Generate suggestions based on patterns
      const suggestions = [];

      // Category-based suggestions
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
        stats.avgSentiment = stats.scores.length > 0 
          ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) / stats.scores.length 
          : 0;

        if (stats.negativeCount >= 2 && stats.avgSentiment < -0.3) {
          let suggestion = '';
          let priority = 'MEDIUM';
          
          switch (category) {
            case 'plumbing':
              suggestion = 'Consider scheduling preventive plumbing maintenance across affected properties to address recurring water pressure and leak issues.';
              priority = 'HIGH';
              break;
            case 'hvac':
              suggestion = 'HVAC systems may need inspection. Consider scheduling seasonal maintenance to prevent cooling/heating issues.';
              priority = 'HIGH';
              break;
            case 'noise_complaint':
              suggestion = 'Implement noise policies and consider soundproofing improvements in units with recurring complaints.';
              priority = 'MEDIUM';
              break;
            case 'accessibility':
              suggestion = 'Review accessibility features and ensure all building systems (elevators, ramps) are functioning properly.';
              priority = 'HIGH';
              break;
            case 'emergency':
              suggestion = 'Review emergency response procedures and ensure all safety systems are up to date.';
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
            averageSentiment: stats.avgSentiment
          });
        }
      });

      // Early warning suggestions
      const earlyWarningCount = recentMessages.filter(m => m.isEarlyWarning).length;
      if (earlyWarningCount >= 3) {
        suggestions.push({
          type: 'early_warning_trend',
          priority: 'HIGH',
          suggestion: 'Multiple early warning indicators detected. Consider implementing proactive communication and maintenance scheduling.',
          affectedMessages: earlyWarningCount
        });
      }

      // Property-specific suggestions
      const propertyStats = recentMessages.reduce((acc: any, msg) => {
        const propertyId = msg.MaintenanceRequest?.Rental?.id;
        if (propertyId) {
          if (!acc[propertyId]) {
            acc[propertyId] = {
              title: msg.MaintenanceRequest?.Rental?.title,
              negativeCount: 0,
              totalCount: 0,
              scores: []
            };
          }
          acc[propertyId].totalCount++;
          if (msg.sentiment === 'NEGATIVE') acc[propertyId].negativeCount++;
          if (msg.sentimentScore !== null) acc[propertyId].scores.push(msg.sentimentScore);
        }
        return acc;
      }, {});

      Object.entries(propertyStats).forEach(([propertyId, stats]: [string, any]) => {
        const negativeRatio = stats.negativeCount / stats.totalCount;
        const avgSentiment = stats.scores.length > 0 
          ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) / stats.scores.length 
          : 0;

        if (negativeRatio > 0.4 && avgSentiment < -0.2) {
          suggestions.push({
            type: 'property_concern',
            priority: 'MEDIUM',
            suggestion: `Property "${stats.title}" showing concerning tenant sentiment trends. Consider scheduling a property review and tenant check-in.`,
            property: stats.title,
            negativeRatio: Math.round(negativeRatio * 100),
            averageSentiment: avgSentiment
          });
        }
      });

      // Sort suggestions by priority
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      suggestions.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);

      res.json({
        success: true,
        data: {
          suggestions,
          summary: {
            totalSuggestions: suggestions.length,
            criticalSuggestions: suggestions.filter(s => s.priority === 'CRITICAL').length,
            highPrioritySuggestions: suggestions.filter(s => s.priority === 'HIGH').length,
            mediumPrioritySuggestions: suggestions.filter(s => s.priority === 'MEDIUM').length
          }
        }
      });
    } catch (error) {
      console.error('Error generating proactive suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate proactive suggestions'
      });
    }
  }
}

export default TenantAnalyticsController;