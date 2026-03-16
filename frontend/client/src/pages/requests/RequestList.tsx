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
import { Search, Clock, CheckCircle2, AlertCircle, User, Check, X, Building2, Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
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
  requesterRole?: string;
  requesterDepartment?: string;
  requesterDepartmentId?: number;
  requesterBranch?: string;
  approverName?: string;
  assignedTo?: number | null;
  createdAt: string;
}

export default function RequestList() {
  const { data: currentUser, isError } = useUser();
  const { selectedRole, currentEmployee, currentEmployeeId, currentUserId } = useAppContext();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: '',
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null);
  const [editForm, setEditForm] = useState({ type: '', subject: '', description: '', priority: 'medium' });

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
      setViewMode(null);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast.error('فشل في التحديث: ' + (error?.message || 'حدث خطأ'));
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/requests/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف الطلب بنجاح');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setViewMode(null);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast.error('فشل في حذف الطلب: ' + (error?.response?.data?.message || error?.message || 'حدث خطأ'));
    },
  });

  const isOwnerOrGM = selectedRole === 'admin' || selectedRole === 'general_manager';

  // Role-based checks
  const isManager = ['admin', 'general_manager', 'hr_manager', 'department_manager'].includes(selectedRole);
  const isAdmin = ['admin', 'general_manager'].includes(selectedRole);
  const isSystemOwner = ['owner', 'admin', 'system_admin'].includes((user?.role as string)?.toLowerCase() || '');
  const isSupervisorOrAgent = ['supervisor', 'agent'].includes(selectedRole);

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

      // Admin/GM/Owner see all pending requests
      if (isAdmin || isSystemOwner) return true;

      // Department manager sees requests from their department
      if (selectedRole === 'department_manager' && myDeptId) {
        return req.requesterDepartmentId?.toString() === myDeptId?.toString();
      }

      // HR manager sees all pending requests
      if (selectedRole === 'hr_manager') return true;

      return false;
    })
  );

  // "All requests" tab - role-based visibility
  const allFilteredRequests = filterBySearch(
    (isAdmin || isSystemOwner)
      ? allRequests
      : selectedRole === 'hr_manager'
        ? allRequests
        : selectedRole === 'department_manager' && myDeptId
          ? allRequests.filter((req) =>
            req.requesterDepartmentId?.toString() === myDeptId?.toString() ||
            req.requesterId?.toString() === myUserId?.toString()
          )
          : allRequests.filter((req) => req.requesterId?.toString() === myUserId?.toString())
  );

  // Can this user approve/reject?
  const canApprove = (req: Request) => {
    // Admins/GMs can change status anytime
    const isAdminOrOwner = isAdmin || isSystemOwner;
    if (isAdminOrOwner) return true;

    // Others can only approve if pending and not their own
    if (req.status !== 'pending') return false;
    if (req.requesterId?.toString() === myUserId?.toString()) return false;

    if (selectedRole === 'hr_manager') return true;
    if (selectedRole === 'department_manager' && myDeptId) {
      return req.requesterDepartmentId?.toString() === myDeptId?.toString();
    }
    if (selectedRole === 'supervisor' && myDeptId) {
      return req.requesterDepartmentId?.toString() === myDeptId?.toString();
    }
    return false;
  };

  // Can edit: requester if request is still pending, or admin/owner
  const canEdit = (req: Request) => {
    if (isAdmin || isSystemOwner) return true;
    if (req.requesterId?.toString() === myUserId?.toString() && req.status === 'pending') return true;
    return false;
  };

  // Can delete: admin/owner only
  const canDelete = (req: Request) => isAdmin || isSystemOwner;

  const handleViewDetails = (req: Request) => {
    setSelectedRequest(req);
    setViewMode('view');
    setIsOpen(false);
  };

  const handleEditOpen = (req: Request) => {
    setSelectedRequest(req);
    setEditForm({
      type: req.requestType,
      subject: req.title,
      description: req.description || '',
      priority: req.priority,
    });
    setViewMode('edit');
    setIsOpen(false);
  };

  const handleEditSave = () => {
    if (!selectedRequest) return;
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      requestType: editForm.type,
      title: editForm.subject,
      description: editForm.description,
      priority: editForm.priority,
    });
  };

  const handleDelete = (req: Request) => {
    if (window.confirm(`هل أنت متأكد من حذف الطلب ${req.requestNumber}؟`)) {
      deleteRequestMutation.mutate(req.id);
    }
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
    const empBranch = (currentEmployee as any)?.branch?.nameAr || (currentEmployee as any)?.branch?.name || '';
    const roleLabels: Record<string, string> = {
      admin: 'مدير النظام', general_manager: 'المدير العام', hr_manager: 'مدير الموارد البشرية',
      department_manager: 'مدير القسم', supervisor: 'مشرف', employee: 'موظف', agent: 'وكيل',
    };
    const empRole = roleLabels[selectedRole] || selectedRole;

    createRequestMutation.mutate({
      requestNumber: `REQ-${Date.now()}`,
      requestType: newRequest.type,
      title: newRequest.subject,
      description: newRequest.description,
      priority: newRequest.priority,
      requesterId: myUserId,
      requesterName: empName,
      requesterRole: empRole,
      requesterDepartment: empDept,
      requesterDepartmentId: empDeptId,
      requesterBranch: empBranch,
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

  const renderRequestTable = (data: Request[], showRequester: boolean, showApproveActions: boolean) => (
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
              {showRequester && <TableHead>الدور / الفرع / القسم</TableHead>}
              <TableHead>النوع</TableHead>
              <TableHead>الموضوع</TableHead>
              <TableHead>تاريخ الطلب</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-[130px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((req) => (
              <TableRow key={req.id} className={selectedRequest?.id === req.id ? 'bg-blue-50' : ''}>
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
                    <div className="space-y-0.5">
                      {req.requesterRole && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-purple-400" />
                          <span className="text-xs text-purple-700">{req.requesterRole}</span>
                        </div>
                      )}
                      {req.requesterBranch && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-blue-700">{req.requesterBranch}</span>
                        </div>
                      )}
                      {req.requesterDepartment && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{req.requesterDepartment}</span>
                        </div>
                      )}
                      {!req.requesterRole && !req.requesterBranch && !req.requesterDepartment && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell>{getRequestTypeName(req.requestType)}</TableCell>
                <TableCell>
                  <div className="font-medium">{req.title}</div>
                  <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                    {req.requesterName} • {req.requesterRole}
                    <br />
                    {req.requesterBranch} / {req.requesterDepartment}
                  </div>
                </TableCell>
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
                <TableCell>
                  <div className="flex items-center gap-1">
                    {/* View details */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(req)}
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                    {/* Edit */}
                    {canEdit(req) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditOpen(req)}
                        title="تعديل"
                      >
                        <Pencil className="h-4 w-4 text-amber-500" />
                      </Button>
                    )}
                    {/* Approve/Reject */}
                    {((showApproveActions && canApprove(req)) || isAdmin || isSystemOwner) && (
                      <div className="flex gap-0.5">
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
                    {/* Delete */}
                    {(isOwnerOrGM || currentUserId === req.requesterId) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(req)}
                        title="حذف"
                        disabled={deleteRequestMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
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
        <Button onClick={() => { setIsOpen(!isOpen); setViewMode(null); setSelectedRequest(null); }}>
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

      {/* View Details Panel */}
      {viewMode === 'view' && selectedRequest && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          <div className="mb-4 border-b pb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">تفاصيل الطلب — {selectedRequest.requestNumber}</h3>
            <Button variant="ghost" size="icon" onClick={() => { setViewMode(null); setSelectedRequest(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-500">رقم الطلب:</span> <span className="font-medium">{selectedRequest.requestNumber}</span></div>
            <div><span className="text-sm text-gray-500">الحالة:</span> <span className="mr-1">{getStatusBadge(selectedRequest.status)}</span></div>
            <div><span className="text-sm text-gray-500">نوع الطلب:</span> <span className="font-medium">{getRequestTypeName(selectedRequest.requestType)}</span></div>
            <div><span className="text-sm text-gray-500">الأولوية:</span> <span className="font-medium flex items-center gap-1">{getPriorityIcon(selectedRequest.priority)}{selectedRequest.priority === 'high' ? 'عالية' : selectedRequest.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span></div>
            <div><span className="text-sm text-gray-500">الموضوع:</span> <span className="font-medium">{selectedRequest.title}</span></div>
            <div><span className="text-sm text-gray-500">تاريخ الطلب:</span> <span className="font-medium">{formatDate(selectedRequest.createdAt)}</span></div>
            <div><span className="text-sm text-gray-500">مقدم الطلب:</span> <span className="font-medium">{selectedRequest.requesterName || '-'}</span></div>
            <div><span className="text-sm text-gray-500">الدور:</span> <span className="font-medium">{selectedRequest.requesterRole || '-'}</span></div>
            <div><span className="text-sm text-gray-500">الفرع:</span> <span className="font-medium">{selectedRequest.requesterBranch || '-'}</span></div>
            <div><span className="text-sm text-gray-500">القسم:</span> <span className="font-medium">{selectedRequest.requesterDepartment || '-'}</span></div>
            {selectedRequest.approverName && (
              <div><span className="text-sm text-gray-500">المُوافق:</span> <span className="font-medium">{selectedRequest.approverName}</span></div>
            )}
            {selectedRequest.description && (
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500">التفاصيل:</span>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedRequest.description}</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            {canEdit(selectedRequest) && (
              <Button variant="outline" onClick={() => handleEditOpen(selectedRequest)}>
                <Pencil className="h-4 w-4 ml-1" /> تعديل
              </Button>
            )}
            {canDelete(selectedRequest) && (
              <Button variant="destructive" onClick={() => handleDelete(selectedRequest)} disabled={deleteRequestMutation.isPending}>
                <Trash2 className="h-4 w-4 ml-1" /> حذف
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Edit Panel */}
      {viewMode === 'edit' && selectedRequest && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          <div className="mb-4 border-b pb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">تعديل الطلب — {selectedRequest.requestNumber}</h3>
            <Button variant="ghost" size="icon" onClick={() => { setViewMode(null); setSelectedRequest(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نوع الطلب *</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger><SelectValue placeholder="اختر نوع الطلب" /></SelectTrigger>
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
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                placeholder="موضوع الطلب"
              />
            </div>
            <div className="space-y-2">
              <Label>التفاصيل</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="تفاصيل الطلب"
              />
            </div>
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleEditSave}
                disabled={!editForm.type || !editForm.subject || updateRequestMutation.isPending}
              >
                {updateRequestMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
              <Button variant="outline" onClick={() => { setViewMode(null); setSelectedRequest(null); }}>
                إلغاء
              </Button>
            </div>
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
            {(isAdmin || isSystemOwner) ? 'كل الطلبات' : selectedRole === 'department_manager' ? 'طلبات القسم' : 'سجل طلباتي'} ({allFilteredRequests.length})
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
          {renderRequestTable(allFilteredRequests, isManager || isSystemOwner, isManager || isSystemOwner)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
