"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxDocumentService = void 0;
const database_1 = require("../config/database");
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
class TaxDocumentService {
    async generateTaxDocument(propertyId, year) {
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
        const doc = new pdfkit_1.default();
        const filePath = `./tax-document-${propertyId}-${year}.pdf`;
        doc.pipe(fs_1.default.createWriteStream(filePath));
        doc.fontSize(25).text(`Tax Document for ${property.name} - ${year}`, {
            align: 'center',
        });
        doc.moveDown();
        const totalRent = property.units.reduce((acc, unit) => {
            return acc + (unit.lease ? unit.lease.transactions.reduce((acc, transaction) => {
                if (transaction.type === 'RENT' && transaction.status === 'COMPLETED' && new Date(transaction.processedAt).getFullYear() === year) {
                    return acc + transaction.amount;
                }
                return acc;
            }, 0) : 0);
        }, 0);
        const totalMaintenanceCost = property.maintenanceRequests.reduce((acc, request) => {
            if (request.completedDate && new Date(request.completedDate).getFullYear() === year) {
                return acc + (request.actualCost || 0);
            }
            return acc;
        }, 0);
        doc.fontSize(16).text(`Total Rent Income: $${totalRent}`);
        doc.fontSize(16).text(`Total Maintenance Costs: $${totalMaintenanceCost}`);
        doc.fontSize(16).text(`Net Income: $${totalRent - totalMaintenanceCost}`);
        doc.end();
        return filePath;
    }
}
exports.taxDocumentService = new TaxDocumentService();
//# sourceMappingURL=taxDocument.service.js.map