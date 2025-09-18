const { PrismaClient } = require('@prisma/client');
const pdfLib = require('pdf-lib'); // Assume installed
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger'); // Assume Winston

const prisma = new PrismaClient();

const generateMonthlyInvoices = async () => {
  try {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // First of next month

    // Query units with tenants
    const unitsWithTenants = await prisma.unit.findMany({
      include: {
        tenants: {
          where: { isActive: true },
        },
      },
    });

    const invoices = [];
    for (const unit of unitsWithTenants) {
      for (const tenant of unit.tenants) {
        const invoice = await prisma.invoice.create({
          data: {
            unitId: unit.id,
            tenantId: tenant.id,
            dueDate,
            amount: unit.rentAmount || 0, // Assume unit has rentAmount
            status: 'pending',
          },
        });

        // Generate PDF
        const pdfUrl = await generateInvoicePDF(invoice);
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { pdfUrl }
        });

        invoices.push(invoice);
        logger.info('Invoice generated', { invoiceId: invoice.id, tenantId: tenant.id });
      }
    }

    return invoices;
  } catch (error) {
    logger.error('Invoice generation failed', { error: error.message });
    throw error;
  }
};

const generateInvoicePDF = async (invoice) => {
  try {
    const pdfDoc = await pdfLib.PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Add content
    page.drawText(`Invoice for ${invoice.dueDate.toLocaleDateString()}`, { x: 50, y: height - 100, size: 20 });
    page.drawText(`Amount: $${invoice.amount}`, { x: 50, y: height - 130, size: 16 });
    page.drawText(`Unit: ${invoice.unitId}`, { x: 50, y: height - 160, size: 12 });
    page.drawText(`Tenant: ${invoice.tenantId}`, { x: 50, y: height - 190, size: 12 });

    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.join(__dirname, '../../invoices', `${invoice.id}.pdf`);
    await fs.writeFile(pdfPath, pdfBytes);

    return `/invoices/${invoice.id}.pdf`;
  } catch (error) {
    logger.error('PDF generation failed', { invoiceId: invoice.id, error: error.message });
    throw error;
  }
};

module.exports = {
  generateMonthlyInvoices,
  generateInvoicePDF,
};