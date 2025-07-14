import { prisma } from '../config/database';
import PDFDocument from 'pdfkit';
import fs from 'fs';

class TaxDocumentService {
  public async generateTaxDocument(propertyId: string, year: number): Promise<string | null> {
    const property = await prisma.property.findUnique({
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

    const doc = new PDFDocument();
    const filePath = `./tax-document-${propertyId}-${year}.pdf`;
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(25).text(`Tax Document for ${property.name} - ${year}`, {
      align: 'center',
    });

    doc.moveDown();

    const totalRent = (property as any).units.reduce((acc: number, unit: any) => {
      return acc + (unit.lease ? unit.lease.transactions.reduce((acc: number, transaction: any) => {
        if (transaction.type === 'RENT' && transaction.status === 'COMPLETED' && new Date(transaction.processedAt!).getFullYear() === year) {
          return acc + transaction.amount;
        }
        return acc;
      }, 0) : 0);
    }, 0);

    const totalMaintenanceCost = (property as any).maintenanceRequests.reduce((acc: number, request: any) => {
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

export const taxDocumentService = new TaxDocumentService();
