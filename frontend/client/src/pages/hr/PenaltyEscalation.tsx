import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Search, RefreshCw, AlertTriangle, ArrowUp, Trash2, Edit, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PenaltyEscalation() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    violationTypeId: 0,
    occurrenceNumber: 1,
    penaltyTypeId: 0,
    periodMonths: 12,
  });

  // جلب قواعد التصعيد من API
  const { data: escalationData, isLoading, refetch } = useQuery({
    queryKey: ['escalationRules'],
    queryFn: () => api.get('/hr/control-kernel/escalation').then(res => res.data),
  });

  // جلب أنواع المخالفات
  const { data: violationTypes } = useQuery({
    queryKey: ['violationTypes'],
    queryFn: () => api.get('/hr/control-kernel/violation-types').then(res => res.data),
  });

  // جلب أنواع الجزاءات
  const { data: penaltyTypes } = useQuery({
    queryKey: ['penaltyTypes'],
    queryFn: () => api.get('/hr/control-kernel/penalty-types').then(res => res.data),
  });

  // إضافة قاعدة تصعيد جديدة
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/control-kernel/escalation', data).then(res => res.data),
    onSuccess: () => {
      toast.success("تم إضافة قاعدة التصعيد بنجاح");
      setIsAddOpen(false);
      setNewRule({
        violationTypeId: 0,
        occurrenceNumber: 1,
        penaltyTypeId: 0,
        periodMonths: 12,
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة القاعدة");
    },
  });

  // حذف قاعدة تصعيد
  const deleteMutation = useMutation({
    mutationFn: ({ id }: any) => api.delete(`/hr/control-kernel/escalation/${id}`),
    onSuccess: () => {
      toast.success("تم حذف قاعدة التصعيد بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف القاعدة");
    },
  });

  const escalationRules = escalationData || [];

  // تجميع القواعد حسب نوع المخالفة
  const groupedRules = escalationRules.reduce((acc: any, rule: any) => {
    const violationType = violationTypes?.find((v: any) => v.id === rule.violationTypeId);
    const key = violationType?.nameAr || violationType?.name || `نوع ${rule.violationTypeId}`;
    
    if (!acc[key]) {
      acc[key] = {
        violationType: key,
        violationTypeId: rule.violationTypeId,
        levels: {},
        periodMonths: rule.periodMonths || 12,
      };
    }
    
    const penaltyType = penaltyTypes?.find((p: any) => p.id === rule.penaltyTypeId);
    acc[key].levels[rule.occurrenceNumber] = {
      id: rule.id,
      penalty: penaltyType?.nameAr || penaltyType?.name || `جزاء ${rule.penaltyTypeId}`,
      penaltyTypeId: rule.penaltyTypeId,
    };
    
    return acc;
  }, {});

  const filteredRules = Object.values(groupedRules).filter((rule: any) =>
    rule.violationType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRule = () => {
    if (!newRule.violationTypeId || !newRule.penaltyTypeId) {
      toast.error("يرجى اختيار نوع المخالفة ونوع الجزاء");
      return;
    }
    createMutation.mutate(newRule);
  };

  const handleDeleteRule = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه القاعدة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const getLevelBadge = (penalty: string) => {
    if (penalty.includes("شفهي")) return <Badge variant="secondary">{penalty}</Badge>;
    if (penalty.includes("كتابي")) return <Badge className="bg-amber-500">{penalty}</Badge>;
    if (penalty.includes("خصم")) return <Badge className="bg-orange-500">{penalty}</Badge>;
    if (penalty.includes("إيقاف")) return <Badge className="bg-red-400">{penalty}</Badge>;
    if (penalty.includes("فصل")) return <Badge variant="destructive">{penalty}</Badge>;
    return <Badge>{penalty}</Badge>;
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جارٍ تحميل قواعد التصعيد...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">تصعيد العقوبات</h2>
          <p className="text-muted-foreground">إدارة قواعد تصعيد العقوبات التدريجية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          {isAddOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
            
            
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إضافة قاعدة تصعيد جديدة</h3>
              </div>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>نوع المخالفة</Label>
                  <Select
                    value={newRule.violationTypeId?.toString() || ""}
                    onValueChange={(value) => setNewRule({ ...newRule, violationTypeId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المخالفة" />
                    </SelectTrigger>
                    <SelectContent>
                      {violationTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.nameAr || type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم التكرار</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={newRule.occurrenceNumber}
                      onChange={(e) => setNewRule({ ...newRule, occurrenceNumber: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>فترة إعادة التعيين (شهور)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newRule.periodMonths}
                      onChange={(e) => setNewRule({ ...newRule, periodMonths: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>نوع الجزاء</Label>
                  <Select
                    value={newRule.penaltyTypeId?.toString() || ""}
                    onValueChange={(value) => setNewRule({ ...newRule, penaltyTypeId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الجزاء" />
                    </SelectTrigger>
                    <SelectContent>
                      {penaltyTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.nameAr || type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800">كيف يعمل نظام التصعيد؟</h4>
              <p className="text-sm text-amber-700 mt-1">
                عند تكرار نفس المخالفة، يتم تصعيد العقوبة تلقائياً للمستوى التالي. 
                يتم إعادة تعيين العداد بعد انقضاء فترة "أشهر إعادة التعيين" من آخر مخالفة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في قواعد التصعيد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Escalation Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5" />
            قواعد التصعيد ({escalationRules.length} قاعدة)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد قواعد تصعيد</p>
              <p className="text-sm mt-1">قم بإضافة قواعد تصعيد جديدة لتفعيل نظام العقوبات التدريجي</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع المخالفة</TableHead>
                  <TableHead>المستوى 1</TableHead>
                  <TableHead>المستوى 2</TableHead>
                  <TableHead>المستوى 3</TableHead>
                  <TableHead>المستوى 4</TableHead>
                  <TableHead>المستوى 5</TableHead>
                  <TableHead>إعادة التعيين</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredRules as any[]).map((rule: any) => (
                  <TableRow key={rule.violationTypeId}>
                    <TableCell className="font-medium">{rule.violationType}</TableCell>
                    <TableCell>
                      {rule.levels[1] ? getLevelBadge(rule.levels[1].penalty) : <Badge variant="outline">-</Badge>}
                    </TableCell>
                    <TableCell>
                      {rule.levels[2] ? getLevelBadge(rule.levels[2].penalty) : <Badge variant="outline">-</Badge>}
                    </TableCell>
                    <TableCell>
                      {rule.levels[3] ? getLevelBadge(rule.levels[3].penalty) : <Badge variant="outline">-</Badge>}
                    </TableCell>
                    <TableCell>
                      {rule.levels[4] ? getLevelBadge(rule.levels[4].penalty) : <Badge variant="outline">-</Badge>}
                    </TableCell>
                    <TableCell>
                      {rule.levels[5] ? getLevelBadge(rule.levels[5].penalty) : <Badge variant="outline">-</Badge>}
                    </TableCell>
                    <TableCell>{rule.periodMonths} شهر</TableCell>
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
                            // حذف جميع قواعد هذا النوع
                            Object.values(rule.levels).forEach((level: any) => {
                              if (level?.id) handleDeleteRule(level.id);
                            });
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
