const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

const generateInvoicePDF = async (invoice) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title
    page.drawText('Invoice', {
      x: 50,
      y: height - 100,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });

    // Invoice details
    page.drawText(`Invoice ID: ${invoice.id}`, {
      x: 50,
      y: height - 130,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, {
      x: 50,
      y: height - 150,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Amount Due: $${invoice.amount.toFixed(2)}`, {
      x: 50,
      y: height - 170,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Unit ID: ${invoice.unitId}`, {
      x: 50,
      y: height - 190,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Tenant ID: ${invoice.tenantId}`, {
      x: 50,
      y: height - 210,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Footer
    page.drawText('Thank you for your business!', {
      x: 50,
      y: 50,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    // Save to file system (in production, use cloud storage)
    const pdfPath = path.join(__dirname, '../invoices', `${invoice.id}.pdf`);
    await fs.mkdir(path.dirname(pdfPath), { recursive: true });
    await fs.writeFile(pdfPath, pdfBytes);

    return `/invoices/${invoice.id}.pdf`;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate invoice PDF');
  }
};

module.exports = {
  generateInvoicePDF,
};