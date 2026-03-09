import { formatDate } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Loader2, User, Building2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

export default function Approvals() {
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole, currentEmployee, currentUserId } = useAppContext();
  const { data: currentUser } = useUser();

  const isAdmin = ['admin', 'general_manager'].includes(selectedRole);
  const isManager = ['admin', 'general_manager', 'hr_manager', 'department_manager', 'supervisor'].includes(selectedRole);
  const myDeptId = currentEmployee?.department?.id || currentEmployee?.departmentId;
  const myUserId = currentUserId || currentUser?.id;

  const queryClient = useQueryClient();
  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ['requests'],
    queryFn: () => api.get('/requests').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => api.put(`/requests/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success('تم تحديث الحالة');
    },
    onError: (e: any) => {
      toast.error(e.message || "حدث خطأ");
    },
  });

  const getApproverName = () =>
    currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : currentUser?.username || '';

  // Filter pending requests based on role
  const pendingRequests = (requests || []).filter((r: any) => {
    if (r.status !== 'pending') return false;
    // Don't show own requests
    if (r.requesterId?.toString() === myUserId?.toString()) return false;

    if (isAdmin) return true;
    if (selectedRole === 'hr_manager') return true;
    if ((selectedRole === 'department_manager' || selectedRole === 'supervisor') && myDeptId) {
      return r.requesterDepartmentId?.toString() === myDeptId?.toString();
    }
    return false;
  });

  const filteredPending = pendingRequests.filter((r: any) =>
    !searchTerm ||
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requesterDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requestType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count approved/rejected today
  const today = new Date().toDateString();
  const processedToday = (requests || []).filter((r: any) =>
    (r.status === 'approved' || r.status === 'rejected') &&
    r.updatedAt && new Date(r.updatedAt).toDateString() === today
  ).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (!isManager) {
    return (
      <div className="p-8 text-center text-gray-500" dir="rtl">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">ليس لديك صلاحية الموافقة على الطلبات</p>
        <p className="text-sm mt-2">يمكنك إنشاء طلبات جديدة من صفحة الطلبات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">الموافقات</h2>
        <p className="text-gray-500">الطلبات التي تحتاج موافقتك</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50"><Clock className="h-6 w-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500">قيد الانتظار</p>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">تمت معالجتها اليوم</p>
              <p className="text-2xl font-bold">{processedToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث بالاسم، القسم، النوع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pe-9"
          />
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 text-sm">
            مسح
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>الطلبات المعلقة</CardTitle>
            <PrintButton title="الطلبات المعلقة" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">مقدم الطلب</TableHead>
                <TableHead className="text-end">القسم</TableHead>
                <TableHead className="text-end">النوع</TableHead>
                <TableHead className="text-end">الموضوع</TableHead>
                <TableHead className="text-end">التاريخ</TableHead>
                <TableHead className="text-end">الأولوية</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد طلبات معلقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredPending.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{req.requesterName || 'غير معروف'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <span>{req.requesterDepartment || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{req.requestType}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.title}</TableCell>
                    <TableCell>{req.createdAt ? formatDate(req.createdAt) : '-'}</TableCell>
                    <TableCell>
                      <Badge className={
                        req.priority === 'high' ? 'bg-red-100 text-red-800' :
                        req.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {req.priority === 'high' ? 'عالية' : req.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate({
                            id: req.id,
                            status: 'approved',
                            approverName: getApproverName(),
                          })}
                        >
                          <CheckCircle className="h-4 w-4 me-1" />موافقة
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate({
                            id: req.id,
                            status: 'rejected',
                            approverName: getApproverName(),
                          })}
                        >
                          <XCircle className="h-4 w-4 me-1" />رفض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
