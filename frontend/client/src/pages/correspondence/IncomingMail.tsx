import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { ArrowDownLeft, Search, Calendar, Building2, Clock, CheckCircle2, AlertCircle, Filter, Download, Eye, Forward, MoreHorizontal, Inbox, Mail, FileInput, Printer } from "lucide-react";
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
  { value: 'complaint', label: 'شكوى' },
  { value: 'inquiry', label: 'استفسار' },
  { value: 'other', label: 'أخرى' },
];

const priorityOptions = [
  { value: 'urgent', label: 'عاجل', color: 'bg-red-100 text-red-700' },
  { value: 'high', label: 'مرتفع', color: 'bg-orange-100 text-orange-700' },
  { value: 'normal', label: 'عادي', color: 'bg-blue-100 text-blue-700' },
  { value: 'low', label: 'منخفض', color: 'bg-gray-100 text-gray-700' },
];

const statusOptions = [
  { value: 'received', label: 'مستلم', color: 'bg-blue-100 text-blue-700' },
  { value: 'under_review', label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'forwarded', label: 'محول', color: 'bg-purple-100 text-purple-700' },
  { value: 'in_progress', label: 'قيد التنفيذ', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'completed', label: 'مكتمل', color: 'bg-green-100 text-green-700' },
  { value: 'archived', label: 'مؤرشف', color: 'bg-gray-100 text-gray-700' },
];

