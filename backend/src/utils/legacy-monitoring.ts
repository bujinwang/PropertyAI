
// Legacy Route Usage Monitoring
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LegacyRouteUsage {
  route: string;
  method: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  userId?: string;
}

export class LegacyRouteMonitor {
  static async logUsage(req: Request, route: string) {
    try {
      await prisma.legacyRouteUsage.create({
        data: {
          route: route,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          userId: req.user?.id,
          timestamp: new Date(),
        }
      });
    } catch (error) {
      console.error('Failed to log legacy route usage:', error);
    }
  }

  static async getUsageStats(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await prisma.legacyRouteUsage.groupBy({
      by: ['route', 'method'],
      where: {
        timestamp: { gte: since }
      },
      _count: true,
      orderBy: {
        _count: { route: 'desc' }
      }
    });

    return stats;
  }

  static async generateUsageReport() {
    const stats = await this.getUsageStats();
    
    console.log('\n📊 Legacy Route Usage Report (Last 30 days)');
    console.log('=' .repeat(60));
    
    stats.forEach(stat => {
      console.log(`${stat.method} ${stat.route}: ${stat._count} requests`);
    });
    
    return stats;
  }
}

// Middleware to track legacy route usage
export const trackLegacyUsage = (route: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await LegacyRouteMonitor.logUsage(req, route);
    next();
  };
};
