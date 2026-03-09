import { formatDate } from '@/lib/formatDate';
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
import { Search, Clock, CheckCircle2, AlertCircle, User, Check, X, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { useAppContext } from '@/contexts/AppContext';
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
  requesterName?: string;
  requesterDepartment?: string;
  requesterDepartmentId?: number;
  approverName?: string;
  assignedTo?: number | null;
  createdAt: string;
}

export default function RequestList() {
  const { data: currentUser, isError } = useUser();
  const { selectedRole, currentEmployee, currentEmployeeId, currentUserId } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: '',
    subject: '',
    description: '',
    priority: 'medium'
  });

  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => api.get('/requests').then(r => r.data),
  });

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

  // Role-based checks
  const isManager = ['admin', 'general_manager', 'hr_manager', 'department_manager'].includes(selectedRole);
  const isAdmin = ['admin', 'general_manager'].includes(selectedRole);

  // Get current employee department ID
  const myDeptId = currentEmployee?.department?.id || currentEmployee?.departmentId;
  const myUserId = currentUserId || currentUser?.id;

  // Filter requests based on search
  const allRequests = (requests || []) as Request[];

  const filterBySearch = (reqs: Request[]) =>
    reqs.filter((req) =>
      req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterDepartment?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // "My Requests" tab - requests created by the current user
  const myRequests = filterBySearch(
    allRequests.filter((req) =>
      req.requesterId?.toString() === myUserId?.toString()
    )
  );

  // "Assigned to me" tab - pending requests that the current role can approve
  const assignedRequests = filterBySearch(
    allRequests.filter((req) => {
      if (req.status !== 'pending') return false;
      // Don't show own requests in assigned tab
      if (req.requesterId?.toString() === myUserId?.toString()) return false;

      // Admin/GM see all pending requests
      if (isAdmin) return true;

      // Department manager sees requests from their department
      if (selectedRole === 'department_manager' && myDeptId) {
        return req.requesterDepartmentId?.toString() === myDeptId?.toString();
      }

      // HR manager sees all pending requests
      if (selectedRole === 'hr_manager') return true;

      // Supervisor sees requests from their team (same department)
      if (selectedRole === 'supervisor' && myDeptId) {
        return req.requesterDepartmentId?.toString() === myDeptId?.toString();
      }

      return false;
    })
  );

  // "All requests" tab - role-based visibility
  const allFilteredRequests = filterBySearch(
    isAdmin
      ? allRequests
      : selectedRole === 'hr_manager'
        ? allRequests
        : (selectedRole === 'department_manager' || selectedRole === 'supervisor') && myDeptId
          ? allRequests.filter((req) =>
              req.requesterDepartmentId?.toString() === myDeptId?.toString() ||
              req.requesterId?.toString() === myUserId?.toString()
            )
          : allRequests.filter((req) => req.requesterId?.toString() === myUserId?.toString())
  );

  // Can this user approve/reject?
  const canApprove = (req: Request) => {
    if (req.status !== 'pending') return false;
    if (req.requesterId?.toString() === myUserId?.toString()) return false;
    if (isAdmin) return true;
    if (selectedRole === 'hr_manager') return true;
    if (selectedRole === 'department_manager' && myDeptId) {
      return req.requesterDepartmentId?.toString() === myDeptId?.toString();
    }
    if (selectedRole === 'supervisor' && myDeptId) {
      return req.requesterDepartmentId?.toString() === myDeptId?.toString();
    }
    return false;
  };

  const handleApprove = (req: Request) => {
    const approverName = currentEmployee
      ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
      : currentUser?.username || '';
    updateRequestMutation.mutate({
      id: req.id,
      status: 'approved',
      approverName,
    });
  };

  const handleReject = (req: Request) => {
    const approverName = currentEmployee
      ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
      : currentUser?.username || '';
    updateRequestMutation.mutate({
      id: req.id,
      status: 'rejected',
      approverName,
    });
  };

  const handleCreateRequest = () => {
    const empName = currentEmployee
      ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
      : currentUser?.username || '';
    const empDept = currentEmployee?.department?.nameAr || currentEmployee?.department?.name || '';
    const empDeptId = currentEmployee?.department?.id || currentEmployee?.departmentId || null;

    createRequestMutation.mutate({
      requestNumber: `REQ-${Date.now()}`,
      requestType: newRequest.type,
      title: newRequest.subject,
      description: newRequest.description,
      priority: newRequest.priority,
      requesterId: myUserId,
      requesterName: empName,
      requesterDepartment: empDept,
      requesterDepartmentId: empDeptId,
    });
  };

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

  const renderRequestTable = (data: Request[], showRequester: boolean, showActions: boolean) => (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">لا توجد طلبات</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              {showRequester && <TableHead>مقدم الطلب</TableHead>}
              {showRequester && <TableHead>القسم</TableHead>}
              <TableHead>النوع</TableHead>
              <TableHead>الموضوع</TableHead>
              <TableHead>تاريخ الطلب</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>الحالة</TableHead>
              {showActions && <TableHead className="w-[100px]">إجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.requestNumber}</TableCell>
                {showRequester && (
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm">{req.requesterName || 'غير معروف'}</span>
                    </div>
                  </TableCell>
                )}
                {showRequester && (
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm">{req.requesterDepartment || '-'}</span>
                    </div>
                  </TableCell>
                )}
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
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(req.status)}
                    {req.approverName && req.status !== 'pending' && (
                      <p className="text-xs text-gray-500">بواسطة: {req.approverName}</p>
                    )}
                  </div>
                </TableCell>
                {showActions && (
                  <TableCell>
                    {canApprove(req) && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(req)}
                          title="موافقة"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReject(req)}
                          title="رفض"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

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
              onClick={handleCreateRequest}
              className="w-full"
              disabled={!newRequest.type || !newRequest.subject || createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="my-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="my-requests">
            طلباتي ({myRequests.length})
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="assigned">
              مسندة إلي ({assignedRequests.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="all">
            {isAdmin ? 'كل الطلبات' : 'طلبات القسم'} ({allFilteredRequests.length})
          </TabsTrigger>
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
          {renderRequestTable(myRequests, false, false)}
        </TabsContent>

        {isManager && (
          <TabsContent value="assigned" className="mt-4">
            {renderRequestTable(assignedRequests, true, true)}
          </TabsContent>
        )}

        <TabsContent value="all" className="mt-4">
          {renderRequestTable(allFilteredRequests, isManager, isManager)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
