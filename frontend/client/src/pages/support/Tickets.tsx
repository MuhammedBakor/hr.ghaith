import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Search, Ticket, Clock, CheckCircle2, AlertCircle, Edit, Trash2, Eye, User, Building2 } from "lucide-react";
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import {
  useTickets,
  useCreateTicket,
  useUpdateTicket,
  useDeleteTicket,
  useTicket,
} from "@/services/supportService";

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertCircle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  resolved: <CheckCircle2 className="h-4 w-4" />,
  closed: <CheckCircle2 className="h-4 w-4" />,
};

export default function Tickets() {
  const { selectedRole, currentUserId } = useAppContext();
  const isAdmin = ['admin', 'general_manager'].includes(selectedRole);
  const isOwnerOrGM = isAdmin; // for consistency with TicketService logic
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const [newTicket, setNewTicket] = useState<{
    ticketNumber: string;
    subject: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    category: "general" | "technical" | "billing" | "complaint" | "suggestion";
  }>({
    ticketNumber: `TKT-${Date.now()}`,
    subject: "",
    description: "",
    priority: "medium",
    category: "general",
  });

  const { data: tickets, isLoading, refetch } = useTickets();
  const { data: ticketDetails } = useTicket(selectedTicket!);

  const createTicketMutation = useCreateTicket();

  const updateTicketMutation = useUpdateTicket();

  const deleteTicketMutation = useDeleteTicket();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);

  const handleEditTicket = (ticket: any) => {
    setEditingTicket({ ...ticket });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTicket) return;
    updateTicketMutation.mutate(editingTicket, {
      onSuccess: () => {
        toast.success("تم تحديث التذكرة بنجاح");
        setIsEditOpen(false);
        setEditingTicket(null);
      },
      onError: (error: any) => {
        toast.error("فشل في التحديث: " + (error?.message || "حدث خطأ"));
      },
    });
  };

  const handleDeleteTicket = (ticketId: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه التذكرة؟")) return;
    deleteTicketMutation.mutate(ticketId, {
      onSuccess: () => {
        toast.success("تم حذف التذكرة");
      },
      onError: () => {
        toast.error("فشل في حذف التذكرة");
      },
    });
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim()) {
      toast.error("يرجى إدخال عنوان التذكرة");
      return;
    }
    createTicketMutation.mutate({
      ticketNumber: `TKT-${Date.now()}`,
      subject: newTicket.subject,
      description: newTicket.description,
      priority: newTicket.priority,
      category: newTicket.category,
    }, {
      onSuccess: () => {
        toast.success("تم إنشاء التذكرة بنجاح");
        setIsCreateOpen(false);
        setNewTicket({
          ticketNumber: `TKT-${Date.now()}`,
          subject: "",
          description: "",
          priority: "medium",
          category: "general",
        });
      },
      onError: (error: any) => {
        toast.error("فشل في إنشاء التذكرة: " + (error?.message || "حدث خطأ"));
      },
    });
  };

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    updateTicketMutation.mutate({ id: ticketId, status: newStatus as any });
  };

  const filteredTickets = tickets?.filter((ticket: any) => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t: any) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t: any) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t: any) => t.status === "resolved").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">التذاكر والدعم الفني</h1>
          <p className="text-muted-foreground">إدارة طلبات الدعم والمشاكل التقنية</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ms-2" />
              تذكرة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-describedby="create-ticket-desc">
            <DialogHeader>
              <DialogTitle>إنشاء تذكرة جديدة</DialogTitle>
            </DialogHeader>
            <p id="create-ticket-desc" className="sr-only">نموذج إنشاء تذكرة جديدة</p>
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="عنوان التذكرة"
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="وصف المشكلة أو الطلب"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 md:px-0">
                <div>
                  <Label>الأولوية</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as "low" | "medium" | "high" | "urgent" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>التصنيف</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value as "general" | "technical" | "billing" | "complaint" | "suggestion" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عام</SelectItem>
                      <SelectItem value="technical">تقني</SelectItem>
                      <SelectItem value="billing">مالي</SelectItem>
                      <SelectItem value="hr">موارد بشرية</SelectItem>
                      <SelectItem value="it">تقنية معلومات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCreateTicket}
                className="w-full"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? "جاري الإنشاء..." : "إنشاء التذكرة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2 md:px-0">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ticket className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي التذاكر</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مفتوحة</p>
              <p className="text-2xl font-bold">{stats.open}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد المعالجة</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تم الحل</p>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 px-2 md:px-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في التذاكر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="open">مفتوحة</SelectItem>
                <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
                <SelectItem value="closed">مغلقة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="urgent">عاجلة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة التذاكر</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تذاكر</p>
            </div>
          ) : (
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التذكرة</TableHead>
                  <TableHead>العنوان</TableHead>
                  {isOwnerOrGM && <TableHead>الموظف / الفرع / القسم</TableHead>}
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>تغيير الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket: any) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono">#{ticket.id}</TableCell>
                    <TableCell>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                        {ticket.description}
                      </p>
                    </TableCell>
                    {isOwnerOrGM && (
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            <p className="font-medium text-sm">{ticket.authorName}</p>
                          </div>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {ticket.authorRole && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-100 font-medium">
                                  {ticket.authorRole}
                                </span>
                              </div>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {ticket.authorBranch} / {ticket.authorDepartment}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={priorityColors[ticket.priority] || priorityColors.medium}>
                        {priorityLabels[ticket.priority] || ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-1 w-fit ${statusColors[ticket.status] || statusColors.open}`}>
                        {statusIcons[ticket.status]}
                        {statusLabels[ticket.status] || ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.createdAt && format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">مفتوحة</SelectItem>
                          <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                          <SelectItem value="resolved">تم الحل</SelectItem>
                          <SelectItem value="closed">مغلقة</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket.id)} title="عرض">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditTicket(ticket)} title="تعديل">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(isOwnerOrGM || currentUserId === ticket.authorId) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTicket(ticket.id)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg" aria-describedby="ticket-details-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              تذكرة #{selectedTicket}
            </DialogTitle>
          </DialogHeader>
          <p id="ticket-details-desc" className="sr-only">تفاصيل التذكرة</p>
          {ticketDetails && (
            <div className="space-y-4" dir="rtl">
              <div>
                <Label className="text-muted-foreground text-sm">العنوان</Label>
                <p className="font-semibold text-lg">{ticketDetails.subject}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">الوصف</Label>
                <p className="mt-1 whitespace-pre-wrap">{ticketDetails.description || "لا يوجد وصف"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">الأولوية</Label>
                  <div className="mt-1">
                    <Badge className={priorityColors[ticketDetails.priority] || priorityColors.medium}>
                      {priorityLabels[ticketDetails.priority] || ticketDetails.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">الحالة</Label>
                  <div className="mt-1">
                    <Badge className={`flex items-center gap-1 w-fit ${statusColors[ticketDetails.status] || statusColors.open}`}>
                      {statusIcons[ticketDetails.status]}
                      {statusLabels[ticketDetails.status] || ticketDetails.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">التصنيف</Label>
                  <p className="mt-1">{ticketDetails.category || "عام"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">التاريخ</Label>
                  <p className="mt-1">
                    {ticketDetails.createdAt && format(new Date(ticketDetails.createdAt), "dd MMM yyyy HH:mm", { locale: ar })}
                  </p>
                </div>
              </div>
              {ticketDetails.ticketNumber && (
                <div>
                  <Label className="text-muted-foreground text-sm">رقم التذكرة</Label>
                  <p className="mt-1 font-mono">{ticketDetails.ticketNumber}</p>
                </div>
              )}
              {isOwnerOrGM && ticketDetails.authorName && (
                <div className="pt-3 border-t">
                  <Label className="text-muted-foreground text-sm">بيانات الموظف</Label>
                  <p className="mt-1 font-medium">{ticketDetails.authorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {ticketDetails.authorBranch} - {ticketDetails.authorDepartment}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      {isEditOpen && editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsEditOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 border-b pb-3">تعديل التذكرة #{editingTicket.id}</h3>
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input
                  value={editingTicket.subject || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, subject: e.target.value })}
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={editingTicket.description || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الأولوية</Label>
                  <Select
                    value={editingTicket.priority}
                    onValueChange={(value) => setEditingTicket({ ...editingTicket, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Select
                    value={editingTicket.status}
                    onValueChange={(value) => setEditingTicket({ ...editingTicket, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">مفتوحة</SelectItem>
                      <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                      <SelectItem value="resolved">تم الحل</SelectItem>
                      <SelectItem value="closed">مغلقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t justify-end">
                <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingTicket(null); }}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateTicketMutation.isPending}>
                  {updateTicketMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
