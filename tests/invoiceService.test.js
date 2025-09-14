const invoiceService = require('../src/services/invoiceService');
const nock = require('nock'); // Not used here, but for completeness
const fs = require('fs').promises;
const path = require('path');
const Unit = require('../src/models/Unit'); // Mock
const Tenant = require('../src/models/Tenant'); // Mock
const Invoice = require('../src/models/Invoice'); // Mock

jest.mock('../src/models/Unit', () => ({
  findAll: jest.fn(),
}));

jest.mock('../src/models/Invoice', () => ({
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
  },
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/invoices/invoice.pdf'),
}));

describe('Invoice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMonthlyInvoices', () => {
    it('should generate invoices for units with tenants', async () => {
      const mockUnits = [{
        id: 'u_123',
        rentAmount: 1500,
        Tenants: [{ id: 't_123' }],
      }];
      Unit.findAll.mockResolvedValue(mockUnits);

      const mockInvoice = { id: 'i_123', update: jest.fn() };
      Invoice.create.mockResolvedValue(mockInvoice);

      const mockPdfUrl = '/invoices/i_123.pdf';
      fs.writeFile.mockResolvedValue();

      const result = await invoiceService.generateMonthlyInvoices();

      expect(Unit.findAll).toHaveBeenCalledWith({
        include: [{
          model: require('../src/models/Tenant'), // Tenant mock
          where: { isActive: true },
        }],
      });
      expect(Invoice.create).toHaveBeenCalledTimes(1);
      expect(Invoice.create).toHaveBeenCalledWith({
        unitId: 'u_123',
        tenantId: 't_123',
        dueDate: expect.any(Date),
        amount: 1500,
        status: 'pending',
      });
      expect(mockInvoice.update).toHaveBeenCalledWith({ pdfUrl: mockPdfUrl });
      expect(result).toHaveLength(1);
    });

    it('should handle no units with tenants', async () => {
      Unit.findAll.mockResolvedValue([]);

      const result = await invoiceService.generateMonthlyInvoices();

      expect(result).toHaveLength(0);
    });

    it('should throw error if invoice creation fails', async () => {
      Unit.findAll.mockResolvedValue([{ id: 'u_123', Tenants: [{ id: 't_123' }] }]);
      Invoice.create.mockRejectedValue(new Error('DB error'));

      await expect(invoiceService.generateMonthlyInvoices()).rejects.toThrow('DB error');
    });
  });

  describe('generateInvoicePDF', () => {
    it('should generate PDF and return URL', async () => {
      const mockInvoice = { id: 'i_456', dueDate: new Date('2025-10-01'), amount: 1500 };
      const mockPdfDoc = { addPage: jest.fn().mockReturnValue({ drawText: jest.fn(), getSize: jest.fn().mockReturnValue({ width: 595, height: 842 }) }), save: jest.fn().mockResolvedValue(Buffer.from('pdf')) };
      require('pdf-lib').PDFDocument.create = jest.fn().mockResolvedValue(mockPdfDoc);

      const result = await invoiceService.generateInvoicePDF(mockInvoice);

      expect(result).toBe('/invoices/i_456.pdf');
      expect(fs.writeFile).toHaveBeenCalledWith('/mock/invoices/i_456.pdf', expect.any(Buffer));
    });

    it('should handle PDF generation error', async () => {
      require('pdf-lib').PDFDocument.create = jest.fn().mockRejectedValue(new Error('PDF error'));

      const mockInvoice = { id: 'i_error' };
      await expect(invoiceService.generateInvoicePDF(mockInvoice)).rejects.toThrow('PDF error');
    });
  });
});