export default function IncomingMail() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [printItem, setPrintItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);

  // جلب قائمة الوارد
  const { data: incomingList, isLoading, refetch, isError, error} = useQuery({
    queryKey: ['correspondence', 'incoming', filterStatus, filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('mailType', filterType);
      return api.get(`/correspondence/incoming?${params.toString()}`).then(r => r.data);
    },
  });

  // جلب الفروع
  const { data: branches } = useQuery({ queryKey: ['hr-advanced', 'branches'], queryFn: () => api.get('/hr-advanced/branches').then(r => r.data) });

  // إنشاء وارد جديد
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/correspondence/incoming', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تسجيل الوارد بنجاح");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الوارد");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      mailType: formData.get('mailType') as any,
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
      summary: formData.get('summary') as string,
      senderType: formData.get('senderType') as any,
      senderName: formData.get('senderName') as string,
      senderOrganization: formData.get('senderOrganization') as string,
      externalLetterNumber: formData.get('externalLetterNumber') as string,
      externalLetterDate: formData.get('externalLetterDate') ? new Date(formData.get('externalLetterDate') as string) : undefined,
      receivedDate: new Date(formData.get('receivedDate') as string),
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

  const filteredList = incomingList?.filter(item => 
    !searchQuery || 
    item.incomingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.externalLetterNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
      <div className="space-y-6">
        {/* العنوان والإجراءات */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowDownLeft className="h-6 w-6 text-primary" />
              الوارد
            </h1>
            <p className="text-gray-500 mt-1">إدارة المراسلات الواردة للمنشأة</p>
          </div>
          
          {/* قسم مضمن */}
        {isCreateOpen && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
            
            
              <div className="mb-4">
                <h3 className="text-lg font-bold">
                  <FileInput className="h-5 w-5" />
                  تسجيل وارد جديد
                </h3>
              </div>
              
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الوارد *</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الخطاب الخارجي</Label>
                    <Input name="externalLetterNumber" placeholder="رقم الخطاب من الجهة المرسلة" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>تاريخ الخطاب الخارجي</Label>
                    <Input name="externalLetterDate" type="date"  placeholder="أدخل القيمة" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الموضوع *</Label>
                  <Input name="subject" required placeholder="موضوع الخطاب" />
                </div>

                <div className="space-y-2">
                  <Label>ملخص المحتوى</Label>
                  <Textarea 
                    name="summary" 
                    placeholder="ملخص مختصر للمحتوى..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>المحتوى الكامل</Label>
                  <Textarea 
                    name="content" 
                    placeholder="نص الخطاب الكامل..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع المرسل *</Label>
                    <Select name="senderType" required>
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
                    <Label>اسم المرسل</Label>
                    <Input name="senderName" placeholder="اسم المرسل" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الجهة المرسلة</Label>
                  <Input name="senderOrganization" placeholder="اسم الجهة" />
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الاستلام *</Label>
                  <Input 
                    name="receivedDate" 
                    type="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                   placeholder="أدخل القيمة" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري التسجيل..." : "تسجيل الوارد"}
                  </Button>
                </div>
              </form>
            
          </div>
        )}

        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Inbox className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي الوارد</p>
                <p className="text-2xl font-bold">{incomingList?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">قيد المراجعة</p>
                <p className="text-2xl font-bold">
                  {incomingList?.filter(o => o.status === 'under_review').length || 0}
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
                <p className="text-sm text-gray-500">مكتمل</p>
                <p className="text-2xl font-bold">
                  {incomingList?.filter(o => o.status === 'completed').length || 0}
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
                  {incomingList?.filter(o => o.priority === 'urgent').length || 0}
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
                  placeholder="بحث برقم الوارد أو الموضوع أو المرسل..."
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

        {/* جدول الوارد */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">سجل الوارد</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد مراسلات واردة</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  تسجيل وارد جديد
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">رقم الوارد</TableHead>
                    <TableHead className="text-end">رقم الخطاب الخارجي</TableHead>
                    <TableHead className="text-end">النوع</TableHead>
                    <TableHead className="text-end">الموضوع</TableHead>
                    <TableHead className="text-end">المرسل</TableHead>
                    <TableHead className="text-end">تاريخ الاستلام</TableHead>
                    <TableHead className="text-end">الأولوية</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                    <TableHead className="text-end">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-primary">
                        {item.incomingNumber}
                      </TableCell>
                      <TableCell className="font-mono text-gray-600">
                        {item.externalLetterNumber || '-'}
                      </TableCell>
                      <TableCell>
                        {mailTypes.find(t => t.value === item.mailType)?.label || item.mailType}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.subject}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {item.senderOrganization || item.senderName || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {item.receivedDate ? formatDate(item.receivedDate) : '-'}
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
                            <DropdownMenuItem onClick={() => toast.info('اختر الجهة المستلمة من القائمة')}>
                              <Forward className="h-4 w-4 ms-2" />
                              تحويل
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

      {/* تفاصيل البريد الوارد */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">تفاصيل البريد الوارد</h2>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">رقم الوارد</span><p className="font-bold">{detailItem.incomingNumber || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">نوع البريد</span><p className="font-bold">{detailItem.mailType || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">المرسل</span><p className="font-bold">{detailItem.senderName || detailItem.senderEntity || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الحالة</span><p className="font-bold">{detailItem.status || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">رقم الخطاب الخارجي</span><p className="font-bold">{detailItem.externalLetterNumber || '—'}</p></div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">تاريخ الاستلام</span><p className="font-bold">{detailItem.receivedDate ? formatDate(detailItem.receivedDate) : '—'}</p></div>
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
          title={`بريد وارد — ${printItem.incomingNumber || ''}`}
          open={!!printItem}
          onClose={() => setPrintItem(null)}
        >
          <div style={{ padding: '40px', direction: 'rtl', fontFamily: 'Arial, Tahoma, sans-serif', lineHeight: '2' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>بريد وارد</h2>
              <p style={{ color: '#666', margin: '5px 0' }}>رقم الوارد: {printItem.incomingNumber}</p>
              <p style={{ color: '#666', fontSize: '12px' }}>تاريخ الاستلام: {printItem.receivedDate ? formatDate(printItem.receivedDate) : formatDate(printItem.createdAt)}</p>
            </div>
            <p><strong>من:</strong> {printItem.senderName || printItem.senderEntity || '—'}</p>
            <p><strong>رقم الخطاب الخارجي:</strong> {printItem.externalLetterNumber || '—'}</p>
            <p><strong>الموضوع:</strong> {printItem.subject}</p>
            <div style={{ margin: '20px 0', background: '#f8f8f8', padding: '15px', borderRadius: '8px' }}>
              <p>{printItem.content || printItem.body || ''}</p>
            </div>
            {printItem.transactionNumber && <p style={{ fontSize: '12px', color: '#666' }}>رقم المعاملة: {printItem.transactionNumber}</p>}
            <div style={{ marginTop: '60px', textAlign: 'center' }}>
              <p>____________________</p>
              <p>توقيع المستلم</p>
            </div>
          </div>
        </LetterPrintWrapper>
      )}
  );
}
