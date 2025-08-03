import { prisma } from '../config/database';

class RoiService {
  public async calculateRoi(rentalId: string): Promise<any | null> {
    // Try to find rental by ID first
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        RentalImages: true,
      },
    });

    if (!rental) {
      return null;
    }

    // For ROI calculation, we'll need to get related financial data
    // This is a simplified approach - you may need to adjust based on your actual data structure
    const totalRent = rental.rent || 0;
    
    // Get maintenance costs - this might need adjustment based on your actual schema
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        rentalId: rental.id,
      }
    });

    const totalMaintenanceCost = maintenanceRequests.reduce((acc: number, request: any) => {
      return acc + (request.actualCost || 0);
    }, 0);

    const netIncome = totalRent - totalMaintenanceCost;
    const initialInvestment = 1000000; // This should be replaced with the actual initial investment
    const roi = (netIncome / initialInvestment) * 100;

    return {
      rentalId,
      totalRent,
      totalMaintenanceCost,
      netIncome,
      roi,
    };
  }
}

export const roiService = new RoiService();
