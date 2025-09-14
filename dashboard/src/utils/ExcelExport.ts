import * as XLSX from 'xlsx';
import { Report, TrendData } from '../services/dashboardService';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeCharts?: boolean;
  includeFormatting?: boolean;
}

export class ExcelExport {
  private workbook: XLSX.WorkBook;
  private options: ExcelExportOptions;

  constructor(options: ExcelExportOptions = {}) {
    this.options = {
      filename: 'report.xlsx',
      sheetName: 'Report',
      includeCharts: false,
      includeFormatting: true,
      ...options,
    };

    this.workbook = XLSX.utils.book_new();
  }

  exportData(data: any[], sheetName?: string): void {
    const ws = XLSX.utils.json_to_sheet(data);

    // Apply basic formatting if enabled
    if (this.options.includeFormatting) {
      this.applyFormatting(ws, data);
    }

    XLSX.utils.book_append_sheet(
      this.workbook,
      ws,
      sheetName || this.options.sheetName!
    );
  }

  exportMultipleSheets(sheets: { name: string; data: any[] }[]): void {
    sheets.forEach(({ name, data }) => {
      this.exportData(data, name);
    });
  }

  exportReport(report: Report): void {
    // Main data sheet
    if (report.data && Array.isArray(report.data)) {
      this.exportData(report.data, 'Data');
    }

    // Summary sheet
    const summaryData = [
      { Field: 'Report Name', Value: report.name },
      { Field: 'Type', Value: report.type },
      { Field: 'Generated At', Value: report.generatedAt },
      { Field: 'Status', Value: report.status },
    ];
    this.exportData(summaryData, 'Summary');
  }

  exportTrendData(trendData: TrendData[], title: string = 'Trends'): void {
    const formattedData = trendData.map(item => ({
      Date: item.date,
      Value: item.value,
      Label: item.label || '',
    }));

    this.exportData(formattedData, title);
  }

  private applyFormatting(ws: XLSX.WorkSheet, data: any[]): void {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Style headers
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1976D2' } },
        alignment: { horizontal: 'center' },
      };
    }

    // Auto-size columns
    const colWidths = headers.map(header => ({
      wch: Math.max(header.length, ...data.map(row => String(row[header] || '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
  }

  save(): void {
    XLSX.writeFile(this.workbook, this.options.filename!);
  }

  // Utility method for quick export
  static exportToExcel(
    data: any[],
    filename: string = 'export.xlsx',
    sheetName: string = 'Sheet1'
  ): void {
    const exporter = new ExcelExport({ filename, sheetName });
    exporter.exportData(data);
    exporter.save();
  }

  // Export multiple datasets to different sheets
  static exportMultipleToExcel(
    datasets: { name: string; data: any[] }[],
    filename: string = 'export.xlsx'
  ): void {
    const exporter = new ExcelExport({ filename });
    exporter.exportMultipleSheets(datasets);
    exporter.save();
  }

  // Export report with summary
  static exportReportToExcel(
    report: Report,
    filename?: string
  ): void {
    const exporter = new ExcelExport({
      filename: filename || `${report.name.replace(/\s+/g, '_')}.xlsx`
    });
    exporter.exportReport(report);
    exporter.save();
  }
}

export default ExcelExport;