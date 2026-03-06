import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch, Plus, Search, Play, Pause, Settings, ArrowUpDown, Users, Clock, Loader2, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

interface WorkflowTemplate {
  id: number;
  name: string;
  description?: string;
  triggerEvent?: string;
  isActive: boolean;
  createdAt?: Date;
}

export default function Workflows() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof WorkflowTemplate>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    triggerEvent: '',
    isActive: true,
  });

  // جلب قوالب سير العمل من API
  const { data: workflowsData, isLoading, refetch } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => api.get('/workflow/templates').then(r => r.data),
  });

  // جلب الطلبات لحساب الإحصائيات
  const { data: requestsData } = useQuery({
    queryKey: ['requests'],
    queryFn: () => api.get('/requests').then(r => r.data),
  });

  // إنشاء سير عمل جديد
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/workflow/templates', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء سير العمل بنجاح');
      setShowNewDialog(false);
      setNewWorkflow({ name: '', description: '', triggerEvent: '', isActive: true });
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إنشاء سير العمل: ${error.message}`);
    },
  });

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const workflows = workflowsData || [];
    const requests = requestsData || [];
    const today = new Date().toDateString();
    
    const activeWorkflows = workflows.filter((w: any) => w.isActive).length;
    const totalInstances = requests.filter((r: any) => r.status === 'pending' || r.status === 'in_review').length;
    const completedToday = requests.filter((r: any) => 
      (r.status === 'approved' || r.status === 'completed') && 
      r.updatedAt && new Date(r.updatedAt).toDateString() === today
    ).length;

    return { activeWorkflows, totalInstances, completedToday };
  }, [workflowsData, requestsData]);

  const handleSort = (field: keyof WorkflowTemplate) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredData = (workflowsData || [])
    .filter((item: any) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a: any, b: any) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "boolean") {
        return sortDirection === "asc" ? (aValue ? 1 : -1) : (aValue ? -1 : 1);
      }
      return 0;
    });

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name.trim()) {
      toast.error('يرجى إدخال اسم سير العمل');
      return;
    }
    createMutation.mutate(newWorkflow);
  };

  const handleViewWorkflow = (workflow: WorkflowTemplate) => {
    setSelectedWorkflow(workflow);
    setShowViewDialog(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">نشط</Badge>
      : <Badge className="bg-gray-100 text-gray-800">متوقف</Badge>;
  };

  const getTriggerLabel = (trigger?: string) => {
    const triggers: Record<string, string> = {
      'request.created': 'عند إنشاء طلب',
      'leave.requested': 'عند طلب إجازة',
      'expense.submitted': 'عند تقديم مصروف',
      'contract.created': 'عند إنشاء عقد',
      'document.uploaded': 'عند رفع مستند',
    };
    return trigger ? triggers[trigger] || trigger : 'يدوي';
  };

  const SortButton = ({ field, children }: { field: keyof WorkflowTemplate; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? "text-primary" : "text-gray-400"}`} />
    </button>
  );

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل سير العمل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">سير العمل</h2>
          <p className="text-muted-foreground">إدارة ومتابعة سير العمل للطلبات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="ms-2 h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="ms-2 h-4 w-4" />
            سير عمل جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">سير العمل النشطة</p>
                <h3 className="text-2xl font-bold">{stats.activeWorkflows}</h3>
              </div>
              <GitBranch className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الطلبات قيد التنفيذ</p>
                <h3 className="text-2xl font-bold">{stats.totalInstances}</h3>
              </div>
              <Users className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مكتملة اليوم</p>
                <h3 className="text-2xl font-bold">{stats.completedToday}</h3>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي القوالب</p>
                <h3 className="text-2xl font-bold">{(workflowsData || []).length}</h3>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة سير العمل</CardTitle>
            <div className="relative w-64">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد سير عمل</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowNewDialog(true)}>
                <Plus className="ms-2 h-4 w-4" />
                إنشاء سير عمل جديد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-end p-3 font-medium">
                      <SortButton field="name">الاسم</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">الوصف</th>
                    <th className="text-end p-3 font-medium">المشغل</th>
                    <th className="text-end p-3 font-medium">
                      <SortButton field="isActive">الحالة</SortButton>
                    </th>
                    <th className="text-end p-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-muted-foreground">{item.description || '-'}</td>
                      <td className="p-3">{getTriggerLabel(item.triggerEvent)}</td>
                      <td className="p-3">{getStatusBadge(item.isActive)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewWorkflow(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedWorkflow(item);
                            setNewWorkflow({
                              name: item.name,
                              description: item.description || '',
                              triggerEvent: item.triggerEvent || '',
                              isActive: item.isActive,
                            });
                            setShowNewDialog(true);
                          }}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          {item.isActive ? (
                            <Button variant="ghost" size="sm" onClick={() => toast.success(`تم إيقاف ${item.name}`)}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => toast.success(`تم تشغيل ${item.name}`)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New/Edit Workflow Dialog */}
      {showNewDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{selectedWorkflow ? 'تعديل سير العمل' : 'إنشاء سير عمل جديد'}</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم سير العمل *</Label>
              <Input
                placeholder="مثال: اعتماد طلبات الإجازة"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input
                placeholder="وصف مختصر لسير العمل"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>المشغل التلقائي</Label>
              <Select
                value={newWorkflow.triggerEvent || 'manual'}
                onValueChange={(value) => setNewWorkflow({ ...newWorkflow, triggerEvent: value === 'manual' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشغل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="request.created">عند إنشاء طلب</SelectItem>
                  <SelectItem value="leave.requested">عند طلب إجازة</SelectItem>
                  <SelectItem value="expense.submitted">عند تقديم مصروف</SelectItem>
                  <SelectItem value="contract.created">عند إنشاء عقد</SelectItem>
                  <SelectItem value="document.uploaded">عند رفع مستند</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>تفعيل سير العمل</Label>
              <Switch
                checked={newWorkflow.isActive}
                onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, isActive: checked })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => {
              setShowNewDialog(false);
              setSelectedWorkflow(null);
              setNewWorkflow({ name: '', description: '', triggerEvent: '', isActive: true });
            }}>
              إلغاء
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              {selectedWorkflow ? 'حفظ التغييرات' : 'إنشاء'}
            </Button>
          </div>
        </div>
      </div>)}

      {/* View Workflow Dialog */}
      {showViewDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل سير العمل</h3>
          </div>
          {selectedWorkflow && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">الاسم</Label>
                  <p className="font-medium">{selectedWorkflow.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedWorkflow.isActive)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">الوصف</Label>
                <p>{selectedWorkflow.description || 'لا يوجد وصف'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">المشغل</Label>
                <p>{getTriggerLabel(selectedWorkflow.triggerEvent)}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
