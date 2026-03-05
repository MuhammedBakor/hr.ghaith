import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Printer, FileText, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

// 1. Document Print Button
interface DocumentPrintProps {
  entityType: string;
  entityId: number;
  companyId: number;
  branchId?: number;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  label?: string;
}

export function DocumentPrintButton({
  entityType, entityId, companyId, branchId, className, variant = "outline", size = "sm", label,
}: DocumentPrintProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const { data: result } = await api.get('/print/generate', {
        params: { entityType, entityId, companyId, branchId }
      });
      if (!result) { toast.error("لا توجد بيانات للطباعة"); return; }

      const { settings, template, data, printNumber } = result;

      const printWindow = window.open("", "_blank");
      if (!printWindow) { toast.error("يرجى السماح بالنوافذ المنبثقة"); return; }

      printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${template?.nameAr || 'مستند'} — ${printNumber || ''}</title>
  <style>
    @page { size: ${template?.pageSize || 'A4'} ${template?.orientation || 'portrait'}; margin: ${template?.margins?.top || 20}mm ${template?.margins?.right || 15}mm ${template?.margins?.bottom || 20}mm ${template?.margins?.left || 15}mm; }
    body { font-family: 'Tajawal', 'Cairo', Arial, sans-serif; direction: rtl; text-align: right; color: #1a1a1a; line-height: 1.8; }
    .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 20px; }
    .header .company-name { font-size: 22px; font-weight: bold; color: #1a5276; }
    .body { min-height: 400px; padding: 20px 0; font-size: 14px; }
    .footer { border-top: 2px solid #ccc; padding-top: 10px; margin-top: 30px; font-size: 11px; color: #666; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
    th { background: #f5f5f5; font-weight: bold; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${settings?.companyNameAr || settings?.companyName || ''}</div>
    ${settings?.branchNameAr ? `<div style="font-size:14px;color:#666">${settings.branchNameAr}</div>` : ''}
  </div>
  <div style="text-align:center;margin-bottom:20px;">
    <strong style="font-size:18px;border-bottom:2px solid #333;padding-bottom:5px;">${template?.nameAr || 'مستند'}</strong>
    <div style="font-size:10px;color:#999">رقم المطبوع: ${printNumber || ''}</div>
  </div>
  <div class="body">
    <pre style="white-space:pre-wrap;font-family:inherit;">${JSON.stringify(data, null, 2)}</pre>
  </div>
  <div class="footer">
    <div>${settings?.effectiveAddress || ''} | ${settings?.effectivePhone || ''}</div>
    <div>${settings?.email || ''} | ${settings?.website || ''}</div>
  </div>
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;left:20px;padding:10px 20px;background:#1a5276;color:white;border:none;border-radius:5px;cursor:pointer;font-size:16px;">طباعة</button>
</body>
</html>`);
      printWindow.document.close();

      // Log print
      api.post('/print/log', { entityType, entityId, templateId: template?.id, printNumber, copies: 1 }).catch(() => {});
      toast.success("تم إعداد المستند للطباعة");
    } catch (err) {
      toast.error("خطأ في إعداد الطباعة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handlePrint} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      {label && <span className="me-1">{label}</span>}
    </Button>
  );
}

// 2. Request Letter Button
interface RequestLetterProps {
  letterType: string;
  requestId: number;
  requestType: string;
  employeeId?: number;
  companyId: number;
  branchId?: number;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function RequestLetterButton({
  letterType, requestId, requestType, employeeId, companyId, branchId,
  label = "إنشاء خطاب", variant = "outline", size = "sm", className,
}: RequestLetterProps) {
  const generateMut = useMutation({
    mutationFn: (data: any) => api.post('/correspondence/generate-from-request', data).then(res => res.data),
    onSuccess: (data) => {
      toast.success(`تم إنشاء الخطاب: ${data.letterNumber}`);
    },
    onError: () => toast.error("خطأ في إنشاء الخطاب"),
  });

  return (
    <Button
      variant={variant} size={size} className={className}
      onClick={() => generateMut.mutate({ letterType, requestId, requestType, employeeId, companyId, branchId })}
      disabled={generateMut.isPending}
    >
      {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      <span className="me-1">{label}</span>
    </Button>
  );
}

// 3. Quick Letter Dialog
const LETTER_TYPES = [
  { value: 'salary_certificate', label: 'شهادة راتب' },
  { value: 'experience_certificate', label: 'شهادة خبرة' },
  { value: 'employment_verification', label: 'تعريف بالعمل' },
  { value: 'warning_letter', label: 'خطاب إنذار' },
  { value: 'promotion_letter', label: 'خطاب ترقية' },
  { value: 'transfer_letter', label: 'خطاب نقل' },
  { value: 'assignment_letter', label: 'خطاب تكليف' },
  { value: 'custody_receipt', label: 'إيصال عهدة' },
  { value: 'clearance_letter', label: 'إخلاء طرف' },
  { value: 'leave_approval', label: 'اعتماد إجازة' },
  { value: 'leave_rejection', label: 'رفض إجازة' },
  { value: 'termination_notice', label: 'إنهاء خدمات' },
  { value: 'contract_offer', label: 'عرض عقد' },
  { value: 'contract_renewal', label: 'تجديد عقد' },
];

interface QuickLetterDialogProps {
  employeeId: number;
  companyId: number;
  branchId?: number;
  trigger?: React.ReactNode;
}

export function QuickLetterDialog({ employeeId, companyId, branchId, trigger }: QuickLetterDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  const generateMut = useMutation({
    mutationFn: (data: any) => api.post('/correspondence/generate-from-request', data).then(res => res.data),
    onSuccess: (data) => {
      toast.success(`تم إنشاء الخطاب: ${data.letterNumber}`);
      setOpen(false);
    },
    onError: () => toast.error("خطأ في إنشاء الخطاب"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4" />
            <span className="me-1">إنشاء خطاب</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء خطاب رسمي</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع الخطاب" />
            </SelectTrigger>
            <SelectContent>
              {LETTER_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full"
            disabled={!selectedType || generateMut.isPending}
            onClick={() => generateMut.mutate({
              letterType: selectedType,
              requestId: employeeId,
              requestType: 'employee',
              employeeId,
              companyId,
              branchId,
            })}
          >
            {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : <Send className="h-4 w-4 ms-2" />}
            إنشاء الخطاب
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
