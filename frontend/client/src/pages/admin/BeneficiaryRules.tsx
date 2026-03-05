import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
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
import { toast } from 'sonner';
import { Settings, Plus, Inbox, Shield, Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PrintButton } from "@/components/PrintButton";

export default function BeneficiaryRules() {
  const { data: currentUser, isError, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me").then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<any>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    nameAr: '',
    description: '',
    ruleType: 'eligibility' as const,
    targetCategory: 'all' as const,
    minValue: '',
    maxValue: '',
    priority: '0',
  });

  // جلب القواعد من الـ API
  const { data: rules, isLoading, refetch } = useQuery({
    queryKey: ["beneficiaryRules", "list"],
    queryFn: () => api.get("/beneficiary-rules").then(r => r.data),
  });

  // mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/beneficiary-rules", data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إضافة القاعدة بنجاح');
      setShowAddDialog(false);
      setNewRule({
        name: '',
        nameAr: '',
        description: '',
        ruleType: 'eligibility',
        targetCategory: 'all',
        minValue: '',
        maxValue: '',
        priority: '0',
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إضافة القاعدة: ${error.message}`);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (data: any) => api.post("/beneficiary-rules/toggle-active", data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث حالة القاعدة');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في تحديث الحالة: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/beneficiary-rules/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف القاعدة');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في حذف القاعدة: ${error.message}`);
    },
  });

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error('يرجى إدخال اسم القاعدة');
      return;
    }
    createMutation.mutate({
      ...newRule,
      minValue: newRule.minValue ? parseFloat(newRule.minValue) : undefined,
      maxValue: newRule.maxValue ? parseFloat(newRule.maxValue) : undefined,
      priority: parseInt(newRule.priority) || 0,
    });
  };

  const getRuleTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      eligibility: 'أهلية',
      limit: 'حد',
      condition: 'شرط',
      exclusion: 'استثناء',
      priority: 'أولوية',
    };
    return types[type] || type;
  };

  const getTargetLabel = (target: string) => {
    const targets: Record<string, string> = {
      employee: 'موظف',
      department: 'قسم',
      branch: 'فرع',
      position: 'منصب',
      all: 'الكل',
    };
    return targets[target] || target;
  };

  const activeRules = rules?.filter(r => r.isActive) || [];

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;


    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">قواعد المستفيدين</h2>
          <p className="text-gray-500">إدارة قواعد وشروط المستفيدين</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          قاعدة جديدة
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">القواعد النشطة</p>
              <p className="text-2xl font-bold">{activeRules.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي القواعد</p>
              <p className="text-2xl font-bold">{rules?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة القواعد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            قائمة القواعد
          </CardTitle>
          <PrintButton title="التقرير" />
        </CardHeader>
        <CardContent>
          {rules && rules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الاسم</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">الفئة المستهدفة</TableHead>
                  <TableHead className="text-end">الأولوية</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.nameAr || rule.name}</p>
                        {rule.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRuleTypeLabel(rule.ruleType)}</Badge>
                    </TableCell>
                    <TableCell>{getTargetLabel(rule.targetCategory)}</TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      {rule.isActive ? (
                        <Badge className="bg-green-100 text-green-800">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActiveMutation.mutate({
                            id: rule.id,
                            isActive: !rule.isActive,
                          })}
                        >
                          {rule.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRuleToDelete(rule);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">لا توجد قواعد</p>
              <p className="text-sm text-gray-400">أضف قواعد جديدة للمستفيدين</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة إضافة قاعدة */}
      {showAddDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إضافة قاعدة جديدة</h3>
            <p className="text-sm text-gray-500">
              أدخل بيانات القاعدة الجديدة
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم (إنجليزي) *</Label>
              <Input
                id="name"
                placeholder="مثال: Minimum Service Years"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameAr">الاسم (عربي)</Label>
              <Input
                id="nameAr"
                placeholder="مثال: الحد الأدنى لسنوات الخدمة"
                value={newRule.nameAr}
                onChange={(e) => setNewRule({ ...newRule, nameAr: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                placeholder="وصف القاعدة..."
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ruleType">نوع القاعدة</Label>
                <Select
                  value={newRule.ruleType}
                  onValueChange={(value: any) => setNewRule({ ...newRule, ruleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eligibility">أهلية</SelectItem>
                    <SelectItem value="limit">حد</SelectItem>
                    <SelectItem value="condition">شرط</SelectItem>
                    <SelectItem value="exclusion">استثناء</SelectItem>
                    <SelectItem value="priority">أولوية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetCategory">الفئة المستهدفة</Label>
                <Select
                  value={newRule.targetCategory}
                  onValueChange={(value: any) => setNewRule({ ...newRule, targetCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="department">قسم</SelectItem>
                    <SelectItem value="branch">فرع</SelectItem>
                    <SelectItem value="position">منصب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minValue">الحد الأدنى</Label>
                <Input
                  id="minValue"
                  type="number"
                  placeholder="0"
                  value={newRule.minValue}
                  onChange={(e) => setNewRule({ ...newRule, minValue: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxValue">الحد الأقصى</Label>
                <Input
                  id="maxValue"
                  type="number"
                  placeholder="0"
                  value={newRule.maxValue}
                  onChange={(e) => setNewRule({ ...newRule, maxValue: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">الأولوية</Label>
                <Input
                  id="priority"
                  type="number"
                  placeholder="0"
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddRule} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
              إضافة
            </Button>
          </div>
        </div>
      </div>)}

      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه القاعدة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (ruleToDelete) {
                  deleteMutation.mutate({ id: ruleToDelete.id });
                }
                setDeleteDialogOpen(false);
                setRuleToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
