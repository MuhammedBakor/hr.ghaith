import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  filename: string;
  title: string;
  className?: string;
}

export function ExportButtons({
  data,
  columns,
  filename,
  title,
  className,
}: ExportButtonsProps) {
  // تصدير إلى CSV (يمكن فتحه في Excel)
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    // إنشاء رأس الجدول
    const headers = columns.map((col) => col.label).join(",");

    // إنشاء صفوف البيانات
    const rows = data.map((row) => {
      return columns
        .map((col) => {
          const value = row[col.key];
          // التعامل مع القيم التي تحتوي على فواصل أو أسطر جديدة
          if (typeof value === "string" && (value.includes(",") || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",");
    });

    // دمج الرأس والصفوف
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // BOM للدعم العربي

    // إنشاء ملف للتحميل
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تصدير إلى PDF
  const exportToPDF = () => {
    if (!data || data.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    // الحصول على شعار المنظمة
    const logo = import.meta.env.VITE_APP_LOGO || "/logo.svg";
    const appTitle = import.meta.env.VITE_APP_TITLE || "منصة غيث";

    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للتصدير");
      return;
    }

    // إنشاء جدول HTML
    const tableHeaders = columns.map((col) => `<th>${col.label}</th>`).join("");
    const tableRows = data
      .map((row) => {
        const cells = columns
          .map((col) => `<td>${row[col.key] ?? ""}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    // إنشاء محتوى PDF
    const pdfContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - ${appTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            padding: 20px;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #10b981;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-section img {
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          .logo-section h1 {
            font-size: 24px;
            color: #10b981;
          }
          .print-info {
            text-align: left;
            font-size: 12px;
            color: #666;
          }
          .title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
          }
          th {
            background-color: #10b981;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <img src="${logo}" alt="Logo" onerror="this.style.display='none'" />
            <h1>${appTitle}</h1>
          </div>
          <div class="print-info">
            <div>تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}</div>
            <div>الوقت: ${new Date().toLocaleTimeString("ar-SA")}</div>
          </div>
        </div>
        <h2 class="title">${title}</h2>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <div>تم إنشاء هذا التقرير بواسطة ${appTitle}</div>
          <div>جميع الحقوق محفوظة © ${new Date().getFullYear()}</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <FileSpreadsheet className="h-4 w-4 ms-2" />
        تصدير Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportToPDF}>
        <FileText className="h-4 w-4 ms-2" />
        تصدير PDF
      </Button>
    </div>
  );
}

export default ExportButtons;
