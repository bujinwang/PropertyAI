import { smartRoutingService } from './smartRouting.service';

class AIRoutingService {
  public async findBestVendor(workOrderId: string): Promise<string | null> {
    const bestVendor = await smartRoutingService.findBestVendor(workOrderId);
    return bestVendor ? bestVendor.id : null;
  }
}

export const aiRoutingService = new AIRoutingService();
