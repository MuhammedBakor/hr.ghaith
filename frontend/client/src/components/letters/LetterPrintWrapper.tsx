import { useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LetterPrintWrapperProps {
  children: ReactNode;
  title: string;
  open: boolean;
  onClose: () => void;
}

export default function LetterPrintWrapper({ 
  children, 
  title, 
  open, 
  onClose 
}: LetterPrintWrapperProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', 'Tahoma', sans-serif;
              direction: rtl;
              background: white;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            .bg-white { background-color: white; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-red-50 { background-color: #fef2f2; }
            .bg-green-50 { background-color: #f0fdf4; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-red-600 { color: #dc2626; }
            .text-green-600 { color: #16a34a; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            .text-start { text-align: left; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .p-8 { padding: 2rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .pb-2 { padding-bottom: 0.5rem; }
            .pb-4 { padding-bottom: 1rem; }
            .pt-4 { padding-top: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-10 { margin-top: 2.5rem; }
            .mt-16 { margin-top: 4rem; }
            .me-2 { margin-right: 0.5rem; }
            .mr-auto { margin-right: auto; }
            .mx-8 { margin-left: 2rem; margin-right: 2rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .w-full { width: 100%; }
            .w-64 { width: 16rem; }
            .w-32 { width: 8rem; }
            .w-1\\/3 { width: 33.333%; }
            .h-16 { height: 4rem; }
            .h-32 { height: 8rem; }
            .h-auto { height: auto; }
            .max-w-4xl { max-width: 56rem; }
            .max-h-32 { max-height: 8rem; }
            .inline-block { display: inline-block; }
            .flex { display: flex; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .gap-8 { gap: 2rem; }
            .justify-between { justify-content: space-between; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .leading-loose { line-height: 2; }
            .border { border: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-t-2 { border-top: 2px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-b-2 { border-bottom: 2px solid #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-primary { border-color: #3b82f6; }
            .border-collapse { border-collapse: collapse; }
            .rounded { border-radius: 0.25rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .object-contain { object-fit: contain; }
            .opacity-80 { opacity: 0.8; }
            .absolute { position: absolute; }
            .relative { position: relative; }
            .bottom-8 { bottom: 2rem; }
            .bottom-20 { bottom: 5rem; }
            .bottom-24 { bottom: 6rem; }
            .start-0 { left: 0; }
            .start-20 { left: 5rem; }
            .end-0 { right: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 0.75rem; text-align: right; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // انتظار تحميل الصور
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownloadPDF = () => {
    // يمكن استخدام مكتبة مثل html2pdf.js لتحويل HTML إلى PDF
    // حالياً نستخدم الطباعة كـ PDF
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 ms-2" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 ms-2" />
                تحميل PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="border rounded-lg overflow-auto bg-gray-100 p-4">
          <div ref={printRef}>
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
