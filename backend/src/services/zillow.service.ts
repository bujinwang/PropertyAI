class ZillowService {
  async publish(listingData: any): Promise<any> {
    console.log('Publishing to Zillow:', listingData);
    return { success: true, message: 'Published to Zillow' };
  }
}

export const zillowService = new ZillowService();
