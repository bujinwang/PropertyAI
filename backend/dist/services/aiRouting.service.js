"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutingService = void 0;
const database_1 = require("../config/database");
class AIRoutingService {
    async findBestVendor(workOrderId) {
        // In a real application, this would involve a call to an AI service
        // (e.g., Gemini) to determine the best vendor based on the work order details.
        // For now, we'll simulate this by randomly selecting a vendor.
        const vendors = await database_1.prisma.vendor.findMany();
        if (vendors.length > 0) {
            const randomIndex = Math.floor(Math.random() * vendors.length);
            return vendors[randomIndex].id;
        }
        return null;
    }
}
exports.aiRoutingService = new AIRoutingService();
//# sourceMappingURL=aiRouting.service.js.map