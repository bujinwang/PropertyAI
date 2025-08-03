import { prisma } from '../config/database';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';

class TaxDocumentService {
  public async generateTaxDocument(rentalId: string, year: number): Promise<string | null> {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        RentalImages: true,
      },
    });

    if (!rental) {
      return null;
    }

    const doc = new PDFDocument();
    const filePath = `./tax-document-${rentalId}-${year}.pdf`;
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(25).text(`Tax Document for ${rental.title} - ${year}`, {
      align: 'center',
    });

    doc.moveDown();

    // For tax document generation, we'll need to get related financial data
    // This is a simplified approach - you may need to adjust based on your actual data structure
    const totalRent = rental.rent || 0;
    
    // Get maintenance costs for this specific rental
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        rentalId: rentalId,
        completedDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    });

    const totalMaintenanceCost = maintenanceRequests.reduce((acc: number, request: any) => {
      return acc + (request.actualCost || 0);
    }, 0);

    doc.fontSize(16).text(`Total Rent Income: $${totalRent}`);
    doc.fontSize(16).text(`Total Maintenance Costs: $${totalMaintenanceCost}`);
    doc.fontSize(16).text(`Net Income: $${totalRent - totalMaintenanceCost}`);

    doc.end();

    return filePath;
  }
}

export const taxDocumentService = new TaxDocumentService();
