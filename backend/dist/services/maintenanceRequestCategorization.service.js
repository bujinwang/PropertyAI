"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceRequestCategorizationService = void 0;
const database_1 = require("../config/database");
class MaintenanceRequestCategorizationService {
    async categorizeRequest(maintenanceRequestId) {
        // This is a placeholder for the actual categorization logic.
        // In a real application, this would involve using a machine learning model
        // to categorize the request based on its title and description.
        const maintenanceRequest = await database_1.prisma.maintenanceRequest.findUnique({
            where: { id: maintenanceRequestId },
        });
        if (maintenanceRequest) {
            const categories = await database_1.prisma.maintenanceRequestCategory.findMany();
            if (categories.length > 0) {
                // For now, just assign a random category
                const randomIndex = Math.floor(Math.random() * categories.length);
                const category = categories[randomIndex];
                await database_1.prisma.maintenanceRequest.update({
                    where: { id: maintenanceRequestId },
                    data: { categoryId: category.id },
                });
                return category;
            }
        }
        return null;
    }
}
exports.maintenanceRequestCategorizationService = new MaintenanceRequestCategorizationService();
//# sourceMappingURL=maintenanceRequestCategorization.service.js.map