import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LetterPrintWrapper from "@/components/letters/LetterPrintWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from "sonner";
import { Send, Search, FileText, Calendar, User, Clock, CheckCircle2, AlertCircle, Filter, Download, Eye, Printer, MoreHorizontal, ArrowUpRight, Mail, Stamp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mailTypes = [
  { value: 'letter', label: 'خطاب' },
  { value: 'decision', label: 'قرار' },
  { value: 'memo', label: 'مذكرة' },
  { value: 'circular', label: 'تعميم' },
  { value: 'contract', label: 'عقد' },
  { value: 'invoice', label: 'فاتورة' },
  { value: 'report', label: 'تقرير' },
  { value: 'other', label: 'أخرى' },
];

const priorityOptions = [
  { value: 'urgent', label: 'عاجل', color: 'bg-red-100 text-red-700' },
  { value: 'high', label: 'مرتفع', color: 'bg-orange-100 text-orange-700' },
  { value: 'normal', label: 'عادي', color: 'bg-blue-100 text-blue-700' },
  { value: 'low', label: 'منخفض', color: 'bg-gray-100 text-gray-700' },
];

const statusOptions = [
  { value: 'draft', label: 'مسودة', color: 'bg-gray-100 text-gray-700' },
  { value: 'pending_approval', label: 'بانتظار الاعتماد', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'approved', label: 'معتمد', color: 'bg-green-100 text-green-700' },
  { value: 'sent', label: 'مرسل', color: 'bg-blue-100 text-blue-700' },
  { value: 'delivered', label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-700' },
];

export default function OutgoingMail() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);

  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';

  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();

  // جلب قائمة الصادر
  const { data: outgoingList, isLoading, refetch } = useQuery({
    queryKey: ['correspondence', 'outgoing', filterStatus, filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('mailType', filterType);
      return api.get(`/correspondence/outgoing?${params.toString()}`).then(r => r.data);
    },
  });

  // جلب الفروع
  const { data: branches } = useQuery({ queryKey: ['hr-advanced', 'branches'], queryFn: () => api.get('/hr-advanced/branches').then(r => r.data) });

  // إنشاء صادر جديد
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/correspondence/outgoing', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء الصادر بنجاح");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الصادر");
    },
  });

  // التحقق من توفر الكليشة
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [printItem, setPrintItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const { data: letterheadCheck } = useQuery({
    queryKey: ['correspondence', 'letterhead', 'check', selectedBranchId],
    queryFn: () => api.get(`/correspondence/letterhead/check-availability?branchId=${selectedBranchId}`).then(r => r.data),
    enabled: !!selectedBranchId
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      mailType: formData.get('mailType') as any,
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
      recipientType: formData.get('recipientType') as any,
      recipientName: formData.get('recipientName') as string,
      recipientOrganization: formData.get('recipientOrganization') as string,
      issuingBranchId: parseInt(formData.get('issuingBranchId') as string),
      priority: formData.get('priority') as any,
    };

    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : null;
  };

  const filteredList = outgoingList?.filter(item => 
    !searchQuery || 
    item.outgoingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.recipientName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان والإجراءات */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowUpRight className="h-6 w-6 text-primary" />
              الصادر
            </h1>
            <p className="text-gray-500 mt-1">إدارة المراسلات الصادرة من المنشأة</p>
          </div>
          
          {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
            
            
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">
                  <Send className="h-5 w-5" />
                  إنشاء صادر جديد
                </h3>
              </div>
              
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الصادر *</Label>
                    <Select name="mailType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        {mailTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>الأولوية</Label>
                    <Select name="priority" defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الموضوع *</Label>
                  <Input name="subject" required placeholder="موضوع الخطاب" />
                </div>

                <div className="space-y-2">
                  <Label>المحتوى</Label>
                  <Textarea 
                    name="content" 
                    placeholder="نص الخطاب..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع المستلم *</Label>
                    <Select name="recipientType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">داخلي</SelectItem>
                        <SelectItem value="external">خارجي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>اسم المستلم</Label>
                    <Input name="recipientName" placeholder="اسم المستلم" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الجهة المستلمة</Label>
                  <Input name="recipientOrganization" placeholder="اسم الجهة" />
                </div>

                <div className="space-y-2">
                  <Label>الفرع المصدر *</Label>
                  <Select 
                    name="issuingBranchId" 
                    required
                    onValueChange={(val) => setSelectedBranchId(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch: any) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.nameAr || branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* تحذير الكليشة */}
                {selectedBranchId && letterheadCheck && !letterheadCheck.available && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Stamp className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">الكليشة غير مكتملة</h4>
                        <p className="text-sm text-amber-600 mt-1">
                          العناصر الناقصة: {letterheadCheck?.missing?.map(m => {
                            switch(m) {
                              case 'letterhead': return 'الترويسة';
                              case 'stamp': return 'الختم';
                              case 'signature': return 'التوقيع';
                              case 'logo': return 'الشعار';
                              default: return m;
                            }
                          }).join('، ')}
                        </p>
                        <p className="text-xs text-amber-500 mt-2">
                          يمكنك إضافة الكليشة من إعدادات الفرع
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الصادر"}
                  </Button>
                </div>
              </form>
            
          </div>)}

        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي الصادر</p>
                <p className="text-2xl font-bold">{outgoingList?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">بانتظار الاعتماد</p>
                <p className="text-2xl font-bold">
                  {outgoingList?.filter(o => o.status === 'pending_approval').length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">تم الإرسال</p>
                <p className="text-2xl font-bold">
                  {outgoingList?.filter(o => o.status === 'sent' || o.status === 'delivered').length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">عاجل</p>
                <p className="text-2xl font-bold">
                  {outgoingList?.filter(o => o.priority === 'urgent').length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* البحث والفلترة */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث برقم الصادر أو الموضوع أو المستلم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statusOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {mailTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* جدول الصادر */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">سجل الصادر</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد مراسلات صادرة</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  إنشاء صادر جديد
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">رقم الصادر</TableHead>
                    <TableHead className="text-end">النوع</TableHead>
                    <TableHead className="text-end">الموضوع</TableHead>
                    <TableHead className="text-end">المستلم</TableHead>
                    <TableHead className="text-end">التاريخ</TableHead>
                    <TableHead className="text-end">الأولوية</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                    <TableHead className="text-end">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-primary">
                        {item.outgoingNumber}
                      </TableCell>
                      <TableCell>
                        {mailTypes.find(t => t.value === item.mailType)?.label || item.mailType}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.subject}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {item.recipientName || item.recipientOrganization || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {item.createdAt ? formatDate(item.createdAt) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.priority && getPriorityBadge(item.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="تحميل">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailItem(item)}>
                              <Eye className="h-4 w-4 ms-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPrintItem(item)}>
                              <Printer className="h-4 w-4 ms-2" />
                              طباعة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success('جاري التحميل...')}>
                              <Download className="h-4 w-4 ms-2" />
                              تحميل
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل البريد الصادر */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">تفاصيل البريد الصادر</h2>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">رقم الصادر</span><p className="font-bold">{detailItem.outgoingNumber || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">نوع البريد</span><p className="font-bold">{detailItem.mailType || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">المستلم</span><p className="font-bold">{detailItem.recipientName || detailItem.recipientEntity || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الحالة</span><p className="font-bold">{detailItem.status || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">تاريخ الإرسال</span><p className="font-bold">{detailItem.sentDate ? formatDate(detailItem.sentDate) : '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">رقم الخطاب</span><p className="font-bold">{detailItem.letterNumber || '—'}</p></div>
              </div>
              <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الموضوع</span><p className="font-bold">{detailItem.subject}</p></div>
              {detailItem.content && <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">المحتوى</span><p>{detailItem.content}</p></div>}
              {detailItem.transactionNumber && <div className="bg-blue-50 p-3 rounded"><span className="text-sm text-blue-500">رقم المعاملة المرتبطة</span><p className="font-bold text-blue-700">{detailItem.transactionNumber}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* نافذة الطباعة */}
      {printItem && (
        <LetterPrintWrapper
          title={`خطاب صادر — ${printItem.outgoingNumber || ''}`}
          open={!!printItem}
          onClose={() => setPrintItem(null)}
        >
          <div style={{ padding: '40px', direction: 'rtl', fontFamily: 'Arial, Tahoma, sans-serif', lineHeight: '2' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>خطاب صادر</h2>
              <p style={{ color: '#666', margin: '5px 0' }}>رقم: {printItem.outgoingNumber}</p>
              <p style={{ color: '#666', fontSize: '12px' }}>التاريخ: {printItem.sentDate ? formatDate(printItem.sentDate) : formatDate(printItem.createdAt)}</p>
            </div>
            <p><strong>إلى:</strong> {printItem.recipientName || printItem.recipientEntity || '—'}</p>
            <p><strong>الموضوع:</strong> {printItem.subject}</p>
            <div style={{ margin: '20px 0', background: '#f8f8f8', padding: '15px', borderRadius: '8px' }}>
              <p>{printItem.content || printItem.body || ''}</p>
            </div>
            {printItem.transactionNumber && <p style={{ fontSize: '12px', color: '#666' }}>رقم المعاملة: {printItem.transactionNumber}</p>}
            <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}><p>____________________</p><p>المرسل</p></div>
              <div style={{ textAlign: 'center' }}><p>____________________</p><p>الختم الرسمي</p></div>
            </div>
          </div>
        </LetterPrintWrapper>
      )}
    </DashboardLayout>
  );
}
