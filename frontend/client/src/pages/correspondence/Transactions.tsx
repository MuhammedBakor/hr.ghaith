import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { FileStack, Search, FileText, Calendar, User, Clock, CheckCircle2, Filter, Eye, RotateCcw, MoreHorizontal, Link2, History, Hash } from "lucide-react";
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

const transactionTypes = [
  { value: 'request', label: 'طلب' },
  { value: 'decision', label: 'قرار' },
  { value: 'letter', label: 'خطاب' },
  { value: 'violation', label: 'مخالفة' },
  { value: 'complaint', label: 'شكوى' },
  { value: 'inquiry', label: 'استفسار' },
  { value: 'contract', label: 'عقد' },
  { value: 'invoice', label: 'فاتورة' },
  { value: 'other', label: 'أخرى' },
];

const priorityOptions = [
  { value: 'urgent', label: 'عاجل', color: 'bg-red-100 text-red-700' },
  { value: 'high', label: 'مرتفع', color: 'bg-orange-100 text-orange-700' },
  { value: 'normal', label: 'عادي', color: 'bg-blue-100 text-blue-700' },
  { value: 'low', label: 'منخفض', color: 'bg-gray-100 text-gray-700' },
];

const statusOptions = [
  { value: 'open', label: 'مفتوحة', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'قيد التنفيذ', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'pending', label: 'معلقة', color: 'bg-orange-100 text-orange-700' },
  { value: 'returned', label: 'معادة', color: 'bg-purple-100 text-purple-700' },
  { value: 'completed', label: 'مكتملة', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'مغلقة', color: 'bg-gray-100 text-gray-700' },
  { value: 'cancelled', label: 'ملغاة', color: 'bg-red-100 text-red-700' },
];

