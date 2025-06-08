import { prisma } from '../config/database';
import { MaintenanceRequest, MaintenanceRequestCategory } from '@prisma/client';

class MaintenanceRequestCategorizationService {
  public async categorizeRequest(
    maintenanceRequestId: string
  ): Promise<MaintenanceRequestCategory | null> {
    // This is a placeholder for the actual categorization logic.
    // In a real application, this would involve using a machine learning model
    // to categorize the request based on its title and description.
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (maintenanceRequest) {
      const categories = await prisma.maintenanceRequestCategory.findMany();
      if (categories.length > 0) {
        // For now, just assign a random category
        const randomIndex = Math.floor(Math.random() * categories.length);
        const category = categories[randomIndex];

        await prisma.maintenanceRequest.update({
          where: { id: maintenanceRequestId },
          data: { categoryId: category.id },
        });

        return category;
      }
    }

    return null;
  }
}

export const maintenanceRequestCategorizationService =
  new MaintenanceRequestCategorizationService();
