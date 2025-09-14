import { Report, TrendData } from '../services/dashboardService';

export interface CSVExportOptions {
  filename?: string;
  delimiter?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

export class CSVExport {
  private options: CSVExportOptions;

  constructor(options: CSVExportOptions = {}) {
    this.options = {
      filename: 'export.csv',
      delimiter: ',',
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD',
      ...options,
    };
  }

  exportData(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    let csv = '';

    // Add headers
    if (this.options.includeHeaders) {
      csv += headers.join(this.options.delimiter!) + '\n';
    }

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return this.formatValue(value);
      });
      csv += values.join(this.options.delimiter!) + '\n';
    });

    return csv;
  }

  exportTrendData(trendData: TrendData[]): string {
    const formattedData = trendData.map(item => ({
      date: item.date,
      value: item.value,
      label: item.label || '',
    }));

    return this.exportData(formattedData);
  }

  exportReport(report: Report): string {
    let csv = '';

    // Add report metadata
    const metadata = [
      { field: 'Report Name', value: report.name },
      { field: 'Type', value: report.type },
      { field: 'Generated At', value: report.generatedAt || new Date().toISOString() },
      { field: 'Status', value: report.status },
    ];

    csv += this.exportData(metadata);
    csv += '\n\n';

    // Add report data
    if (report.data && Array.isArray(report.data)) {
      csv += this.exportData(report.data);
    }

    return csv;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Escape quotes and wrap in quotes if contains delimiter, quotes, or newlines
    if (stringValue.includes(this.options.delimiter!) ||
        stringValue.includes('"') ||
        stringValue.includes('\n')) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  download(csv: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = this.options.filename!;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // Utility method for quick export
  static exportToCSV(
    data: any[],
    filename: string = 'export.csv',
    options?: Partial<CSVExportOptions>
  ): void {
    const exporter = new CSVExport({ filename, ...options });
    const csv = exporter.exportData(data);
    exporter.download(csv);
  }

  // Export trend data
  static exportTrendDataToCSV(
    trendData: TrendData[],
    filename: string = 'trends.csv'
  ): void {
    const exporter = new CSVExport({ filename });
    const csv = exporter.exportTrendData(trendData);
    exporter.download(csv);
  }

  // Export report
  static exportReportToCSV(
    report: Report,
    filename?: string
  ): void {
    const exporter = new CSVExport({
      filename: filename || `${report.name.replace(/\s+/g, '_')}.csv`
    });
    const csv = exporter.exportReport(report);
    exporter.download(csv);
  }
}

export default CSVExport;