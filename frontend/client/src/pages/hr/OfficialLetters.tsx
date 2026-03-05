import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
/**
 * صفحة الخطابات الرسمية
 * عرض وإدارة وطباعة الخطابات الرسمية
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Printer, Search, Eye, CheckCircle, Stamp, PenTool } from "lucide-react";
import { toast } from "sonner";

// أنواع الخطابات
const LETTER_TYPES: Record<string, string> = {
  leave_request: "طلب إجازة",
  leave_approval: "الموافقة على إجازة",
  violation_notice: "إشعار مخالفة",
  employment_offer: "عرض وظيفي",
  employment_contract: "عقد عمل",
  salary_certificate: "شهادة راتب",
  experience_certificate: "شهادة خبرة",
  termination_letter: "إنهاء خدمة",
  promotion_letter: "ترقية",
  transfer_letter: "نقل",
  warning_letter: "إنذار",
  data_change_letter: "تغيير بيانات",
  approval_letter: "موافقة",
  other: "أخرى",
};

// حالات الخطاب
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "bg-gray-500" },
  pending_employee_signature: { label: "بانتظار توقيع الموظف", color: "bg-yellow-500" },
  pending_manager_signature: { label: "بانتظار توقيع المدير", color: "bg-orange-500" },
  pending_approval: { label: "بانتظار الاعتماد", color: "bg-blue-500" },
  approved: { label: "معتمد", color: "bg-green-500" },
  issued: { label: "صادر", color: "bg-emerald-600" },
  rejected: { label: "مرفوض", color: "bg-red-500" },
  cancelled: { label: "ملغي", color: "bg-gray-600" },
};

export default function OfficialLetters() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // جلب الخطابات
  const { data: letters, isLoading, refetch, isError, error} = useQuery({
    queryKey: ['officialLetters', filterType, filterStatus],
    queryFn: () => api.get('/hr/official-letters', {
      params: {
        letterType: filterType !== "all" ? filterType : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      }
    }).then(res => res.data),
  });

  // جلب قوالب الخطابات
  const { data: templates } = useQuery({
    queryKey: ['officialLetterTemplates'],
    queryFn: () => api.get('/hr/official-letters/templates').then(res => res.data),
  });
  // تسجيل طباعة
  const logPrintMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/official-letters/log-print', data).then(res => res.data),
    onError: (error: any) => { toast.error(error.message || "حدث خطأ"); },
    onSuccess: () => {
      toast.success("تم تسجيل الطباعة");
    },
  });

  // توقيع الموظف
  const signByEmployeeMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/official-letters/sign-employee', data).then(res => res.data),
    onError: (error: any) => { toast.error(error.message || "حدث خطأ"); },
    onSuccess: () => {
      toast.success("تم توقيع الخطاب بنجاح");
      refetch();
    },
  });

  // اعتماد المدير
  const approveByManagerMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/official-letters/approve-manager', data).then(res => res.data),
    onError: (error: any) => { toast.error(error.message || "حدث خطأ"); },
    onSuccess: () => {
      toast.success("تم اعتماد الخطاب بنجاح");
      refetch();
    },
  });

  // إصدار الخطاب
  const issueMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/official-letters/issue', data).then(res => res.data),
    onError: (error: any) => { toast.error(error.message || "حدث خطأ"); },
    onSuccess: () => {
      toast.success("تم إصدار الخطاب بنجاح");
      refetch();
    },
  });

  // فلترة الخطابات
  const filteredLetters = letters?.filter((letter: any) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

      
      return (
        letter.letterNumber?.toLowerCase().includes(search) ||
        letter.subject?.toLowerCase().includes(search) ||
        letter.recipientName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // طباعة الخطاب
  const handlePrint = async (letter: any) => {
    await logPrintMutation.mutateAsync({ letterId: letter.id });
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${letter.subject}</title>
          <style>
            @page { size: A4; margin: 2cm; }
            body {
              font-family: 'Arial', 'Tahoma', sans-serif;
              line-height: 1.8;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .letterhead {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .letterhead img {
              max-height: 80px;
              margin-bottom: 10px;
            }
            .letter-number {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .subject {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              margin: 30px 0;
              text-decoration: underline;
            }
            .content {
              text-align: justify;
              white-space: pre-wrap;
              margin: 30px 0;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 50px;
              padding-top: 10px;
            }
            .stamp {
              text-align: center;
              margin-top: 40px;
            }
            .stamp img {
              max-height: 100px;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            ${letter.letterheadUsed ? `<img src="${letter.letterheadUsed}" alt="كليشة">` : '<h2>نظام غيث</h2>'}
          </div>
          
          <div class="letter-number">
            <span>الرقم: ${letter.letterNumber}</span>
            <span>التاريخ: ${formatDate(letter.createdAt)}</span>
          </div>
          
          <div class="subject">الموضوع: ${letter.subject}</div>
          
          <div class="content">${letter.content}</div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">
                ${letter.employeeSignature ? `<img src="${letter.employeeSignature}" alt="توقيع الموظف" style="max-height:40px">` : ''}
                <div>توقيع الموظف</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                ${letter.managerSignature ? `<img src="${letter.managerSignature}" alt="توقيع المدير" style="max-height:40px">` : ''}
                <div>توقيع المدير المباشر</div>
              </div>
            </div>
          </div>
          
          ${letter.stampUsed ? `
            <div class="stamp">
              <img src="${letter.stampUsed}" alt="ختم">
            </div>
          ` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">الخطابات الرسمية</h2>
          <p className="text-muted-foreground">إدارة وطباعة الخطابات الرسمية والقرارات</p>
        </div>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الخطاب أو الموضوع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع الخطاب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(LETTER_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الخطابات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            قائمة الخطابات ({filteredLetters?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">جارٍ التحميل...</div>
          ) : filteredLetters?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد خطابات
            </div>
          ) : (
            <div className="overflow-x-auto">
<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الخطاب</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLetters?.map((letter: any) => (
                  <TableRow key={letter.id}>
                    <TableCell className="font-mono">{letter.letterNumber}</TableCell>
                    <TableCell>{LETTER_TYPES[letter.letterType] || letter.letterType}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{letter.subject}</TableCell>
                    <TableCell>{letter.recipientName || "-"}</TableCell>
                    <TableCell>{formatDate(letter.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_LABELS[letter.status]?.color || "bg-gray-500"}>
                        {STATUS_LABELS[letter.status]?.label || letter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLetter(letter);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrint(letter)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {letter.status === "pending_employee_signature" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signByEmployeeMutation.mutate({
                              letterId: letter.id,
                              signature: "توقيع إلكتروني",
                            })}
                          >
                            <PenTool className="h-4 w-4" />
                          </Button>
                        )}
                        {letter.status === "pending_manager_signature" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => approveByManagerMutation.mutate({
                              letterId: letter.id,
                              signature: "توقيع إلكتروني",
                            })}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {letter.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => issueMutation.mutate({ letterId: letter.id })}
                          >
                            <Stamp className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
</div>
          )}
        </CardContent>
      </Card>

      {/* معاينة الخطاب */}
      {showPreview && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">معاينة الخطاب</h3>
          </div>
          {selectedLetter && (
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-white" dir="rtl">
                {/* الكليشة */}
                <div className="text-center border-b pb-4 mb-6">
                  {selectedLetter.letterheadUsed ? (
                    <img src={selectedLetter.letterheadUsed} alt="كليشة" className="h-20 mx-auto" />
                  ) : (
                    <h2 className="text-xl font-bold">نظام غيث</h2>
                  )}
                </div>

                {/* رقم الخطاب والتاريخ */}
                <div className="flex justify-between text-sm mb-6">
                  <span>الرقم: {selectedLetter.letterNumber}</span>
                  <span>التاريخ: {formatDate(selectedLetter.createdAt)}</span>
                </div>

                {/* الموضوع */}
                <div className="text-center font-bold text-lg mb-6 underline">
                  الموضوع: {selectedLetter.subject}
                </div>

                {/* المحتوى */}
                <div className="whitespace-pre-wrap leading-8 mb-8">
                  {selectedLetter.content}
                </div>

                {/* التوقيعات */}
                <div className="flex justify-between mt-12">
                  <div className="text-center">
                    <div className="h-16 border-b border-gray-400 w-40 mb-2">
                      {selectedLetter.employeeSignature && (
                        <img src={selectedLetter.employeeSignature} alt="توقيع الموظف" className="h-12 mx-auto" />
                      )}
                    </div>
                    <span className="text-sm">توقيع الموظف</span>
                  </div>
                  <div className="text-center">
                    <div className="h-16 border-b border-gray-400 w-40 mb-2">
                      {selectedLetter.managerSignature && (
                        <img src={selectedLetter.managerSignature} alt="توقيع المدير" className="h-12 mx-auto" />
                      )}
                    </div>
                    <span className="text-sm">توقيع المدير المباشر</span>
                  </div>
                </div>

                {/* الختم */}
                {selectedLetter.stampUsed && (
                  <div className="text-center mt-8">
                    <img src={selectedLetter.stampUsed} alt="ختم" className="h-24 mx-auto" />
                  </div>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  إغلاق
                </Button>
                <Button onClick={() => handlePrint(selectedLetter)}>
                  <Printer className="h-4 w-4 ms-2" />
                  طباعة
                </Button>
              </div>
            </div>
          )}
        
      </div>)}

    </div>
  );
}
