import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, CheckCircle2, AlertCircle, User, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { toast } from 'sonner';

interface Request {
  id: number;
  requestNumber: string;
  requestType: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  requesterId: number;
  assignedTo?: number | null;
  createdAt: Date;
}

export default function RequestList() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error } = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: '',
    subject: '',
    description: '',
    priority: 'medium'
  });

  const queryClient = useQueryClient();

  // جلب الطلبات
  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => api.get('/requests').then(r => r.data),
  });

  // إنشاء طلب جديد
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => api.post('/requests', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء الطلب بنجاح');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setIsOpen(false);
      setNewRequest({ type: '', subject: '', description: '', priority: 'medium' });
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء الطلب: ' + (error?.message || 'حدث خطأ'));
    },
  });

  // تحديث حالة الطلب
  const updateRequestMutation = useMutation({
    mutationFn: (data: any) => api.put(`/requests/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث الطلب');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (error: any) => {
      toast.error('فشل في التحديث: ' + (error?.message || 'حدث خطأ'));
    },
  });

  // فلترة الطلبات
  const filteredRequests = (requests || []).filter((req: Request) =>
    req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
      open: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      approved: 'تمت الموافقة',
      pending: 'قيد الانتظار',
      rejected: 'مرفوض',
      in_progress: 'قيد التنفيذ',
      draft: 'مسودة',
      open: 'مفتوح',
      closed: 'مغلق',
    };

    return <Badge className={styles[status] || 'bg-gray-100'}>{labels[status] || status}</Badge>;
  };

  const getRequestTypeName = (type: string) => {
    const types: Record<string, string> = {
      leave: 'إجازة',
      purchase: 'شراء',
      maintenance: 'صيانة',
      it_support: 'دعم تقني',
      travel: 'سفر',
      expense: 'مصروفات',
      other: 'أخرى',
    };
    return types[type] || type;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الطلبات</h2>
          <p className="text-gray-500">مركز الطلبات والتذاكر الموحد</p>
        </div>
        <Button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'إلغاء' : '+ إنشاء طلب جديد'}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إنشاء طلب جديد</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نوع الطلب *</Label>
              <Select value={newRequest.type} onValueChange={(v) => setNewRequest({ ...newRequest, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">إجازة</SelectItem>
                  <SelectItem value="purchase">شراء</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="it_support">دعم تقني</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الموضوع *</Label>
              <Input
                value={newRequest.subject}
                onChange={(e) => setNewRequest({ ...newRequest, subject: e.target.value })}
                placeholder="موضوع الطلب"
              />
            </div>
            <div className="space-y-2">
              <Label>التفاصيل</Label>
              <Textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="تفاصيل الطلب"
              />
            </div>
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select value={newRequest.priority} onValueChange={(v) => setNewRequest({ ...newRequest, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => createRequestMutation.mutate({
                requestNumber: `REQ-${Date.now()}`,
                requestType: newRequest.type as "purchase" | "leave" | "travel" | "expense" | "it_support" | "maintenance" | "other",
                title: newRequest.subject,
                description: newRequest.description,
                priority: newRequest.priority as "low" | "medium" | "high" | "urgent"
              })}
              className="w-full"
              disabled={!newRequest.type || !newRequest.subject || createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="my-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="my-requests">طلباتي</TabsTrigger>
          <TabsTrigger value="assigned">مسندة إلي</TabsTrigger>
          <TabsTrigger value="all">كل الطلبات</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث في الطلبات..."
              className="pe-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="my-requests" className="mt-4">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد طلبات</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الموضوع</TableHead>
                    <TableHead>تاريخ الطلب</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req: Request) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.requestNumber}</TableCell>
                      <TableCell>{getRequestTypeName(req.requestType)}</TableCell>
                      <TableCell>{req.title}</TableCell>
                      <TableCell>{formatDate(req.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(req.priority)}
                          <span className="text-sm text-gray-600">
                            {req.priority === 'high' ? 'عالية' : req.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>
                        {req.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'approved' })}
                              title="موافقة"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                              title="رفض"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assigned">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-lg border border-dashed">
            <User className="h-12 w-12 mb-4 text-gray-300" />
            <p>لا توجد طلبات مسندة إليك حالياً</p>
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد طلبات</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الموضوع</TableHead>
                    <TableHead>تاريخ الطلب</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req: Request) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.requestNumber}</TableCell>
                      <TableCell>{getRequestTypeName(req.requestType)}</TableCell>
                      <TableCell>{req.title}</TableCell>
                      <TableCell>{formatDate(req.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(req.priority)}
                          <span className="text-sm text-gray-600">
                            {req.priority === 'high' ? 'عالية' : req.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>
                        {req.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'approved' })}
                              title="موافقة"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                              title="رفض"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
