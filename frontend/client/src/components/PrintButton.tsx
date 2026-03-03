import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  title: string;
  tableId?: string;
  className?: string;
}

export function PrintButton({ title, tableId, className }: PrintButtonProps) {
  const handlePrint = () => {
    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    // الحصول على محتوى الجدول
    let tableContent = "";
    if (tableId) {
      const table = document.getElementById(tableId);
      if (table) {
        tableContent = table.outerHTML;
      }
    } else {
      // البحث عن أول جدول في الصفحة
      const table = document.querySelector("table");
      if (table) {
        tableContent = table.outerHTML;
      }
    }

    // الحصول على شعار المنظمة
    const logo = import.meta.env.VITE_APP_LOGO || "/logo.svg";
    const appTitle = import.meta.env.VITE_APP_TITLE || "منصة غيث";

    // إنشاء محتوى الطباعة
    const printContent = `
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
          tr:hover {
            background-color: #f5f5f5;
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
            .no-print {
              display: none;
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
            <div>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")}</div>
            <div>الوقت: ${new Date().toLocaleTimeString("ar-SA")}</div>
          </div>
        </div>
        <h2 class="title">${title}</h2>
        ${tableContent}
        <div class="footer">
          <div>تم إنشاء هذا التقرير بواسطة ${appTitle}</div>
          <div>جميع الحقوق محفوظة © ${new Date().getFullYear()}</div>
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
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className={className}
    >
      <Printer className="h-4 w-4 ms-2" />
      طباعة
    </Button>
  );
}

export default PrintButton;