export default function Transactions() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';

  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [returnReason, setReturnReason] = useState("");
  const [detailItem, setDetailItem] = useState<any>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);

  // جلب قائمة المعاملات
  const { data: transactionsList, isLoading, refetch } = useQuery({
    queryKey: ['correspondence', 'transactions', filterStatus, filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('transactionType', filterType);
      return api.get(`/correspondence/transactions?${params.toString()}`).then(r => r.data);
    },
  });

  // جلب الفروع
  const { data: branches } = useQuery({ queryKey: ['hr-advanced', 'branches'], queryFn: () => api.get('/hr-advanced/branches').then(r => r.data) });

  // إنشاء معاملة جديدة
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/correspondence/transactions', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء المعاملة بنجاح");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء المعاملة");
    },
  });

  // إعادة معاملة
  const returnMutation = useMutation({
    mutationFn: (data: any) => api.post(`/correspondence/transactions/${data.transactionId}/return`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إعادة المعاملة بنجاح");
      setIsReturnOpen(false);
      setSelectedTransaction(null);
      setReturnReason("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إعادة المعاملة");
    },
  });

  // جلب سجل حركة المعاملة
  const { data: historyData } = useQuery({
    queryKey: ['correspondence', 'transactions', 'history', historyItem?.id],
    queryFn: () => api.get(`/correspondence/transactions/${historyItem?.id}/history`).then(r => r.data),
    enabled: !!historyItem
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      transactionType: formData.get('transactionType') as any,
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as any,
      branchId: formData.get('branchId') ? parseInt(formData.get('branchId') as string) : undefined,
    };

    createMutation.mutate(data);
  };

  const handleReturnSubmit = () => {
    if (!selectedTransaction || !returnReason.trim()) {
      toast.error("يرجى إدخال سبب الإعادة");
      return;
    }
    returnMutation.mutate({
      transactionId: selectedTransaction.id,
      returnReason: returnReason.trim(),
    });
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

  const filteredList = transactionsList?.filter(item => 
    !searchQuery || 
    item.transactionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // إحصائيات
  const stats = {
    total: transactionsList?.length || 0,
    open: transactionsList?.filter(t => t.status === 'open').length || 0,
    inProgress: transactionsList?.filter(t => t.status === 'in_progress').length || 0,
    returned: transactionsList?.filter(t => t.isReturned).length || 0,
    completed: transactionsList?.filter(t => t.status === 'completed').length || 0,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
      <div className="space-y-6">
        {/* العنوان والإجراءات */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileStack className="h-6 w-6 text-primary" />
              المعاملات
            </h1>
            <p className="text-gray-500 mt-1">إدارة المعاملات الموحدة مع نظام الترقيم المركزي</p>
          </div>
          
          {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
            
            
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">
                  <FileStack className="h-5 w-5" />
                  إنشاء معاملة جديدة
                </h3>
              </div>
              
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع المعاملة *</Label>
                    <Select name="transactionType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes.map(type => (
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
                  <Input name="subject" required placeholder="موضوع المعاملة" />
                </div>

                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea 
                    name="description" 
                    placeholder="وصف تفصيلي للمعاملة..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الفرع</Label>
                  <Select name="branchId">
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع (اختياري)" />
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

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المعاملة"}
                  </Button>
                </div>
              </form>
            
          </div>)}

        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileStack className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">الإجمالي</p>
                <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-cyan-50 rounded-xl">
                <FileText className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">مفتوحة</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">قيد التنفيذ</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <RotateCcw className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">معادة</p>
                <p className="text-2xl font-bold">{stats.returned}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">مكتملة</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
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
                  placeholder="بحث برقم المعاملة أو الموضوع..."
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
                  {transactionTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* جدول المعاملات */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">سجل المعاملات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-12">
                <FileStack className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد معاملات</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  إنشاء معاملة جديدة
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-end">رقم المعاملة</TableHead>
                    <TableHead className="text-end">النوع</TableHead>
                    <TableHead className="text-end">الموضوع</TableHead>
                    <TableHead className="text-end">التاريخ</TableHead>
                    <TableHead className="text-end">الأولوية</TableHead>
                    <TableHead className="text-end">الحالة</TableHead>
                    <TableHead className="text-end">مرات الإعادة</TableHead>
                    <TableHead className="text-end">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((item) => (
                    <TableRow key={item.id} className={item.isReturned ? 'bg-purple-50/50' : ''}>
                      <TableCell className="font-mono text-primary font-medium">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          {item.transactionNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transactionTypes.find(t => t.value === item.transactionType)?.label || item.transactionType}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.subject}
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
                        {(item.returnCount ?? 0) > 0 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            {item.returnCount} مرة
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="عرض">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailItem(item)}>
                              <Eye className="h-4 w-4 ms-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setHistoryItem(item)}>
                              <History className="h-4 w-4 ms-2" />
                              سجل الحركة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('اختر الكيان المراد ربطه')}>
                              <Link2 className="h-4 w-4 ms-2" />
                              ربط كيان
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTransaction(item);
                                setIsReturnOpen(true);
                              }}
                            >
                              <RotateCcw className="h-4 w-4 ms-2" />
                              إعادة المعاملة
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

        {/* نافذة إعادة المعاملة */}
        {isReturnOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">
                <RotateCcw className="h-5 w-5" />
                إعادة المعاملة
              </h3>
            </div>
            
            <div className="space-y-4">
              {selectedTransaction && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">رقم المعاملة</p>
                  <p className="font-mono font-medium">{selectedTransaction.transactionNumber}</p>
                  <p className="text-sm text-gray-500 mt-2">الموضوع</p>
                  <p className="font-medium">{selectedTransaction.subject}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>سبب الإعادة *</Label>
                <Textarea 
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="اذكر سبب إعادة المعاملة..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsReturnOpen(false);
                    setSelectedTransaction(null);
                    setReturnReason("");
                  }}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleReturnSubmit}
                  disabled={returnMutation.isPending || !returnReason.trim()}
                >
                  {returnMutation.isPending ? "جاري الإعادة..." : "إعادة المعاملة"}
                </Button>
              </div>
            </div>
          
        </div>)}

        {/* تفاصيل المعاملة */}
        {detailItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">تفاصيل المعاملة</h2>
                <Button variant="ghost" size="sm" onClick={() => setDetailItem(null)}>✕</Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">رقم المعاملة</span><p className="font-bold">{detailItem.transactionNumber || '—'}</p></div>
                  <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">النوع</span><p className="font-bold">{detailItem.transactionType || '—'}</p></div>
                  <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الحالة</span><p className="font-bold">{detailItem.status || '—'}</p></div>
                  <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الأولوية</span><p className="font-bold">{detailItem.priority || 'عادي'}</p></div>
                  <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">تاريخ الإنشاء</span><p className="font-bold">{detailItem.createdAt ? formatDate(detailItem.createdAt) : '—'}</p></div>
                  <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">تاريخ الاستحقاق</span><p className="font-bold">{detailItem.dueDate ? formatDate(detailItem.dueDate) : '—'}</p></div>
                </div>
                <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الموضوع</span><p className="font-bold">{detailItem.subject}</p></div>
                {detailItem.description && <div className="bg-gray-50 p-3 rounded"><span className="text-sm text-gray-500">الوصف</span><p>{detailItem.description}</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* سجل حركة المعاملة */}
        {historyItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setHistoryItem(null)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" dir="rtl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">سجل حركة المعاملة — {historyItem.transactionNumber}</h2>
                <Button variant="ghost" size="sm" onClick={() => setHistoryItem(null)}>✕</Button>
              </div>
              {historyData && Array.isArray(historyData) && historyData.length > 0 ? (
                <div className="space-y-3">
                  {historyData.map((h: any, i: number) => (
                    <div key={i} className="border-r-4 border-blue-500 pe-4 py-2">
                      <div className="flex justify-between">
                        <span className="font-bold">{h.action || h.actionType || '—'}</span>
                        <span className="text-sm text-gray-400">{h.createdAt ? formatDateTime(h.createdAt) : ''}</span>
                      </div>
                      {h.notes && <p className="text-sm text-gray-600 mt-1">{h.notes}</p>}
                      {h.fromStatus && <p className="text-xs text-gray-400">من: {h.fromStatus} → إلى: {h.toStatus}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-6">لا توجد حركات مسجلة</p>
              )}
            </div>
          </div>
        )}

      </div>
  );
}
