import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { FileText, Plus, Search, Filter, Download, Printer, Eye, Edit, Loader2, RefreshCw, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import { toast } from "sonner";

interface Letter {
  id: number;
  number: string;
  title: string;
  type: "incoming" | "outgoing" | "internal";
  category: string;
  date: string;
  sender: string;
  recipient: string;
  status: "draft" | "pending" | "approved" | "sent" | "archived";
  content?: string;
}

export default function Letters() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    type: "letter" as "email" | "internal" | "letter" | "memo" | "circular",
    priority: "normal" as "high" | "normal" | "low",
    recipientName: "",
    recipientDepartment: "",
  });

  const utils = trpc.useUtils();

  // جلب البيانات من API
  const { data: correspondencesData, isLoading, refetch } = trpc.comms.correspondences.list.useQuery({});
  const { data: statsData } = trpc.comms.correspondences.stats.useQuery();

  // Mutations
  const createMutation = trpc.comms.correspondences.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الخطاب بنجاح");
      setShowCreateDialog(false);
      resetForm();
      utils.comms.correspondences.list.invalidate();
      utils.comms.correspondences.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`خطأ في إنشاء الخطاب: ${error.message}`);
    },
  });

  const sendMutation = trpc.comms.correspondences.send.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الخطاب بنجاح");
      utils.comms.correspondences.list.invalidate();
      utils.comms.correspondences.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`خطأ في إرسال الخطاب: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.comms.correspondences.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الخطاب بنجاح");
      setShowEditDialog(false);
      utils.comms.correspondences.list.invalidate();
      utils.comms.correspondences.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`خطأ في تحديث الخطاب: ${error.message}`);
    },
  });


  const resetForm = () => {
    setFormData({
      subject: "",
      content: "",
      type: "letter",
      priority: "normal",
      recipientName: "",
      recipientDepartment: "",
    });
  };

  // تحويل البيانات من API إلى الشكل المطلوب
  const lettersData: Letter[] = useMemo(() => {
    if (!correspondencesData) return [];
    return correspondencesData.map((c: any) => ({
      id: c.id,
      number: `LTR-${c.id.toString().padStart(4, '0')}`,
      title: c.subject,
      type: c.type === 'internal' ? 'internal' : c.type === 'letter' ? 'outgoing' : 'incoming',
      category: c.type,
      date: formatDate(c.createdAt),
      sender: c.senderName || 'غير محدد',
      recipient: c.recipientName || 'غير محدد',
      status: c.status as Letter['status'],
      content: c.content,
    }));
  }, [correspondencesData]);

  const stats = useMemo(() => {
    return {
      total: lettersData.length,
      incoming: lettersData.filter(l => l.type === 'incoming').length,
      outgoing: lettersData.filter(l => l.type === 'outgoing').length,
      internal: lettersData.filter(l => l.type === 'internal').length,
      inbox: statsData?.inbox || 0,
      unread: statsData?.unread || 0,
      sent: statsData?.sent || 0,
      archived: statsData?.archived || 0,
    };
  }, [statsData, lettersData]);

  const columns: ColumnDef<Letter>[] = useMemo(
    () => [
      { accessorKey: "number", header: "رقم الخطاب" },
      { accessorKey: "title", header: "العنوان" },
      {
        accessorKey: "type",
        header: "النوع",
        cell: ({ row }) => {
          const types = {
            incoming: { label: "وارد", color: "bg-blue-100 text-blue-800" },
            outgoing: { label: "صادر", color: "bg-green-100 text-green-800" },
            internal: { label: "داخلي", color: "bg-purple-100 text-purple-800" },
          };
          const type = types[row.original.type] || types.internal;
          return <Badge className={type.color}>{type.label}</Badge>;
        },
      },
      { accessorKey: "category", header: "التصنيف" },
      { accessorKey: "date", header: "التاريخ" },
      { accessorKey: "sender", header: "المرسل" },
      { accessorKey: "recipient", header: "المستلم" },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const statuses = {
            draft: { label: "مسودة", color: "bg-gray-100 text-gray-800" },
            pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-800" },
            approved: { label: "معتمد", color: "bg-blue-100 text-blue-800" },
            sent: { label: "مرسل", color: "bg-green-100 text-green-800" },
            archived: { label: "مؤرشف", color: "bg-purple-100 text-purple-800" },
          };
          const status = statuses[row.original.status] || statuses.draft;
          return <Badge className={status.color}>{status.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleView(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handlePrint(row.original)}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            {row.original.status === 'draft' && (
              <Button variant="ghost" size="sm" onClick={() => handleSend(row.original.id)}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const handleView = (letter: Letter) => {
    setSelectedLetter(letter);
    setShowViewDialog(true);
  };

  const handlePrint = (letter: Letter) => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>خطاب ${letter.number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .info { margin: 10px 0; }
            .content { margin-top: 20px; padding: 20px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <h1>${letter.title}</h1>
          <div class="info"><strong>رقم الخطاب:</strong> ${letter.number}</div>
          <div class="info"><strong>التاريخ:</strong> ${letter.date}</div>
          <div class="info"><strong>المرسل:</strong> ${letter.sender}</div>
          <div class="info"><strong>المستلم:</strong> ${letter.recipient}</div>
          <div class="content">${letter.content || 'لا يوجد محتوى'}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEdit = (letter: Letter) => {
    setSelectedLetter(letter);
    setShowEditDialog(true);
  };

  const handleSend = (id: number) => {
    sendMutation.mutate({ id });
  };

  const handleCreate = () => {
    if (!formData.subject) {
      toast.error("يرجى إدخال عنوان الخطاب");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateStatus = (status: "draft" | "sent" | "read" | "archived") => {
    if (!selectedLetter) return;
    updateStatusMutation.mutate({ id: selectedLetter.id, status });
  };

  const table = useReactTable({
    data: lettersData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExport = () => {
    if (lettersData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const headers = ['رقم الخطاب', 'العنوان', 'النوع', 'التصنيف', 'التاريخ', 'المرسل', 'المستلم', 'الحالة'];
    const csvData = lettersData.map(l => [l.number, l.title, l.type, l.category, l.date, l.sender, l.recipient, l.status]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letters_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

    
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل الخطابات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الخطابات الرسمية</h2>
          <p className="text-muted-foreground">إدارة الخطابات الواردة والصادرة والداخلية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ms-2" />
            خطاب جديد
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الخطابات</p>
                <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الواردة</p>
                <h3 className="text-2xl font-bold">{stats.incoming}</h3>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الصادرة</p>
                <h3 className="text-2xl font-bold">{stats.outgoing}</h3>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الداخلية</p>
                <h3 className="text-2xl font-bold">{stats.internal}</h3>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الخطابات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الخطابات..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pe-10"
              />
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 ms-2" />
              تصدير
            </Button>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-3 text-end font-medium">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                      لا توجد خطابات
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة إنشاء خطاب جديد */}
      {showCreateDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إنشاء خطاب جديد</h3>
            <p className="text-sm text-gray-500">أدخل بيانات الخطاب الجديد</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>عنوان الخطاب *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="أدخل عنوان الخطاب"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>نوع الخطاب</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">خطاب رسمي</SelectItem>
                    <SelectItem value="memo">مذكرة</SelectItem>
                    <SelectItem value="circular">تعميم</SelectItem>
                    <SelectItem value="internal">داخلي</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>الأولوية</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عاجل</SelectItem>
                    <SelectItem value="normal">عادي</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>اسم المستلم</Label>
                <Input
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="اسم المستلم"
                />
              </div>
              <div className="grid gap-2">
                <Label>القسم/الإدارة</Label>
                <Input
                  value={formData.recipientDepartment}
                  onChange={(e) => setFormData({ ...formData, recipientDepartment: e.target.value })}
                  placeholder="القسم أو الإدارة"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>محتوى الخطاب</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="أدخل محتوى الخطاب"
                rows={6}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء الخطاب"
              )}
            </Button>
          </div>
        </div>
      </div>)}

      {/* نافذة عرض الخطاب */}
      {showViewDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">عرض الخطاب</h3>
          </div>
          {selectedLetter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم الخطاب</Label>
                  <p className="font-medium">{selectedLetter.number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p className="font-medium">{selectedLetter.date}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">العنوان</Label>
                <p className="font-medium">{selectedLetter.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">المرسل</Label>
                  <p className="font-medium">{selectedLetter.sender}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المستلم</Label>
                  <p className="font-medium">{selectedLetter.recipient}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">المحتوى</Label>
                <div className="p-4 bg-muted rounded-lg mt-2">
                  {selectedLetter.content || "لا يوجد محتوى"}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              إغلاق
            </Button>
            <Button onClick={() => selectedLetter && handlePrint(selectedLetter)}>
              <Printer className="h-4 w-4 ms-2" />
              طباعة
            </Button>
          </div>
        </div>
      </div>)}

      {/* نافذة تعديل حالة الخطاب */}
      {showEditDialog && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل حالة الخطاب</h3>
            <p className="text-sm text-gray-500">
              {selectedLetter?.number} - {selectedLetter?.title}
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>الحالة الجديدة</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedLetter?.status === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdateStatus('draft')}
                >
                  مسودة
                </Button>
                <Button
                  variant={selectedLetter?.status === 'sent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdateStatus('sent')}
                >
                  مرسل
                </Button>
                <Button
                  variant={selectedLetter?.status === 'sent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdateStatus('sent')}
                >
                  مرسل
                </Button>
                <Button
                  variant={selectedLetter?.status === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdateStatus('archived')}
                >
                  مؤرشف
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
