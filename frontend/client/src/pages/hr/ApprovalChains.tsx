import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
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
import { Search, GitBranch, Pencil, Trash2, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const requestTypeLabels: Record<string, string> = {
  leave: "إجازة",
  expense: "مصروفات",
  purchase: "مشتريات",
  salary_advance: "سلفة راتب",
  overtime: "عمل إضافي",
  training: "تدريب",
  resignation: "استقالة",
  transfer: "نقل",
};

export default function ApprovalChains() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const [newChain, setNewChain] = useState({
    name: "",
    nameAr: "",
    requestType: "leave" as string,
    description: "",
    isActive: true,
    steps: [] as { stepOrder: number; approverType: "direct_manager" | "department_manager" | "hr_manager" | "general_manager" | "specific_user" | "specific_role"; specificUserId?: number; specificRoleId?: number; isRequired: boolean; canDelegate: boolean; escalateAfterDays?: number }[],
  });

  const { data: chains, isLoading, refetch } = useQuery({
    queryKey: ['approvalChains'],
    queryFn: () => api.get('/hr/approval-chains').then(res => res.data),
  });

  const createChainMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/approval-chains', data).then(res => res.data),
    onSuccess: () => {
      toast.success("تم إنشاء سلسلة الاعتماد بنجاح");
      setIsCreateOpen(false);
      setNewChain({
        name: "",
        nameAr: "",
        requestType: "leave",
        description: "",
        isActive: true,
        steps: [],
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error.message);
    },
  });

  // حذف سلسلة الاعتماد - غير متاح حالياً
  const deleteChainMutation = {
    mutate: (data: { id: number }) => {
      toast.error("هذه الميزة غير متاحة حالياً");
    },
    isPending: false,
  };
  /*const deleteChainMutation = trpc.hrAdvanced.approvalChains.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف سلسلة الاعتماد بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });*/

  const handleCreateChain = () => {
    if (!newChain.name.trim()) {
      toast.error("يرجى إدخال اسم السلسلة");
      return;
    }
    createChainMutation.mutate(newChain);
  };

  const handleDeleteChain = (id: number) => {
    if (confirm("هل أنت متأكد من حذف سلسلة الاعتماد هذه؟")) {
      deleteChainMutation.mutate({ id });
    }
  };

  const filteredChains = chains?.filter((chain: any) => {
    const matchesSearch = chain.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chain.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || chain.requestType === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const stats = {
    total: chains?.length || 0,
    active: chains?.filter((c: any) => c.isActive).length || 0,
    inactive: chains?.filter((c: any) => !c.isActive).length || 0,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">سلاسل الاعتماد</h1>
          <p className="text-muted-foreground">إدارة مسارات الموافقة على الطلبات</p>
        </div>
        {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء سلسلة اعتماد جديدة</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label>اسم السلسلة</Label>
                <Input
                  value={newChain.name}
                  onChange={(e) => setNewChain({ ...newChain, name: e.target.value })}
                  placeholder="مثال: سلسلة اعتماد الإجازات"
                />
              </div>
              <div>
                <Label>نوع الطلب</Label>
                <Select
                  value={newChain.requestType}
                  onValueChange={(value) => setNewChain({ ...newChain, requestType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave">إجازة</SelectItem>
                    <SelectItem value="expense">مصروفات</SelectItem>
                    <SelectItem value="purchase">مشتريات</SelectItem>
                    <SelectItem value="salary_advance">سلفة راتب</SelectItem>
                    <SelectItem value="overtime">عمل إضافي</SelectItem>
                    <SelectItem value="training">تدريب</SelectItem>
                    <SelectItem value="resignation">استقالة</SelectItem>
                    <SelectItem value="transfer">نقل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newChain.description}
                  onChange={(e) => setNewChain({ ...newChain, description: e.target.value })}
                  placeholder="وصف سلسلة الاعتماد"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>مفعلة</Label>
                <Switch
                  checked={newChain.isActive}
                  onCheckedChange={(checked) => setNewChain({ ...newChain, isActive: checked })}
                />
              </div>
              <Button 
                onClick={handleCreateChain} 
                className="w-full"
                disabled={createChainMutation.isPending}
              >
                {createChainMutation.isPending ? "جاري الإنشاء..." : "إنشاء السلسلة"}
              </Button>
            </div>
          
        </div>)}

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GitBranch className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي السلاسل</p>
              <p className="text-lg md:text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مفعلة</p>
              <p className="text-lg md:text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">معطلة</p>
              <p className="text-lg md:text-2xl font-bold">{stats.inactive}</p>
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
                  placeholder="البحث في السلاسل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="نوع الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="leave">إجازة</SelectItem>
                <SelectItem value="expense">مصروفات</SelectItem>
                <SelectItem value="purchase">مشتريات</SelectItem>
                <SelectItem value="salary_advance">سلفة راتب</SelectItem>
                <SelectItem value="overtime">عمل إضافي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chains Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة سلاسل الاعتماد</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredChains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد سلاسل اعتماد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">اسم السلسلة</TableHead>
                  <TableHead className="text-end">نوع الطلب</TableHead>
                  <TableHead className="text-end">عدد الخطوات</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChains.map((chain: any) => (
                  <TableRow key={chain.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{chain.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {chain.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {requestTypeLabels[chain.requestType] || chain.requestType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        {chain.stepsCount || 0} خطوات
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={chain.isActive ? "default" : "secondary"}>
                        {chain.isActive ? "مفعلة" : "معطلة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toast.info("تعديل سلسلة الاعتماد")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChain(chain.id)}
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
