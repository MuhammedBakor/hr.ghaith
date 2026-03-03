import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitBranch, Plus, Loader2, CheckCircle, Clock, XCircle, Settings, Workflow as WorkflowIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Workflow() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const utils = trpc.useUtils();
  const { data: requests, isLoading } = trpc.requests?.list?.useQuery();
  const { data: workflows } = trpc.workflow.templates.list.useQuery();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerEvent: 'manual',
    entityType: 'request',
    isActive: true,
  });

  const createMutation = trpc.workflow.templates.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء مسار العمل بنجاح');
      utils.workflow.templates.list.invalidate();
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('فشل في إنشاء مسار العمل: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerEvent: 'manual',
      entityType: 'request',
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('يرجى إدخال اسم المسار');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      triggerEvent: formData.triggerEvent,
      isActive: formData.isActive,
    });
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const pending = (requests || []).filter((r: any) => r.status === 'pending').length;
  const approved = (requests || []).filter((r: any) => r.status === 'approved').length;
  const rejected = (requests || []).filter((r: any) => r.status === 'rejected').length;

  const triggerEvents = [
    { value: 'manual', label: 'يدوي' },
    { value: 'leave.created', label: 'عند إنشاء إجازة' },
    { value: 'purchase.created', label: 'عند إنشاء طلب شراء' },
    { value: 'expense.created', label: 'عند إنشاء مصروف' },
    { value: 'employee.created', label: 'عند إنشاء موظف' },
  ];

  const entityTypes = [
    { value: 'request', label: 'طلب' },
    { value: 'leave', label: 'إجازة' },
    { value: 'purchase_order', label: 'طلب شراء' },
    { value: 'expense', label: 'مصروف' },
    { value: 'employee', label: 'موظف' },
  ];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سير العمل</h2>
          <p className="text-gray-500">إدارة مسارات العمل والموافقات</p>
        </div>
        <Button className="gap-2" onClick={() => {
          resetForm();
          setIsOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          مسار جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50"><WorkflowIcon className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">المسارات</p>
              <p className="text-2xl font-bold">{workflows?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50"><Clock className="h-6 w-6 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-500">قيد الانتظار</p>
              <p className="text-2xl font-bold">{pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">موافق عليها</p>
              <p className="text-2xl font-bold">{approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50"><XCircle className="h-6 w-6 text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500">مرفوضة</p>
              <p className="text-2xl font-bold">{rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Templates */}
      {workflows && workflows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />مسارات العمل</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workflows.map((wf: any) => (
                <div key={wf.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <p className="font-medium">{wf.name}</p>
                    <p className="text-sm text-gray-500">{wf.description || 'بدون وصف'}</p>
                  </div>
                  <Badge variant={wf.isActive ? 'default' : 'secondary'}>
                    {wf.isActive ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="h-5 w-5" />الطلبات الأخيرة</CardTitle></CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="space-y-2">
              {requests.slice(0, 10).map((req: any) => (
                <div key={req.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <p className="font-medium">{req.requestType}</p>
                    <p className="text-sm text-gray-500">{req.createdAt ? formatDate(req.createdAt) : ''}</p>
                  </div>
                  <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {req.status === 'approved' ? 'موافق' : req.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-500 py-4">لا توجد طلبات</p>}
        </CardContent>
      </Card>

      {/* Create Workflow*/}
      {isOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إنشاء مسار عمل جديد</h3>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>اسم المسار *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: مسار الموافقة على الإجازات"
              />
            </div>
            
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للمسار"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>حدث التشغيل</Label>
                <Select
                  value={formData.triggerEvent}
                  onValueChange={(value) => setFormData({ ...formData, triggerEvent: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              
              <div className="space-y-2">
                <Label>نوع الكيان</Label>
                <Select
                  value={formData.entityType}
                  onValueChange={(value) => setFormData({ ...formData, entityType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إنشاء
            </Button>
          </div>
        
      </div>)}

    </div>
  );
}
