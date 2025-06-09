"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roiService = void 0;
const database_1 = require("../config/database");
class RoiService {
    async calculateRoi(propertyId) {
        const property = await database_1.prisma.property.findUnique({
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
        const totalRent = property.units.reduce((acc, unit) => {
            return acc + (unit.lease ? unit.lease.transactions.reduce((acc, transaction) => {
                if (transaction.type === 'RENT' && transaction.status === 'COMPLETED') {
                    return acc + transaction.amount;
                }
                return acc;
            }, 0) : 0);
        }, 0);
        const totalMaintenanceCost = property.maintenanceRequests.reduce((acc, request) => {
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
exports.roiService = new RoiService();
//# sourceMappingURL=roi.service.js.map