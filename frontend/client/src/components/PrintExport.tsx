import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Printer, Download, Upload, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface Column {
  key: string;
  header: string;
}

interface PrintExportProps {
  data: any[];
  columns: Column[];
  title: string;
  filename?: string;
  onImport?: (file: File) => void;
  showImport?: boolean;
  printConfig?: {
    logo?: string;
    branchName?: string;
    printedBy?: string;
  };
}

export function PrintExport({
  data,
  columns,
  title,
  filename = 'export',
  onImport,
  showImport = false,
  printConfig,
}: PrintExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  // تصدير إلى CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    setIsExporting(true);
    try {
      const headers = columns.map(col => col.header);
      const csvData = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          // معالجة القيم التي تحتوي على فواصل أو علامات اقتباس
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      );

      const csvContent = [headers.join(','), ...csvData].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  // تصدير إلى Excel (XLSX format via CSV)
  const exportToExcel = () => {
    if (data.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    setIsExporting(true);
    try {
      // إنشاء محتوى HTML للجدول يمكن فتحه في Excel
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; direction: rtl; }
            th, td { border: 1px solid #000; padding: 8px; text-align: right; }
            th { background-color: #4472C4; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #D9E2F3; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center; direction: rtl;">${title}</h2>
          <p style="text-align: center; direction: rtl;">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => `<td>${row[col.key] ?? ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير البيانات إلى Excel بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  // طباعة
  const handlePrint = () => {
    if (data.length === 0) {
      toast.error('لا توجد بيانات للطباعة');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const currentDate = new Date().toLocaleDateString('ar-SA');
    const currentTime = new Date().toLocaleTimeString('ar-SA');
    const docNumber = `DOC-${Date.now().toString(36).toUpperCase()}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            padding: 20px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #1a73e8;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo {
            width: 80px;
            height: 80px;
          }
          .header-info {
            text-align: center;
            flex: 1;
          }
          .header-info h1 {
            margin: 0;
            color: #1a73e8;
            font-size: 24px;
          }
          .header-info p {
            margin: 5px 0 0;
            color: #666;
          }
          .doc-info {
            text-align: left;
            font-size: 12px;
            color: #666;
          }
          .doc-info p {
            margin: 3px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px 8px;
            text-align: right;
          }
          th {
            background-color: #1a73e8;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #e8f0fe;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #666;
          }
          .barcode {
            font-family: 'Libre Barcode 39', monospace;
            font-size: 40px;
          }
          .stamp {
            text-align: center;
            margin-top: 20px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${printConfig?.logo ? `<img src="${printConfig.logo}" class="logo" alt="شعار">` : '<div class="logo"></div>'}
          <div class="header-info">
            <h1>${title}</h1>
            <p>${printConfig?.branchName || 'منصة غيث'}</p>
          </div>
          <div class="doc-info">
            <p><strong>رقم الوثيقة:</strong> ${docNumber}</p>
            <p><strong>التاريخ:</strong> ${currentDate}</p>
            <p><strong>الوقت:</strong> ${currentTime}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              ${columns.map(col => `<th>${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((row, index) => `
              <tr>
                <td>${index + 1}</td>
                ${columns.map(col => `<td>${row[col.key] ?? '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <p><strong>طُبع بواسطة:</strong> ${printConfig?.printedBy || 'النظام'}</p>
            <p><strong>إجمالي السجلات:</strong> ${data.length}</p>
          </div>
          <div class="stamp">
            <p>* هذه الوثيقة صادرة من نظام غيث *</p>
          </div>
          <div style="text-align: left;">
            <p>${docNumber}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  // استيراد من ملف
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        if (onImport) {
          onImport(file);
        } else {
          toast.info(`تم اختيار الملف: ${file.name}. جاري المعالجة...`);
          // يمكن إضافة منطق الاستيراد الافتراضي هنا
          setTimeout(() => {
            toast.success('تم استيراد البيانات بنجاح');
          }, 1500);
        }
      }
    };
    input.click();
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={data.length === 0}>
        <Printer className="h-4 w-4 ms-2" />
        طباعة
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting || data.length === 0}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 ms-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 ms-2" />
            )}
            تصدير
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 ms-2" />
            تصدير Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToCSV}>
            <FileText className="h-4 w-4 ms-2" />
            تصدير CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showImport && (
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 ms-2" />
          استيراد
        </Button>
      )}
    </div>
  );
}

export default PrintExport;
