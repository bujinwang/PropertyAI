import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Report, TrendData } from '../services/dashboardService';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  includeTables?: boolean;
  branding?: {
    logo?: string;
    companyName?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
}

export class PDFExport {
  private doc: jsPDF;
  private options: PDFExportOptions;

  constructor(options: PDFExportOptions = {}) {
    this.options = {
      title: 'Report',
      includeCharts: true,
      includeTables: true,
      pageOrientation: 'portrait',
      pageSize: 'a4',
      ...options,
    };

    this.doc = new jsPDF({
      orientation: this.options.pageOrientation,
      unit: 'mm',
      format: this.options.pageSize,
    });
  }

  async generateReport(data: any, template?: any): Promise<Blob> {
    this.addHeader();
    this.addTitle();

    if (this.options.includeTables && data.tableData) {
      this.addTable(data.tableData);
    }

    if (this.options.includeCharts && data.chartData) {
      await this.addCharts(data.chartData);
    }

    this.addFooter();

    return this.doc.output('blob');
  }

  private addHeader() {
    const pageWidth = this.doc.internal.pageSize.width;

    // Add logo if provided
    if (this.options.branding?.logo) {
      // Note: In a real implementation, you would load and add the logo image
      // this.doc.addImage(this.options.branding.logo, 'PNG', 10, 10, 30, 30);
    }

    // Add company name
    if (this.options.branding?.companyName) {
      this.doc.setFontSize(16);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(this.options.branding.companyName, 10, 20);
    }

    // Add report generation date
    this.doc.setFontSize(10);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 60, 20);
  }

  private addTitle() {
    const pageWidth = this.doc.internal.pageSize.width;

    this.doc.setFontSize(20);
    this.doc.setTextColor(0, 0, 0);

    // Center the title
    const titleWidth = this.doc.getTextWidth(this.options.title!);
    const titleX = (pageWidth - titleWidth) / 2;
    this.doc.text(this.options.title!, titleX, 50);

    if (this.options.subtitle) {
      this.doc.setFontSize(14);
      this.doc.setTextColor(128, 128, 128);
      const subtitleWidth = this.doc.getTextWidth(this.options.subtitle);
      const subtitleX = (pageWidth - subtitleWidth) / 2;
      this.doc.text(this.options.subtitle, subtitleX, 65);
    }
  }

  private addTable(data: any[]) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        return value !== null && value !== undefined ? String(value) : '';
      })
    );

    this.doc.autoTable({
      head: [headers],
      body: rows,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: this.hexToRgb(this.options.branding?.colors?.primary || '#1976d2'),
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
  }

  private async addCharts(chartData: any[]) {
    // Note: Adding actual chart images to PDF would require additional libraries
    // For now, we'll add placeholder text
    let yPosition = 100;

    chartData.forEach((chart, index) => {
      if (yPosition > 250) {
        this.doc.addPage();
        yPosition = 20;
      }

      this.doc.setFontSize(14);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`Chart ${index + 1}: ${chart.title || 'Chart'}`, 10, yPosition);

      // In a real implementation, you would:
      // 1. Generate chart as image using a library like html2canvas
      // 2. Add the image to the PDF
      // this.doc.addImage(chartImage, 'PNG', 10, yPosition + 10, 180, 100);

      this.doc.setFontSize(10);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('[Chart would be displayed here]', 10, yPosition + 20);

      yPosition += 50;
    });
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      const pageWidth = this.doc.internal.pageSize.width;
      const pageHeight = this.doc.internal.pageSize.height;

      this.doc.setFontSize(8);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [25, 118, 210]; // Default blue
  }

  // Utility method to export data to PDF
  static async exportToPDF(
    data: any,
    filename: string = 'report.pdf',
    options?: PDFExportOptions
  ): Promise<void> {
    const exporter = new PDFExport(options);
    const pdfBlob = await exporter.generateReport(data);

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default PDFExport;