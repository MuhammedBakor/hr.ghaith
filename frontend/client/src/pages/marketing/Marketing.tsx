import { formatDate, formatDateTime } from '@/lib/formatDate';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from "sonner";
import {
  Megaphone,
  Target,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Play,
  Pause,
  BarChart3,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Marketing() {
  const queryClient = useQueryClient();
  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';

  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    campaignType: 'email' as 'email' | 'social' | 'ads' | 'event' | 'other',
    channel: '',
    budget: '',
    startDate: '',
    endDate: '',
  });

  const { data: campaigns = [], isLoading } = useQuery({ queryKey: ['marketing', 'campaigns'], queryFn: () => api.get('/marketing/campaigns').then(r => r.data) });
  const { data: leads = [] } = useQuery({ queryKey: ['marketing', 'leads'], queryFn: () => api.get('/marketing/leads').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/marketing/campaigns', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء الحملة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
      setIsCreateOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        campaignType: 'email',
        channel: '',
        budget: '',
        startDate: '',
        endDate: '',
      });
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/marketing/campaigns/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف الحملة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const handleCreate = () => {
    if (!newCampaign.name) {
      toast.error('يرجى إدخال اسم الحملة');
      return;
    }
    createMutation.mutate({
      name: newCampaign.name,
      description: newCampaign.description || undefined,
      campaignType: newCampaign.campaignType,
      targetAudience: newCampaign.channel || undefined,
      budget: newCampaign.budget || undefined,
      startDate: newCampaign.startDate ? new Date(newCampaign.startDate) : undefined,
      endDate: newCampaign.endDate ? new Date(newCampaign.endDate) : undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "name", header: "اسم الحملة" },
      {
        accessorKey: "campaignType",
        header: "النوع",
        cell: ({ row }) => {
          const types: Record<string, { label: string; color: string }> = {
            email: { label: "بريد إلكتروني", color: "bg-blue-100 text-blue-800" },
            social: { label: "تواصل اجتماعي", color: "bg-pink-100 text-pink-800" },
            ads: { label: "إعلانات", color: "bg-green-100 text-green-800" },
            event: { label: "فعاليات", color: "bg-amber-100 text-amber-800" },
            other: { label: "أخرى", color: "bg-gray-100 text-gray-800" },
          };
          const type = types[row.original.campaignType] || types.other;
          return <Badge className={type.color}>{type.label}</Badge>;
        },
      },
      { accessorKey: "channel", header: "القناة", cell: ({ row }) => row.original.channel || '-' },
      { 
        accessorKey: "budget", 
        header: "الميزانية",
        cell: ({ row }) => row.original.budget ? `${parseFloat(row.original.budget).toLocaleString()} ر.س` : '-'
      },
      { 
        accessorKey: "spent", 
        header: "المصروف",
        cell: ({ row }) => row.original.spent ? `${parseFloat(row.original.spent).toLocaleString()} ر.س` : '-'
      },
      { 
        accessorKey: "startDate", 
        header: "البداية",
        cell: ({ row }) => row.original.startDate ? formatDate(row.original.startDate) : '-'
      },
      { 
        accessorKey: "endDate", 
        header: "النهاية",
        cell: ({ row }) => row.original.endDate ? formatDate(row.original.endDate) : '-'
      },
      {
        accessorKey: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const statuses: Record<string, { label: string; color: string }> = {
            draft: { label: "مسودة", color: "bg-gray-100 text-gray-800" },
            active: { label: "نشطة", color: "bg-green-100 text-green-800" },
            paused: { label: "متوقفة", color: "bg-yellow-100 text-yellow-800" },
            completed: { label: "مكتملة", color: "bg-blue-100 text-blue-800" },
            scheduled: { label: "مجدولة", color: "bg-purple-100 text-purple-800" },
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
            <Button variant="ghost" onClick={() => toast.info("عرض التفاصيل")}><Eye className="h-4 w-4" /></Button>
            {row.original.status === "active" ? (
              <Button variant="ghost" size="sm" onClick={() => toast.info("إيقاف الحملة مؤقتاً")}><Pause className="h-4 w-4" /></Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => toast.info("تشغيل الحملة")}><Play className="h-4 w-4" /></Button>
            )}
            <Button variant="ghost" onClick={() => toast.info("تعديل")}><Edit className="h-4 w-4" /></Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: campaigns,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length;
  const totalBudget = campaigns.reduce((sum: number, c: any) => sum + parseFloat(c.budget || '0'), 0);
  const totalSpent = campaigns.reduce((sum: number, c: any) => sum + parseFloat(c.spent || '0'), 0);
  const totalLeads = leads.length;

  const stats = [
    { label: "الحملات النشطة", value: activeCampaigns.toString(), icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "إجمالي العملاء المحتملين", value: totalLeads.toString(), icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "إجمالي الميزانية", value: `${(totalBudget / 1000).toFixed(0)}K`, icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "المصروف", value: `${(totalSpent / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التسويق والحملات</h2>
          <p className="text-muted-foreground">إدارة الحملات التسويقية وتحليل الأداء</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 ms-2" />
          حملة جديدة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.id ?? `Card-${index}`}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>الحملات التسويقية</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pe-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ms-2" />
                تصفية
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 ms-2" />
                تقارير
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد حملات تسويقية حالياً</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                إنشاء أول حملة
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-muted/50">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="h-12 px-4 text-end align-middle font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 whitespace-nowrap"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && " ↑"}
                            {header.column.getIsSorted() === "desc" && " ↓"}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-middle whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              <Megaphone className="h-5 w-5" />
              إنشاء حملة تسويقية جديدة
            </h3>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم الحملة *</Label>
              <Input
                id="name"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="مثال: حملة رمضان 2026"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                placeholder="وصف الحملة..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">نوع الحملة</Label>
                <Select
                  value={newCampaign.campaignType}
                  onValueChange={(value: any) => setNewCampaign({ ...newCampaign, campaignType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="social">تواصل اجتماعي</SelectItem>
                    <SelectItem value="ads">إعلانات</SelectItem>
                    <SelectItem value="event">فعاليات</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="channel">القناة</Label>
                <Input
                  id="channel"
                  value={newCampaign.channel}
                  onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                  placeholder="مثال: Instagram, Twitter"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">الميزانية (ر.س)</Label>
              <Input
                id="budget"
                type="number"
                value={newCampaign.budget?.toLocaleString()}
                onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newCampaign.startDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newCampaign.endDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ'
              )}
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
              هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.
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