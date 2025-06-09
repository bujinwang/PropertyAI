class TruliaService {
  async publish(listingData: any): Promise<any> {
    console.log('Publishing to Trulia:', listingData);
    return { success: true, message: 'Published to Trulia' };
  }
}

export const truliaService = new TruliaService();
