import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, DollarSign, Pencil, Trash2, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { toast } from "sonner";

const componentTypeColors: Record<string, string> = {
  earning: "bg-green-100 text-green-800",
  deduction: "bg-red-100 text-red-800",
  benefit: "bg-blue-100 text-blue-800",
};

const componentTypeLabels: Record<string, string> = {
  earning: "استحقاق",
  deduction: "خصم",
  benefit: "ميزة",
};

const calculationTypeLabels: Record<string, string> = {
  fixed: "مبلغ ثابت",
  percentage: "نسبة مئوية",
  formula: "معادلة",
};

export default function SalaryComponents() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const [newComponent, setNewComponent] = useState({
    code: "",
    name: "",
    nameAr: "",
    componentType: "earning" as "earning" | "deduction",
    calculationType: "fixed" as "fixed" | "percentage" | "formula",
    defaultValue: "",
    isTaxable: false,
    isRecurring: true,
    displayOrder: 0,
    description: "",
  });

  const { data: components, isLoading, refetch } = trpc.hrAdvanced.salaryComponents.list.useQuery();

  const createComponentMutation = trpc.hrAdvanced.salaryComponents.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء مكون الراتب بنجاح");
      setIsCreateOpen(false);
      setNewComponent({
        code: "",
        name: "",
        nameAr: "",
        componentType: "earning",
        calculationType: "fixed",
        defaultValue: "",
        isTaxable: false,
        isRecurring: true,
        displayOrder: 0,
        description: "",
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Note: Delete functionality not available in API
  const handleDeleteComponent = (id: number) => {
    toast.error("حذف مكونات الراتب غير متاح حالياً");
  };

  const handleCreateComponent = () => {
    if (!newComponent.name.trim()) {
      toast.error("يرجى إدخال اسم المكون");
      return;
    }
    createComponentMutation.mutate({
      code: newComponent.code,
      name: newComponent.name,
      nameAr: newComponent.nameAr,
      componentType: newComponent.componentType,
      calculationType: newComponent.calculationType,
      defaultValue: newComponent.defaultValue || undefined,
      isTaxable: newComponent.isTaxable,
      isRecurring: newComponent.isRecurring,
      displayOrder: newComponent.displayOrder,
    });
  };

  

  const filteredComponents = components?.filter((comp: any) => {
    const matchesSearch = comp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.nameEn?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || comp.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const stats = {
    total: components?.length || 0,
    earnings: components?.filter((c: any) => c.type === "earning").length || 0,
    deductions: components?.filter((c: any) => c.type === "deduction").length || 0,
    benefits: components?.filter((c: any) => c.type === "benefit").length || 0,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">مكونات الراتب</h1>
          <p className="text-muted-foreground">إدارة بنود الاستحقاقات والخصومات</p>
        </div>
        {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء مكون راتب جديد</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label>الاسم بالعربية</Label>
                <Input
                  value={newComponent.name}
                  onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                  placeholder="مثال: بدل سكن"
                />
              </div>
              <div>
                <Label>الاسم بالإنجليزية</Label>
                <Input
                  value={newComponent.nameAr}
                  onChange={(e) => setNewComponent({ ...newComponent, nameAr: e.target.value })}
                  placeholder="e.g., Housing Allowance"
                />
              </div>
              <div>
                <Label>النوع</Label>
                <Select
                  value={newComponent.componentType}
                  onValueChange={(value: "earning" | "deduction") => setNewComponent({ ...newComponent, componentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">استحقاق</SelectItem>
                    <SelectItem value="deduction">خصم</SelectItem>
                    <SelectItem value="benefit">ميزة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>طريقة الحساب</Label>
                <Select
                  value={newComponent.calculationType}
                  onValueChange={(value: "fixed" | "percentage" | "formula") => setNewComponent({ ...newComponent, calculationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    <SelectItem value="percentage">نسبة مئوية</SelectItem>
                    <SelectItem value="formula">معادلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>القيمة الافتراضية</Label>
                <Input
                  type="number"
                  value={newComponent.defaultValue}
                  onChange={(e) => setNewComponent({ ...newComponent, defaultValue: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newComponent.description}
                  onChange={(e) => setNewComponent({ ...newComponent, description: e.target.value })}
                  placeholder="وصف المكون"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>خاضع للضريبة</Label>
                <Switch
                  checked={newComponent.isTaxable}
                  onCheckedChange={(checked) => setNewComponent({ ...newComponent, isTaxable: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>متكرر</Label>
                <Switch
                  checked={newComponent.isRecurring}
                  onCheckedChange={(checked) => setNewComponent({ ...newComponent, isRecurring: checked })}
                />
              </div>
              <Button 
                onClick={handleCreateComponent} 
                className="w-full"
                disabled={createComponentMutation.isPending}
              >
                {createComponentMutation.isPending ? "جاري الإنشاء..." : "إنشاء المكون"}
              </Button>
            </div>
          
        </div>)}

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المكونات</p>
              <p className="text-lg md:text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">استحقاقات</p>
              <p className="text-lg md:text-2xl font-bold">{stats.earnings}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">خصومات</p>
              <p className="text-lg md:text-2xl font-bold">{stats.deductions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مزايا</p>
              <p className="text-lg md:text-2xl font-bold">{stats.benefits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المكونات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="earning">استحقاقات</SelectItem>
                <SelectItem value="deduction">خصومات</SelectItem>
                <SelectItem value="benefit">مزايا</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المكونات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مكونات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">الاسم</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">طريقة الحساب</TableHead>
                  <TableHead className="text-end">القيمة الافتراضية</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComponents.map((comp: any) => (
                  <TableRow key={comp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{comp.name}</p>
                        <p className="text-sm text-muted-foreground">{comp.nameEn}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={componentTypeColors[comp.type] || componentTypeColors.earning}>
                        {componentTypeLabels[comp.type] || comp.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {calculationTypeLabels[comp.calculationType] || comp.calculationType}
                    </TableCell>
                    <TableCell>
                      {comp.calculationType === "percentage" 
                        ? `${comp.defaultValue}%` 
                        : `${comp.defaultValue} ر.س`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={comp.isActive ? "default" : "secondary"}>
                        {comp.isActive ? "مفعل" : "معطل"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toast.info('تعديل مكون الراتب')}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComponent(comp.id)}
                          className="text-red-600 hover:text-red-700"
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
