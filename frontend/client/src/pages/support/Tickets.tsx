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
import { Plus, Search, Ticket, Clock, CheckCircle2, AlertCircle, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  useTickets,
  useCreateTicket,
  useUpdateTicket,
  useAddTicketComment,
  useTicket,
  useTicketComments
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
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { user: currentUser, error: authError } = useAuth();
  const userRole = currentUser?.role || 'user';

  const [showInlineForm, setShowInlineForm] = useState(false);

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

  const [newComment, setNewComment] = useState("");

  const { data: tickets, isLoading, refetch } = useTickets();
  const { data: ticketDetails } = useTicket(selectedTicket!);
  const { data: comments } = useTicketComments(selectedTicket!);

  const createTicketMutation = useCreateTicket();

  const updateTicketMutation = useUpdateTicket();

  const addCommentMutation = useAddTicketComment();

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
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTicket) return;
    addCommentMutation.mutate({
      ticketId: selectedTicket,
      content: newComment,
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء تذكرة جديدة</DialogTitle>
            </DialogHeader>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">رقم التذكرة</TableHead>
                  <TableHead className="text-end">العنوان</TableHead>
                  <TableHead className="text-end">الأولوية</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket: any) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <TableCell className="font-mono">#{ticket.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
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
                        onValueChange={(value) => {
                          handleStatusChange(ticket.id, value);
                        }}
                      >
                        <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              تذكرة #{selectedTicket}
            </DialogTitle>
          </DialogHeader>
          {ticketDetails && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg">{ticketDetails.subject}</h3>
                <p className="text-muted-foreground mt-2">{ticketDetails.description}</p>
              </div>

              <div className="flex gap-4 px-2 md:px-0">
                <Badge className={priorityColors[ticketDetails.priority] || priorityColors.medium}>
                  {priorityLabels[ticketDetails.priority] || ticketDetails.priority}
                </Badge>
                <Badge className={statusColors[ticketDetails.status] || statusColors.open}>
                  {statusLabels[ticketDetails.status] || ticketDetails.status}
                </Badge>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  التعليقات
                </h4>
                <div className="space-y-4">
                  {comments?.map((comment: any) => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">مستخدم #{comment.authorId}</span>
                        <span className="text-sm text-muted-foreground">
                          {comment.createdAt && format(new Date(comment.createdAt), "dd MMM yyyy HH:mm", { locale: ar })}
                        </span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  ))}
                  {(!comments || comments.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">لا توجد تعليقات</p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="أضف تعليقاً..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                  >
                    إرسال
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
