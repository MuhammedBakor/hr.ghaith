import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
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
import { Search, Wallet, Pencil, Trash2, TrendingUp, TrendingDown, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const commitmentTypeLabels: Record<string, string> = {
  loan: "قرض",
  lease: "إيجار",
  subscription: "اشتراك",
  contract: "عقد",
  installment: "قسط",
  other: "أخرى",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const statusLabels: Record<string, string> = {
  active: "نشط",
  completed: "مكتمل",
  overdue: "متأخر",
  pending: "قيد الانتظار",
};

export default function FinancialCommitments() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/financial-requests', data).then(r => r.data),
    onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); },
  });

  const [editingItem, setEditingItem] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/finance/financial-requests/${data.id}`).then(r => r.data),
    onSuccess: () => { refetch(); },
  });

  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'finance_manager';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [newCommitment, setNewCommitment] = useState({
    title: "",
    type: "loan" as string,
    amount: "",
    paidAmount: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "active" as string,
  });

  // بيانات مؤقتة - سيتم ربطها بالـ API لاحقاً
  const commitments: any[] = [];
  const isLoading = false;
  const refetch = () => {};

  const createCommitmentMutation = {
    mutate: (data: any) => {
      toast.info("هذه الميزة متاح");
      setIsCreateOpen(false);
      setNewCommitment({
        title: "",
        type: "loan",
        amount: "",
        paidAmount: "",
        startDate: "",
        endDate: "",
        description: "",
        status: "active",
      });
    },
    isPending: false,
  };

  const deleteCommitmentMutation = {
    mutate: (data: { id: number }) => {
      toast.info("هذه الميزة متاح");
    },
    isPending: false,
  };

  const handleCreateCommitment = () => {
    if (!newCommitment.title.trim()) {
      toast.error("يرجى إدخال عنوان الالتزام");
      return;
    }
    createCommitmentMutation.mutate({
      ...newCommitment,
      amount: parseFloat(newCommitment.amount) || 0,
      paidAmount: parseFloat(newCommitment.paidAmount) || 0,
      startDate: newCommitment.startDate ? new Date(newCommitment.startDate) : undefined,
      endDate: newCommitment.endDate ? new Date(newCommitment.endDate) : undefined,
    });
  };

  const handleDeleteCommitment = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الالتزام؟")) {
      deleteCommitmentMutation.mutate({ id });
    }
  };

  const filteredCommitments = commitments?.filter((c: any) => {
    const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const totalAmount = commitments?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;
  const totalPaid = commitments?.reduce((sum: number, c: any) => sum + (c.paidAmount || 0), 0) || 0;
  const totalRemaining = totalAmount - totalPaid;

  const stats = {
    total: commitments?.length || 0,
    active: commitments?.filter((c: any) => c.status === "active").length || 0,
    overdue: commitments?.filter((c: any) => c.status === "overdue").length || 0,
  };

  
  if (isError) return (
    <div className="p-8 text-center">
        {/* إضافة جديد */}
        <div className="mb-4 flex justify-between items-center">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {showCreateForm ? 'إلغاء' : '+ إضافة جديد'}
          </button>
        </div>
        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="الاسم" value={createData.name || ''} onChange={e => setCreateData({...createData, name: e.target.value})} className="px-3 py-2 border rounded-lg" />
              <input placeholder="الوصف" value={createData.description || ''} onChange={e => setCreateData({...createData, description: e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <button onClick={() => createMutation.mutate(createData)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ</button>
          </div>
        )}
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">الالتزامات المالية</h1>
          <p className="text-muted-foreground">إدارة القروض والأقساط والالتزامات المالية</p>
        </div>
        {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
          
          <div>
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء التزام مالي جديد</h3>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>العنوان</Label>
                <Input
                  value={newCommitment.title}
                  onChange={(e) => setNewCommitment({ ...newCommitment, title: e.target.value })}
                  placeholder="عنوان الالتزام"
                />
              </div>
              <div>
                <Label>النوع</Label>
                <Select
                  value={newCommitment.type}
                  onValueChange={(value) => setNewCommitment({ ...newCommitment, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loan">قرض</SelectItem>
                    <SelectItem value="lease">إيجار</SelectItem>
                    <SelectItem value="subscription">اشتراك</SelectItem>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="installment">قسط</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>المبلغ الإجمالي</Label>
                  <Input
                    type="number"
                    value={newCommitment.amount?.toLocaleString()}
                    onChange={(e) => setNewCommitment({ ...newCommitment, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>المبلغ المدفوع</Label>
                  <Input
                    type="number"
                    value={newCommitment.paidAmount}
                    onChange={(e) => setNewCommitment({ ...newCommitment, paidAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ البداية</Label>
                  <Input
                    type="date"
                    value={newCommitment.startDate}
                    onChange={(e) => setNewCommitment({ ...newCommitment, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>تاريخ النهاية</Label>
                  <Input
                    type="date"
                    value={newCommitment.endDate}
                    onChange={(e) => setNewCommitment({ ...newCommitment, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newCommitment.description}
                  onChange={(e) => setNewCommitment({ ...newCommitment, description: e.target.value })}
                  placeholder="وصف الالتزام"
                  rows={3}
                />
              </div>
              <div>
                <Label>الحالة</Label>
                <Select
                  value={newCommitment.status}
                  onValueChange={(value) => setNewCommitment({ ...newCommitment, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="overdue">متأخر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateCommitment} 
                className="w-full"
                disabled={createCommitmentMutation.isPending}
              >
                {createCommitmentMutation.isPending ? "جاري الإنشاء..." : "إنشاء الالتزام"}
              </Button>
            </div>
          </div>
        </div>)}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الالتزامات</p>
              <p className="text-lg md:text-2xl font-bold">{totalAmount.toLocaleString()} ر.س</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المدفوع</p>
              <p className="text-lg md:text-2xl font-bold">{totalPaid.toLocaleString()} ر.س</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المتبقي</p>
              <p className="text-lg md:text-2xl font-bold">{totalRemaining.toLocaleString()} ر.س</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">متأخرة</p>
              <p className="text-lg md:text-2xl font-bold">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الالتزامات..."
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
                <SelectItem value="loan">قرض</SelectItem>
                <SelectItem value="lease">إيجار</SelectItem>
                <SelectItem value="subscription">اشتراك</SelectItem>
                <SelectItem value="contract">عقد</SelectItem>
                <SelectItem value="installment">قسط</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="overdue">متأخر</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Commitments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الالتزامات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredCommitments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد التزامات مالية</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
<Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">العنوان</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">المبلغ</TableHead>
                  <TableHead className="text-end">المدفوع</TableHead>
                  <TableHead className="text-end">تاريخ النهاية</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommitments?.map((commitment: any) => (
                  <TableRow key={commitment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{commitment.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {commitment.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {commitmentTypeLabels[commitment.type] || commitment.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {commitment.amount?.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>
                      {commitment.paidAmount?.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {commitment.endDate 
                          ? format(new Date(commitment.endDate), "dd MMM yyyy", { locale: ar })
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[commitment.status] || statusColors.active}>
                        {statusLabels[commitment.status] || commitment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toast.info("تعديل الالتزام")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCommitment(commitment.id)}
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

                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(commitment)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: commitment.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
