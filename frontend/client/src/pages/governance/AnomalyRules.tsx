import { useAppContext } from '@/contexts/AppContext';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, AlertTriangle, Trash2, Edit, Zap, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AnomalyRules() {
  const queryClient = useQueryClient();
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    detectorType: "unusual_transaction",
    entityType: "transaction",
    condition: "",
    threshold: 0,
    severity: "medium" as "low" | "medium" | "high" | "critical",
    action: "alert" as "alert" | "block" | "escalate",
  });

  // جلب قواعد الشذوذ من API
  const { data: anomalyRules, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['anomaly-rules-list'],
    queryFn: () => api.get('/anomaly-rules').then(r => r.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['anomaly-rules-stats'],
    queryFn: () => api.get('/anomaly-rules/stats').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/anomaly-rules', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إضافة قاعدة الشذوذ بنجاح");
      setIsAddOpen(false);
      setNewRule({
        name: "",
        detectorType: "unusual_transaction",
        entityType: "transaction",
        condition: "",
        threshold: 0,
        severity: "medium",
        action: "alert",
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إضافة القاعدة: ${error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (data: any) => api.put(`/anomaly-rules/${data.id}/toggle`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تحديث حالة القاعدة");
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/anomaly-rules/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success("تم حذف القاعدة");
      refetch();
    },
  });

  const rulesList = anomalyRules || [];

  const filteredRules = rulesList.filter((rule: any) =>
    rule.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRule = () => {
    if (!newRule.name || !newRule.condition) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate(newRule);
  };

  const getCategoryBadge = (detectorType: string) => {
    if (detectorType.includes("financial") || detectorType.includes("budget") || detectorType.includes("payment")) {
      return <Badge className="bg-green-500">مالي</Badge>;
    }
    if (detectorType.includes("payroll") || detectorType.includes("access")) {
      return <Badge className="bg-blue-500">موارد بشرية</Badge>;
    }
    if (detectorType.includes("access") || detectorType.includes("pattern")) {
      return <Badge className="bg-red-500">أمني</Badge>;
    }
    if (detectorType.includes("fuel")) {
      return <Badge className="bg-purple-500">أسطول</Badge>;
    }
    return <Badge>{detectorType}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low": return <Badge variant="secondary">منخفض</Badge>;
      case "medium": return <Badge className="bg-amber-500">متوسط</Badge>;
      case "high": return <Badge className="bg-orange-500">عالي</Badge>;
      case "critical": return <Badge variant="destructive">حرج</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "alert": return <Badge variant="outline">تنبيه</Badge>;
      case "block": return <Badge variant="destructive">حظر</Badge>;
      case "escalate": return <Badge className="bg-purple-500">تصعيد</Badge>;
      default: return <Badge>{action}</Badge>;
    }
  };

  const ruleStats = stats || { total: 0, active: 0, triggered: 0, critical: 0 };

  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );



  if (isLoading) {


  return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جارٍ تحميل قواعد الشذوذ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">قواعد اكتشاف الشذوذ</h2>
          <p className="text-muted-foreground">إدارة قواعد الكشف التلقائي عن الأنماط غير الطبيعية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          {isAddOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">


              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إضافة قاعدة شذوذ جديدة</h3>
              </div>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>اسم القاعدة</Label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="مثال: تجاوز حد الصرف"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع الكاشف</Label>
                  <Select
                    value={newRule.detectorType}
                    onValueChange={(value) => setNewRule({ ...newRule, detectorType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="duplicate_invoice">فاتورة مكررة</SelectItem>
                      <SelectItem value="budget_overrun">تجاوز الميزانية</SelectItem>
                      <SelectItem value="fuel_cost_anomaly">شذوذ تكلفة الوقود</SelectItem>
                      <SelectItem value="payroll_spike">ارتفاع مفاجئ في الرواتب</SelectItem>
                      <SelectItem value="vendor_concentration">تركز الموردين</SelectItem>
                      <SelectItem value="late_payment">تأخر الدفع</SelectItem>
                      <SelectItem value="unusual_transaction">معاملة غير اعتيادية</SelectItem>
                      <SelectItem value="access_pattern_anomaly">شذوذ نمط الوصول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نوع الكيان</Label>
                  <Input
                    value={newRule.entityType}
                    onChange={(e) => setNewRule({ ...newRule, entityType: e.target.value })}
                    placeholder="مثال: transaction, invoice, employee"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الشرط</Label>
                  <Input
                    value={newRule.condition}
                    onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                    placeholder="مثال: amount > threshold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد</Label>
                  <Input
                    type="number"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) || 0 })}
                    placeholder="مثال: 50000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الخطورة</Label>
                    <Select
                      value={newRule.severity}
                      onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                        setNewRule({ ...newRule, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="critical">حرج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الإجراء</Label>
                    <Select
                      value={newRule.action}
                      onValueChange={(value: "alert" | "block" | "escalate") =>
                        setNewRule({ ...newRule, action: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alert">تنبيه</SelectItem>
                        <SelectItem value="block">حظر</SelectItem>
                        <SelectItem value="escalate">تصعيد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleAddRule}
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                      جارٍ الإضافة...
                    </>
                  ) : (
                    "إضافة القاعدة"
                  )}
                </Button>
              </div>

          </div>)}

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي القواعد</p>
              <h3 className="text-2xl font-bold">{ruleStats.total?.toLocaleString()}</h3>
            </div>
            <Zap className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">نشطة</p>
              <h3 className="text-2xl font-bold text-green-600">{ruleStats.active}</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مرات التفعيل</p>
              <h3 className="text-2xl font-bold text-amber-600">{ruleStats.triggered}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">حرجة</p>
              <h3 className="text-2xl font-bold text-red-600">{ruleStats.critical}</h3>
            </div>
            <DollarSign className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في قواعد الشذوذ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            قواعد الشذوذ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد قواعد شذوذ</p>
              <p className="text-sm mt-1">قم بإضافة قواعد جديدة للكشف عن الأنماط غير الطبيعية</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>القاعدة</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الشرط</TableHead>
                  <TableHead>الحد</TableHead>
                  <TableHead>الخطورة</TableHead>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules?.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{getCategoryBadge(rule.detectorType)}</TableCell>
                    <TableCell className="font-mono text-xs">{rule.condition}</TableCell>
                    <TableCell>{rule.threshold}</TableCell>
                    <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                    <TableCell>{getActionBadge(rule.action)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: rule.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("ميزة التعديل متاح")}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذه القاعدة؟")) {
                              deleteMutation.mutate({ id: rule.id });
                            }
                          }}
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
    </div>
  );
}
