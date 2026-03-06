import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bell, Settings, Loader2, Inbox, RefreshCw, Edit, Trash2, Play, Pause, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

export default function NotifyRules() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'user';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    triggerEvent: '',
    recipientType: 'all' as 'user' | 'role' | 'department' | 'branch' | 'all',
    customTitle: '',
    customMessage: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });

  const { data: rules, isLoading, refetch } = useQuery({ queryKey: ['notify-rules'], queryFn: () => api.get('/platform/notify-rules').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/platform/notify-rules', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء القاعدة بنجاح');
      setIsCreateOpen(false);
      setNewRule({
        name: '',
        description: '',
        triggerEvent: '',
        recipientType: 'all',
        customTitle: '',
        customMessage: '',
        priority: 'medium',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في إنشاء القاعدة: ${error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (data: any) => api.put(`/platform/notify-rules/${data.id}/toggle`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث حالة القاعدة');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث الحالة: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/platform/notify-rules/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف القاعدة بنجاح');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في حذف القاعدة: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/platform/notify-rules/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث القاعدة بنجاح');
      setIsEditOpen(false);
      setEditingRule(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث القاعدة: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newRule.name.trim() || !newRule.triggerEvent.trim()) {
      toast.error('يرجى إدخال اسم القاعدة والحدث المشغل');
      return;
    }
    createMutation.mutate(newRule);
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive: !isActive });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleEdit = (rule: any) => {
    setEditingRule({
      id: rule.id,
      name: rule.name,
      description: rule.description || '',
      triggerEvent: rule.triggerEvent,
      recipientType: rule.recipientType || 'all',
      customTitle: rule.customTitle || '',
      customMessage: rule.customMessage || '',
      priority: rule.priority || 'medium',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingRule.name.trim() || !editingRule.triggerEvent.trim()) {
      toast.error('يرجى إدخال اسم القاعدة والحدث المشغل');
      return;
    }
    updateMutation.mutate(editingRule);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">حرج</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">عالي</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">متوسط</Badge>;
      case 'low':
        return <Badge variant="secondary">منخفض</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getRecipientTypeBadge = (type: string) => {
    switch (type) {
      case 'all':
        return <Badge variant="outline">الجميع</Badge>;
      case 'user':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">مستخدم</Badge>;
      case 'role':
        return <Badge variant="outline" className="text-green-600 border-green-600">دور</Badge>;
      case 'department':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">قسم</Badge>;
      case 'branch':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">فرع</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const triggerEvents = [
    { value: 'request.created', label: 'إنشاء طلب جديد' },
    { value: 'request.approved', label: 'الموافقة على طلب' },
    { value: 'request.rejected', label: 'رفض طلب' },
    { value: 'invoice.created', label: 'إنشاء فاتورة' },
    { value: 'invoice.paid', label: 'دفع فاتورة' },
    { value: 'employee.created', label: 'إضافة موظف جديد' },
    { value: 'leave.requested', label: 'طلب إجازة' },
    { value: 'leave.approved', label: 'الموافقة على إجازة' },
    { value: 'attendance.late', label: 'تأخر في الحضور' },
    { value: 'vehicle.maintenance', label: 'صيانة مركبة' },
    { value: 'contract.expiring', label: 'انتهاء عقد قريباً' },
    { value: 'system.alert', label: 'تنبيه نظام' },
  ];

  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );



  if (isLoading) {


  return (
      <div className="flex items-center justify-center h-64" dir="rtl">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeRules = rules?.filter((r: any) => r.isActive).length || 0;
  const totalRules = rules?.length || 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">قواعد الإشعارات</h2>
          <p className="text-gray-500">إدارة قواعد الإشعارات التلقائية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
            
            <div>
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إنشاء قاعدة إشعارات جديدة</h3>
              </div>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم القاعدة</Label>
                  <Input
                    id="name"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="مثال: إشعار عند إنشاء طلب جديد"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="triggerEvent">الحدث المشغل</Label>
                  <Select
                    value={newRule.triggerEvent}
                    onValueChange={(value) => setNewRule({ ...newRule, triggerEvent: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحدث" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientType">نوع المستلم</Label>
                    <Select
                      value={newRule.recipientType}
                      onValueChange={(value: 'user' | 'role' | 'department' | 'branch' | 'all') => 
                        setNewRule({ ...newRule, recipientType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المستلم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الجميع</SelectItem>
                        <SelectItem value="user">مستخدم محدد</SelectItem>
                        <SelectItem value="role">دور محدد</SelectItem>
                        <SelectItem value="department">قسم محدد</SelectItem>
                        <SelectItem value="branch">فرع محدد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">الأولوية</Label>
                    <Select
                      value={newRule.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                        setNewRule({ ...newRule, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="critical">حرج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customTitle">عنوان الإشعار (اختياري)</Label>
                  <Input
                    id="customTitle"
                    value={newRule.customTitle}
                    onChange={(e) => setNewRule({ ...newRule, customTitle: e.target.value })}
                    placeholder="عنوان مخصص للإشعار"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customMessage">رسالة الإشعار (اختياري)</Label>
                  <Textarea
                    id="customMessage"
                    value={newRule.customMessage}
                    onChange={(e) => setNewRule({ ...newRule, customMessage: e.target.value })}
                    placeholder="رسالة مخصصة للإشعار..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Textarea
                    id="description"
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="وصف القاعدة..."
                    rows={2}
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ms-2" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 ms-2" />
                      إنشاء القاعدة
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي القواعد</p>
              <p className="text-2xl font-bold">{totalRules}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">قواعد نشطة</p>
              <p className="text-2xl font-bold">{activeRules}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gray-50">
              <Pause className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">قواعد معطلة</p>
              <p className="text-2xl font-bold">{totalRules - activeRules}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            قواعد الإشعارات
          </CardTitle>
              <PrintButton title="التقرير" />
        </CardHeader>
        <CardContent>
          {!rules || rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد قواعد إشعارات</p>
              <p className="text-sm text-gray-400">قم بإنشاء قاعدة جديدة للبدء</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الاسم</TableHead>
                  <TableHead className="text-end">الحدث المشغل</TableHead>
                  <TableHead className="text-end">المستلم</TableHead>
                  <TableHead className="text-end">الأولوية</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && (
                          <p className="text-xs text-gray-500">{rule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {rule.triggerEvent}
                      </Badge>
                    </TableCell>
                    <TableCell>{getRecipientTypeBadge(rule.recipientType)}</TableCell>
                    <TableCell>{getPriorityBadge(rule.priority)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggle(rule.id, rule.isActive)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => { if(window.confirm('هل أنت متأكد من الحذف؟')) handleDelete(rule.id) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {isEditOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل قاعدة الإشعار</h3>
          </div>
          {editingRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم القاعدة</Label>
                  <Input
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="اسم القاعدة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحدث المشغل</Label>
                  <Select
                    value={editingRule.triggerEvent}
                    onValueChange={(value) => setEditingRule({ ...editingRule, triggerEvent: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحدث" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="request.created">إنشاء طلب</SelectItem>
                      <SelectItem value="request.approved">موافقة على طلب</SelectItem>
                      <SelectItem value="request.rejected">رفض طلب</SelectItem>
                      <SelectItem value="employee.created">إضافة موظف</SelectItem>
                      <SelectItem value="attendance.late">تأخر في الحضور</SelectItem>
                      <SelectItem value="leave.approved">موافقة على إجازة</SelectItem>
                      <SelectItem value="vehicle.maintenance">صيانة مركبة</SelectItem>
                      <SelectItem value="geofence.exit">خروج من السياج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="وصف القاعدة"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع المستلم</Label>
                  <Select
                    value={editingRule.recipientType}
                    onValueChange={(value: any) => setEditingRule({ ...editingRule, recipientType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المستلم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الجميع</SelectItem>
                      <SelectItem value="user">مستخدم محدد</SelectItem>
                      <SelectItem value="role">دور محدد</SelectItem>
                      <SelectItem value="department">قسم محدد</SelectItem>
                      <SelectItem value="branch">فرع محدد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الأولوية</Label>
                  <Select
                    value={editingRule.priority}
                    onValueChange={(value: any) => setEditingRule({ ...editingRule, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="critical">حرج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>عنوان الإشعار (اختياري)</Label>
                <Input
                  value={editingRule.customTitle}
                  onChange={(e) => setEditingRule({ ...editingRule, customTitle: e.target.value })}
                  placeholder="عنوان مخصص للإشعار"
                />
              </div>
              <div className="space-y-2">
                <Label>رسالة الإشعار (اختياري)</Label>
                <Textarea
                  value={editingRule.customMessage}
                  onChange={(e) => setEditingRule({ ...editingRule, customMessage: e.target.value })}
                  placeholder="رسالة مخصصة للإشعار"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin ms-2" /> جاري الحفظ...</>
                  ) : (
                    'حفظ التعديلات'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>)}
    
      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}