
// ═══ Excel Export Utility ═══
// Creates CSV with BOM for Arabic Excel compatibility

export function generateExcelCSV(
  headers: string[],
  rows: any[][],
  options: { separator?: string; includeDate?: boolean } = {}
): string {
  const sep = options.separator || ',';
  const BOM = '\uFEFF'; // UTF-8 BOM for Arabic in Excel
  
  // Headers
  let csv = BOM;
  csv += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(sep) + '\n';
  
  // Data rows
  for (const row of rows) {
    csv += row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      if (cell instanceof Date) return `"${cell.toLocaleDateString('ar-SA')}"`;
      if (typeof cell === 'number') return String(cell);
      return `"${String(cell).replace(/"/g, '""')}"`;
    }).join(sep) + '\n';
  }
  
  if (options.includeDate) {
    csv += `\n"تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')} ${new Date().toLocaleTimeString('ar-SA')}"`;
  }
  
  return csv;
}

// ═══ Common report formatters ═══

export function formatMoney(amount: number | string, currency: string = 'ريال'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00 ' + currency;
  return num.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}
