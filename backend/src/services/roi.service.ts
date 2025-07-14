import { prisma } from '../config/database';

class RoiService {
  public async calculateRoi(propertyId: string): Promise<any | null> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        units: {
          include: {
            lease: {
              include: {
                transactions: true,
              },
            },
          },
        },
        maintenanceRequests: true,
      },
    });

    if (!property) {
      return null;
    }

    const totalRent = (property as any).units.reduce((acc: number, unit: any) => {
      return acc + (unit.lease ? unit.lease.transactions.reduce((acc: number, transaction: any) => {
        if (transaction.type === 'RENT' && transaction.status === 'COMPLETED') {
          return acc + transaction.amount;
        }
        return acc;
      }, 0) : 0);
    }, 0);

    const totalMaintenanceCost = (property as any).maintenanceRequests.reduce((acc: number, request: any) => {
      return acc + (request.actualCost || 0);
    }, 0);

    const netIncome = totalRent - totalMaintenanceCost;
    const initialInvestment = 1000000; // This should be replaced with the actual initial investment
    const roi = (netIncome / initialInvestment) * 100;

    return {
      propertyId,
      totalRent,
      totalMaintenanceCost,
      netIncome,
      roi,
    };
  }
}

export const roiService = new RoiService();
