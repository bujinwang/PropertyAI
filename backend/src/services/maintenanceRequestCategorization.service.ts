import { prisma } from '../config/database';
import { MaintenanceRequest, MaintenanceRequestCategory } from '@prisma/client';
import { generativeAIService } from './generativeAI.service';

class MaintenanceRequestCategorizationService {
  public async categorizeRequest(
    maintenanceRequestId: string
  ): Promise<MaintenanceRequestCategory | null> {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequestId },
    });

    if (maintenanceRequest) {
      const prompt = `Categorize the following maintenance request based on its title and description.
        Title: ${maintenanceRequest.title}
        Description: ${maintenanceRequest.description}
        
        Provide only the category name from the following list: Plumbing, Electrical, HVAC, Carpentry, Painting, Other.`;

      const aiCategory = await generativeAIService.generateText(prompt);

      const category = await prisma.maintenanceRequestCategory.findFirst({
        where: { name: aiCategory.trim() },
      });

      if (category) {
        await prisma.maintenanceRequest.update({
          where: { id: maintenanceRequestId },
          data: { categoryId: category.id },
        });
        return category;
      } else {
        // If AI returns an unrecognized category, default to 'Other'
        const otherCategory = await prisma.maintenanceRequestCategory.findFirst({
          where: { name: 'Other' },
        });
        if (otherCategory) {
          await prisma.maintenanceRequest.update({
            where: { id: maintenanceRequestId },
            data: { categoryId: otherCategory.id },
          });
          return otherCategory;
        }
      }
    }

    return null;
  }
}

export const maintenanceRequestCategorizationService =
  new MaintenanceRequestCategorizationService();
