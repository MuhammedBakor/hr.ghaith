import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Plus,
  Search,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Calculator,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAppContext } from '@/contexts/AppContext';
import { PrintButton } from "@/components/PrintButton";

// حالات القيد
const entryStatuses = [
  { value: "draft", label: "مسودة", color: "bg-gray-100 text-gray-800", icon: Clock },
  { value: "pending_approval", label: "بانتظار الاعتماد", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "approved", label: "معتمد", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "posted", label: "مرحّل", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  { value: "reversed", label: "معكوس", color: "bg-purple-100 text-purple-800", icon: XCircle },
  { value: "rejected", label: "مرفوض", color: "bg-red-100 text-red-800", icon: XCircle },
];

// دالة توليد رقم القيد التلقائي
const generateEntryNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 6).toUpperCase();
  return `JE-${timestamp}-${random}`;
};

export default function JournalEntries() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [view, setView] = useState<'list' | 'add' | 'details'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [newEntry, setNewEntry] = useState({
    entryNumber: generateEntryNumber(),
    date: new Date().toISOString().split("T")[0],
    description: "",
    reference: "",
    lines: [
      { accountId: "", debit: "", credit: "", description: "" },
      { accountId: "", debit: "", credit: "", description: "" },
    ],
  });

  // جلب الفرع المختار
  const { selectedBranchId, branches } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);

  // Fetch journal entries
  const { data: entries = [], isLoading, refetch, isError, error} = useQuery({
    queryKey: ['finance', 'journal-entries', selectedBranchId],
    queryFn: () => api.get('/finance/journal-entries', { params: { branchId: selectedBranchId || undefined } }).then(r => r.data),
  });

  // Fetch accounts for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: () => api.get('/finance/accounts').then(r => r.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/journal-entries', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء القيد بنجاح");
      setView('list');
      resetNewEntry();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message || "حدث خطأ أثناء إنشاء القيد");
    },
  });

  // Mutations for journal entry lifecycle
  const submitMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/journal-entries/${data.id}/submit`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إرسال القيد للاعتماد");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error.message || "حدث خطأ"),
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/journal-entries/${data.id}/approve`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم اعتماد القيد");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error.message || "حدث خطأ"),
  });

  const rejectMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/journal-entries/${data.id}/reject`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم رفض القيد");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error.message || "حدث خطأ"),
  });

  const postMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/journal-entries/${data.id}/post`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم ترحيل القيد وتحديث أرصدة الحسابات");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error.message || "حدث خطأ"),
  });

  const reverseMutation = useMutation({
    mutationFn: (data: any) => api.put(`/finance/journal-entries/${data.id}/reverse`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم عكس القيد بنجاح");
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error.message || "حدث خطأ"),
  });

  const handleSubmit = (id: number) => {
    submitMutation.mutate({ id });
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id });
  };

  const handleReject = (id: number) => {
    const reason = prompt("سبب الرفض:");
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const handlePost = (id: number) => {
    postMutation.mutate({ id });
  };

  const handleReverse = (id: number) => {
    const reason = prompt("سبب عكس القيد:");
    if (reason) {
      reverseMutation.mutate({ id, reason });
    }
  };

  const resetNewEntry = () => {
    setNewEntry({
      entryNumber: generateEntryNumber(),
      date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      lines: [
        { accountId: "", debit: "", credit: "", description: "" },
        { accountId: "", debit: "", credit: "", description: "" },
      ],
    });
  };

  const addLine = () => {
    setNewEntry({
      ...newEntry,
      lines: [...newEntry.lines, { accountId: "", debit: "", credit: "", description: "" }],
    });
  };

  const removeLine = (index: number) => {
    if (newEntry.lines.length <= 2) {
      toast.error("يجب أن يحتوي القيد على سطرين على الأقل");
      return;
    }
    const newLines = [...newEntry.lines];
    newLines.splice(index, 1);
    setNewEntry({ ...newEntry, lines: newLines });
  };

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...newEntry.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setNewEntry({ ...newEntry, lines: newLines });
  };

  const calculateTotals = () => {
    const totalDebit = newEntry.lines.reduce(
      (sum, line) => sum + (parseFloat(line.debit) || 0),
      0
    );
    const totalCredit = newEntry.lines.reduce(
      (sum, line) => sum + (parseFloat(line.credit) || 0),
      0
    );
    return { totalDebit, totalCredit, isBalanced: totalDebit === totalCredit };
  };

  const handleCreate = () => {
    const { totalDebit, totalCredit, isBalanced } = calculateTotals();
    
    if (!newEntry.date || !newEntry.description) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!isBalanced) {
      toast.error("القيد غير متوازن. يجب أن يتساوى إجمالي المدين مع إجمالي الدائن");
      return;
    }

    if (totalDebit === 0) {
      toast.error("يجب إدخال مبالغ في القيد");
      return;
    }

    const validLines = newEntry.lines.filter(
      (line) => line.accountId && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0)
    );

    if (validLines.length < 2) {
      toast.error("يجب إدخال سطرين على الأقل مع مبالغ صحيحة");
      return;
    }

    createMutation.mutate({
      entryNumber: newEntry.entryNumber,
      entryDate: new Date(newEntry.date),
      description: newEntry.description,
      reference: newEntry.reference || undefined,
      totalDebit: String(totalDebit),
      totalCredit: String(totalCredit),
      lines: validLines.map(line => ({
        accountId: parseInt(line.accountId),
        debit: line.debit || undefined,
        credit: line.credit || undefined,
        description: line.description || undefined,
      })),
    });
  };

  // Filter entries
  const filteredEntries = entries.filter((entry: any) => {
    const matchesSearch =
      entry.entryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: entries.length,
    draft: entries.filter((e: any) => e.status === "draft").length,
    pending: entries.filter((e: any) => e.status === "pending_approval").length,
    approved: entries.filter((e: any) => e.status === "approved").length,
    posted: entries.filter((e: any) => e.status === "posted").length,
  };

  const getStatusInfo = (status: string) => {
    return entryStatuses.find((s) => s.value === status) || entryStatuses[0];
  };

  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return "غير محدد";
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) return "تاريخ غير صالح";
      return date.toLocaleDateString("ar-SA");
    } catch {
      return "تاريخ غير صالح";
    }
  };

  const { totalDebit, totalCredit, isBalanced } = calculateTotals();

  // عرض نموذج إنشاء قيد جديد
  if (view === 'add') {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); resetNewEntry(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إنشاء قيد محاسبي جديد</h2>
            <p className="text-muted-foreground">أدخل بيانات القيد المحاسبي</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              بيانات القيد
            </CardTitle>
              <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Entry Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رقم القيد (تلقائي)</Label>
                  <Input
                    value={newEntry.entryNumber}
                    disabled
                    className="bg-muted font-mono"
                   placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ *</Label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المرجع</Label>
                  <Input
                    value={newEntry.reference}
                    onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                    placeholder="رقم الفاتورة أو المستند"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف *</Label>
                <Textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="وصف القيد المحاسبي..."
                  rows={2}
                />
              </div>

              {/* Entry Lines */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">بنود القيد</Label>
                  <Button variant="outline" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4 ms-2" />
                    إضافة سطر
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px] text-end">الحساب</TableHead>
                      <TableHead className="w-[150px] text-end">مدين</TableHead>
                      <TableHead className="w-[150px] text-end">دائن</TableHead>
                      <TableHead className="text-end">البيان</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newEntry?.lines?.map((line, index) => (
                      <TableRow key={line.id ?? `TableRow-${index}`}>
                        <TableCell>
                          <Select
                            value={line.accountId}
                            onValueChange={(v) => updateLine(index, "accountId", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الحساب" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account: any) => (
                                <SelectItem key={account.id} value={String(account.id)}>
                                  {account.accountNumber} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.debit}
                            onChange={(e) => updateLine(index, "debit", e.target.value)}
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.credit}
                            onChange={(e) => updateLine(index, "credit", e.target.value)}
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.description}
                            onChange={(e) => updateLine(index, "description", e.target.value)}
                            placeholder="البيان"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-8">
                      <div>
                        <span className="text-muted-foreground">إجمالي المدين:</span>
                        <span className="font-bold me-2">
                          {totalDebit.toLocaleString("ar-SA")} ر.س.
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">إجمالي الدائن:</span>
                        <span className="font-bold me-2">
                          {totalCredit.toLocaleString("ar-SA")} ر.س.
                        </span>
                      </div>
                    </div>
                    <Badge className={isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {isBalanced ? "متوازن ✓" : "غير متوازن ✗"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setView('list'); resetNewEntry(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !isBalanced}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء القيد
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض تفاصيل القيد
  if (view === 'details' && selectedEntry) {
    const statusInfo = getStatusInfo(selectedEntry.status);
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('list'); setSelectedEntry(null); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">تفاصيل القيد {selectedEntry.entryNumber}</h2>
            <p className="text-muted-foreground">عرض تفاصيل القيد المحاسبي</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">رقم القيد</Label>
                  <p className="font-medium font-mono">{selectedEntry.entryNumber}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p className="font-medium">{formatDate(selectedEntry.date)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">الحالة</Label>
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>
                {selectedEntry.reference && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">المرجع</Label>
                    <p className="font-medium">{selectedEntry.reference}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">الوصف</Label>
                <p className="font-medium">{selectedEntry.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-muted-foreground">إجمالي المدين</Label>
                  <p className="text-xl font-bold">
                    {parseFloat(selectedEntry.totalDebit || 0).toLocaleString("ar-SA")} ر.س.
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">إجمالي الدائن</Label>
                  <p className="text-xl font-bold">
                    {parseFloat(selectedEntry.totalCredit || 0).toLocaleString("ar-SA")} ر.س.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض قائمة القيود
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">القيود المحاسبية</h1>
          <p className="text-muted-foreground">إدارة القيود اليومية والترحيل</p>
        </div>
        <Button onClick={() => setView('add')}>
          <Plus className="h-4 w-4 ms-2" />
          قيد جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي القيود</p>
              <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مسودات</p>
              <h3 className="text-2xl font-bold text-gray-600">{stats.draft}</h3>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">معتمدة</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.approved}</h3>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مرحّلة</p>
              <h3 className="text-2xl font-bold text-blue-600">{stats.posted}</h3>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم القيد أو الوصف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {entryStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل القيود</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">رقم القيد</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">الوصف</TableHead>
                  <TableHead className="text-end">المدين</TableHead>
                  <TableHead className="text-end">الدائن</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">لا توجد قيود مسجلة</p>
                      <Button variant="link" onClick={() => setView('add')}>
                        إنشاء قيد جديد
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry: any) => {
                    const statusInfo = getStatusInfo(entry.status);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell className="font-mono">
                          {parseFloat(entry.totalDebit || 0).toLocaleString("ar-SA")} ر.س.
                        </TableCell>
                        <TableCell className="font-mono">
                          {parseFloat(entry.totalCredit || 0).toLocaleString("ar-SA")} ر.س.
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEntry(entry);
                                setView('details');
                              }}
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* مسودة → إرسال للاعتماد */}
                            {entry.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-yellow-600"
                                onClick={() => handleSubmit(entry.id)}
                                title="إرسال للاعتماد"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                            {/* بانتظار الاعتماد → اعتماد/رفض */}
                            {entry.status === "pending_approval" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => handleApprove(entry.id)}
                                  title="اعتماد"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleReject(entry.id)}
                                  title="رفض"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {/* معتمد → ترحيل */}
                            {entry.status === "approved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600"
                                onClick={() => handlePost(entry.id)}
                                title="ترحيل القيد"
                              >
                                <Calculator className="h-4 w-4" />
                              </Button>
                            )}
                            {/* مرحّل → عكس */}
                            {entry.status === "posted" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-600"
                                onClick={() => handleReverse(entry.id)}
                                title="عكس القيد"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
