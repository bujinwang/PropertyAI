import { prisma } from '../config/database';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
    // SECURITY: `rentalId` is caller-controlled (route param) and was previously
    // interpolated straight into a CWD-relative path (`./tax-document-<id>-<year>.pdf`),
    // allowing path traversal and never being cleaned up. Sanitize to a safe token
    // and write into the OS temp directory so a crafted id cannot escape the dir.
    const safeRentalId = String(rentalId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'unknown';
    const safeYear = Number.isFinite(year) ? String(year) : 'unknown';
    const filePath = path.join(os.tmpdir(), `tax-document-${safeRentalId}-${safeYear}.pdf`);
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
