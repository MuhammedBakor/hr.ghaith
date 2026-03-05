import { useAppContext } from '@/contexts/AppContext';
import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, Wallet, TrendingUp, TrendingDown, Building2, DollarSign, FileText, ArrowRight, Loader2 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

// دالة توليد رقم الحساب التلقائي
const generateAccountNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const array = new Uint16Array(1);
  crypto.getRandomValues(array);
  const random = (array[0] % 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
};

// أنواع الحسابات
const accountTypes = [
  { value: "asset", label: "أصول", color: "bg-blue-100 text-blue-800" },
  { value: "liability", label: "خصوم", color: "bg-red-100 text-red-800" },
  { value: "equity", label: "حقوق ملكية", color: "bg-purple-100 text-purple-800" },
  { value: "revenue", label: "إيرادات", color: "bg-green-100 text-green-800" },
  { value: "expense", label: "مصروفات", color: "bg-orange-100 text-orange-800" },
];

type ViewMode = "list" | "add" | "edit";

export default function Accounts() {
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);

  const [newAccount, setNewAccount] = useState({
    accountNumber: generateAccountNumber(),
    name: "",
    nameEn: "",
    type: "asset",
    parentId: "",
    description: "",
    isActive: true,
  });

  // Fetch accounts
  const { data: accounts = [], isLoading, refetch, isError, error} = useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: () => api.get('/finance/accounts').then(r => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/accounts', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء الحساب بنجاح");
      setViewMode("list");
      resetNewAccount();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء إنشاء الحساب");
    },
  });

  // Mutations للتحديث والحذف
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/accounts/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تحديث الحساب بنجاح");
      setViewMode("list");
      setSelectedAccount(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء تحديث الحساب");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/finance/accounts/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success("تم حذف الحساب بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء حذف الحساب");
    },
  });

  const handleUpdate = () => {
    if (!selectedAccount) return;
    updateMutation.mutate({
      id: selectedAccount.id,
      name: selectedAccount.name,
      accountType: selectedAccount.accountType,
      isActive: selectedAccount.isActive,
    });
  };

  const handleDelete = (account: any) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: account });
    }
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteMutation.mutate({ id: accountToDelete.id });
    }
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const resetNewAccount = () => {
    setNewAccount({
      accountNumber: generateAccountNumber(),
      name: "",
      nameEn: "",
      type: "asset",
      parentId: "",
      description: "",
      isActive: true,
    });
  };

  const handleCreate = () => {
    if (!newAccount.accountNumber || !newAccount.name || !newAccount.type) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate({
      accountCode: newAccount.accountNumber,
      name: newAccount.name,
      accountType: newAccount.type as "asset" | "liability" | "equity" | "revenue" | "expense",
      parentId: newAccount.parentId && newAccount.parentId !== "none" ? parseInt(newAccount.parentId) : undefined,
    });
  };

  const handleStartEdit = (account: any) => {
    setSelectedAccount({ ...account });
    setViewMode("edit");
  };

  const toggleExpand = (accountId: number) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((account: any) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountCode.includes(searchTerm);
    const matchesType = filterType === "all" || account.accountType === filterType;
    return matchesSearch && matchesType;
  });

  // Get root accounts (no parent)
  const rootAccounts = filteredAccounts.filter((a: any) => !a.parentId);

  // Get child accounts
  const getChildren = (parentId: number) =>
    filteredAccounts.filter((a: any) => a.parentId === parentId);

  // Calculate stats
  const stats = {
    total: accounts.length,
    assets: accounts.filter((a: any) => a.accountType === "asset").length,
    liabilities: accounts.filter((a: any) => a.accountType === "liability").length,
    equity: accounts.filter((a: any) => a.accountType === "equity").length,
    revenue: accounts.filter((a: any) => a.accountType === "revenue").length,
    expenses: accounts.filter((a: any) => a.accountType === "expense").length,
  };

  const getTypeInfo = (type: string) => {
    return accountTypes.find((t) => t.value === type) || accountTypes[0];
  };

  const renderAccountRow = (account: any, level: number = 0): React.ReactNode => {
    const children = getChildren(account.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);
    const typeInfo = getTypeInfo(account.accountType);

    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <React.Fragment key={account.id}>
        <TableRow className="hover:bg-gray-50">
          <TableCell className="font-mono text-sm">{account.accountCode}</TableCell>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingRight: `${level * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              <span className="font-medium">{account.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
          </TableCell>
          <TableCell className="text-start font-mono">
            {account.balance?.toLocaleString("ar-SA") || "0"} ر.س.
          </TableCell>
          <TableCell>
            <Badge variant={account.isActive ? "default" : "secondary"}>
              {account.isActive ? "نشط" : "غير نشط"}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStartEdit(account)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => { if(window.confirm('هل أنت متأكد من الحذف؟')) handleDelete(account) }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && children.map((child: any) => renderAccountRow(child, level + 1))}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // نموذج إضافة حساب جديد
  if (viewMode === "add") {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewMode("list")}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إضافة حساب جديد</h1>
            <p className="text-gray-500">أدخل بيانات الحساب المحاسبي الجديد</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم الحساب (تلقائي)</Label>
                <Input
                  value={newAccount.accountNumber}
                  disabled
                  className="bg-muted font-mono"
                 placeholder="أدخل القيمة" />
              </div>
              <div className="space-y-2">
                <Label>نوع الحساب *</Label>
                <Select
                  value={newAccount.type}
                  onValueChange={(v) => setNewAccount({ ...newAccount, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اسم الحساب (عربي) *</Label>
                <Input
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="النقدية"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم الحساب (إنجليزي)</Label>
                <Input
                  value={newAccount.nameEn}
                  onChange={(e) => setNewAccount({ ...newAccount, nameEn: e.target.value })}
                  placeholder="أدخل..."
                />
              </div>
              <div className="space-y-2">
                <Label>الحساب الرئيسي</Label>
                <Select
                  value={newAccount.parentId}
                  onValueChange={(v) => setNewAccount({ ...newAccount, parentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب الرئيسي (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون حساب رئيسي</SelectItem>
                    {accounts.map((account: any) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.accountCode} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                  placeholder="وصف الحساب..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setViewMode("list")}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء الحساب
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // نموذج تعديل حساب
  if (viewMode === "edit" && selectedAccount) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode("list"); setSelectedAccount(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">تعديل الحساب</h1>
            <p className="text-gray-500">تعديل بيانات الحساب المحاسبي</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>رقم الحساب</Label>
                <Input value={selectedAccount.accountCode} disabled  placeholder="أدخل القيمة" />
              </div>
              <div className="space-y-2">
                <Label>نوع الحساب</Label>
                <Input value={getTypeInfo(selectedAccount.accountType).label} disabled  placeholder="أدخل القيمة" />
              </div>
              <div className="space-y-2">
                <Label>اسم الحساب (عربي)</Label>
                <Input
                  value={selectedAccount.name}
                  onChange={(e) =>
                    setSelectedAccount({ ...selectedAccount, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>اسم الحساب (إنجليزي)</Label>
                <Input
                  value={selectedAccount.nameEn || ""}
                  onChange={(e) =>
                    setSelectedAccount({ ...selectedAccount, nameEn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>الوصف</Label>
                <Input
                  value={selectedAccount.description || ""}
                  onChange={(e) =>
                    setSelectedAccount({ ...selectedAccount, description: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={selectedAccount.isActive}
                  onChange={(e) =>
                    setSelectedAccount({ ...selectedAccount, isActive: e.target.checked })
                  }
                />
                <Label htmlFor="isActive">حساب نشط</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode("list"); setSelectedAccount(null); }}>
                إلغاء
              </Button>
              <Button onClick={handleUpdate}>
                حفظ التغييرات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">دليل الحسابات</h1>
          <p className="text-gray-500">إدارة الحسابات المحاسبية وشجرة الحسابات</p>
        </div>
        <Button onClick={() => setViewMode("add")}>
          <Plus className="h-4 w-4 ms-2" />
          حساب جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الحسابات</p>
              <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
            </div>
            <Wallet className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">الأصول</p>
              <h3 className="text-2xl font-bold text-blue-600">{stats.assets}</h3>
            </div>
            <Building2 className="h-8 w-8 text-blue-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">الخصوم</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.liabilities}</h3>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">حقوق الملكية</p>
              <h3 className="text-2xl font-bold text-purple-600">{stats.equity}</h3>
            </div>
            <DollarSign className="h-8 w-8 text-purple-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">الإيرادات</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.revenue?.toLocaleString()}</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">المصروفات</p>
              <h3 className="text-2xl font-bold text-orange-600">{stats.expenses}</h3>
            </div>
            <FileText className="h-8 w-8 text-orange-400" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث برقم الحساب أو الاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>شجرة الحسابات</CardTitle>
              <PrintButton title="شجرة الحسابات" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">رقم الحساب</TableHead>
                <TableHead>اسم الحساب</TableHead>
                <TableHead className="w-[120px]">النوع</TableHead>
                <TableHead className="w-[150px] text-start">الرصيد</TableHead>
                <TableHead className="w-[100px]">الحالة</TableHead>
                <TableHead className="w-[100px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rootAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد حسابات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                rootAccounts.map((account: any) => renderAccountRow(account))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الحساب "{accountToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
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
