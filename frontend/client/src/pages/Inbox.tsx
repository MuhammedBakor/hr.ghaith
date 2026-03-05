import { formatDate, formatDateTime } from '@/lib/formatDate';
/**
 * Persona-driven Inbox - صندوق الوارد التشغيلي
 *
 * كل دور يرى مهامه فقط:
 * - المدير العام: اعتمادات كبيرة، تصعيدات، استثناءات
 * - مدير المالية: فواتير، قيود، ميزانيات
 * - مدير HR: طلبات توظيف، إجازات، رواتب
 * - الموظف: مهامه الشخصية فقط
 */

import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox as InboxIcon, Clock, AlertTriangle, CheckCircle2, FileText, Users, DollarSign, Scale, Car, Building2, Eye, Check, X, ArrowUpRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useUser } from "@/services/authService";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

// أنواع المهام حسب الدور
const ROLE_TASK_TYPES: Record<string, string[]> = {
  ceo: ['escalation', 'exception', 'high_value_approval', 'policy_override'],
  cfo: ['budget_approval', 'large_payment', 'financial_exception', 'period_close'],
  hr_manager: ['hiring_approval', 'leave_approval', 'salary_change', 'termination'],
  legal_counsel: ['contract_review', 'legal_case', 'compliance_issue'],
  department_manager: ['team_leave', 'expense_approval', 'task_assignment'],
  employee: ['personal_task', 'training', 'document_sign', 'timesheet'],
  admin: ['*'] // يرى كل شيء
};

// ألوان حسب نوع المهمة
const TASK_TYPE_COLORS: Record<string, string> = {
  purchase_order: 'bg-blue-100 text-blue-800',
  leave_request: 'bg-green-100 text-green-800',
  invoice: 'bg-amber-100 text-amber-800',
  contract: 'bg-purple-100 text-purple-800',
  exception: 'bg-red-100 text-red-800',
  escalation: 'bg-orange-100 text-orange-800',
  approval: 'bg-indigo-100 text-indigo-800'
};

// أيقونات حسب الوحدة
const MODULE_ICONS: Record<string, React.ReactNode> = {
  finance: <DollarSign className="h-4 w-4" />,
  hr: <Users className="h-4 w-4" />,
  legal: <Scale className="h-4 w-4" />,
  fleet: <Car className="h-4 w-4" />,
  projects: <Building2 className="h-4 w-4" />,
  procurement: <FileText className="h-4 w-4" />
};

interface InboxItem {
  id: string;
  type: string;
  module: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'waiting';
  createdAt: Date;
  dueDate?: Date;
  assignedTo: number;
  createdBy: number;
  createdByName: string;
  entityType: string;
  entityId: number;
  actions: Array<{
    id: string;
    label: string;
    type: 'approve' | 'reject' | 'view' | 'escalate';
    url?: string;
  }>;
}

export default function Inbox() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (data: { id: string }) => api.delete(`/inbox/notifications/${data.id}`).then(res => res.data),
    onSuccess: () => { refetch(); },
  });

  const { data: currentUser, isError, error } = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  // جلب المهام من API
  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['inbox-tasks'],
    queryFn: () => api.get('/inbox/tasks').then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['inbox-stats'],
    queryFn: () => api.get('/inbox/stats').then(res => res.data),
  });

  // تصفية المهام حسب التبويب
  const filteredTasks = tasks?.filter((task: any) => {
    if (activeTab === 'pending') return task.type === 'approval';
    if (activeTab === 'in_progress') return task.type === 'action';
    return true;
  }) || [];

  // Mutations for approve/reject
  const approveMutation = useMutation({
    mutationFn: (data: { taskId: string; entityType: string; entityId: number }) =>
      api.post('/inbox/approve', data).then(res => res.data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error.response?.data?.message || error.message));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { taskId: string; entityType: string; entityId: number; reason: string }) =>
      api.post('/inbox/reject', data).then(res => res.data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleApprove = async (taskId: string, entityType: string, entityId: number) => {
    approveMutation.mutate({ taskId, entityType, entityId });
  };

  const handleReject = async (taskId: string, entityType: string, entityId: number, reason: string) => {
    rejectMutation.mutate({ taskId, entityType, entityId, reason });
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      normal: 'bg-blue-500 text-white',
      low: 'bg-gray-500 text-white'
    };
    const labels: Record<string, string> = {
      urgent: 'عاجل',
      high: 'مرتفع',
      normal: 'عادي',
      low: 'منخفض'
    };
    return <Badge className={colors[priority]}>{labels[priority]}</Badge>;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    return 'الآن';
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


  return (
    <DashboardLayout>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">✕</button>}
        </div>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">صندوق الوارد</h1>
            <p className="text-muted-foreground">
              المهام والطلبات المعلقة التي تتطلب إجراءك
            </p>

          <button onClick={() => setShowDialog(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">+ إضافة</button>
        </div>
          <Button variant="outline" onClick={() => refetch()}>
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.approvals || 0}</p>
                <p className="text-sm text-muted-foreground">معلق</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.critical || 0}</p>
                <p className="text-sm text-muted-foreground">عاجل</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <InboxIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.reviews || 0}</p>
                <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">مكتمل اليوم</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              معلق ({stats?.approvals || 0})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              قيد التنفيذ ({stats?.reviews || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              مكتمل
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : !filteredTasks?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">لا توجد مهام</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending'
                      ? 'لا توجد مهام معلقة تتطلب إجراءك'
                      : activeTab === 'in_progress'
                      ? 'لا توجد مهام قيد التنفيذ'
                      : 'لم تكتمل أي مهام بعد'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTasks?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((item: any) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Icon & Info */}
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${TASK_TYPE_COLORS[item.type] || 'bg-gray-100'}`}>
                            {MODULE_ICONS[item.module] || <FileText className="h-4 w-4" />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{item.title}</h3>
                              {getPriorityBadge(item.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>من: {item.createdByName}</span>
                              <span>{getTimeAgo(item.createdAt)}</span>
                              {item.dueDate && (
                                <span className="text-red-500">
                                  يستحق: {formatDate(item.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                          {(item.actions || []).map((action: any) => (
                            action.type === 'view' ? (
                              <Link key={action.id} href={action.url || '#'}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 ms-1" />
                                  عرض
                                </Button>
                              </Link>
                            ) : action.type === 'approve' ? (
                              <Button
                                key={action.id}
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(item.id, item.entityType, item.entityId)}
                                disabled={false}
                              >
                                <Check className="h-4 w-4 ms-1" />
                                اعتماد
                              </Button>
                            ) : action.type === 'reject' ? (
                              <Button
                                key={action.id}
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(item.id, item.entityType, item.entityId, 'رفض')}
                                disabled={false}
                              >
                                <X className="h-4 w-4 ms-1" />
                                رفض
                              </Button>
                            ) : action.type === 'escalate' ? (
                              <Button disabled={deleteMutation.isPending}
                                key={action.id}
                                variant="outline"
                                size="sm"
                              >
                                <ArrowUpRight className="h-4 w-4 ms-1" />
                                تصعيد
                              </Button>
                            ) : null
                          ))}
                        </div>
                      </div>
                    </CardContent>

                <div className="flex gap-2 mt-2"> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: item.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">إدخال البيانات</h3>
              <div className="space-y-3">
                <input aria-label="حقل إدخال" className="w-full border rounded-lg p-2 text-end" placeholder="الاسم / العنوان" onChange={e => setFormData({...formData, name: e.target.value})} />
                <textarea className="w-full border rounded-lg p-2 text-end" placeholder="الوصف / الملاحظات" rows={3} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                <button onClick={() => { setShowDialog(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
