import { prisma } from '../config/database';

class AIRoutingService {
  public async findBestVendor(workOrderId: string): Promise<string | null> {
    // In a real application, this would involve a call to an AI service
    // (e.g., Gemini) to determine the best vendor based on the work order details.
    // For now, we'll simulate this by randomly selecting a vendor.
    const vendors = await prisma.vendor.findMany();
    if (vendors.length > 0) {
      const randomIndex = Math.floor(Math.random() * vendors.length);
      return vendors[randomIndex].id;
    }
    return null;
  }
}

export const aiRoutingService = new AIRoutingService();
