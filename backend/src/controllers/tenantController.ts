import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TenantController {
  async getAllTenants(req: Request, res: Response) {
    try {
      const tenants = await prisma.user.findMany({
        where: { role: 'TENANT' },
      });
      res.status(200).json(tenants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchTenants(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const searchQuery = q.toLowerCase();
      
      // Search tenants with their current lease and property information
      const tenants = await prisma.user.findMany({
        where: {
          role: 'TENANT',
          OR: [
            {
              firstName: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              lastName: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            }
          ]
        },
        include: {
          Lease: {
            where: {
              status: 'ACTIVE'
            },
            include: {
              Rental: {
                select: {
                  address: true,
                  city: true,
                  state: true,
                  zipCode: true
                }
              }
            },
            orderBy: {
              startDate: 'desc'
            },
            take: 1
          }
        },
        take: 20 // Limit results for performance
      });

      // Transform the data to match the expected interface
      const searchResults = tenants.map(tenant => {
        const currentLease = tenant.Lease[0];
        return {
          id: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email,
          property: currentLease ? {
            address: `${currentLease.Rental.address}, ${currentLease.Rental.city}, ${currentLease.Rental.state} ${currentLease.Rental.zipCode}`,
            unit: 'N/A' // Unit info not available in current schema
          } : {
            address: 'No active lease',
            unit: 'N/A'
          },
          currentLease: currentLease ? {
            id: currentLease.id,
            startDate: currentLease.startDate.toISOString(),
            endDate: currentLease.endDate.toISOString()
          } : undefined
        };
      });

      res.status(200).json({
        tenants: searchResults,
        total: searchResults.length
      });
    } catch (error: any) {
      console.error('Error searching tenants:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TenantController();
