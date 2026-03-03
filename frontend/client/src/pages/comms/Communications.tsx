import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Send, Inbox, Archive, Star, Search, Plus, Clock, CheckCircle, Loader2, Eye, Trash2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PrintButton } from "@/components/PrintButton";

export default function Communications() {
  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [showInlineForm, setShowInlineForm] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    type: "internal" as const,
    priority: "normal" as const,
    recipientName: "",
    recipientDepartment: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);

  // جلب المراسلات
  const { data: correspondences, isLoading, refetch } = trpc.comms.correspondences?.list?.useQuery({});
  
  // جلب الإحصائيات
  const { data: stats } = trpc.comms.correspondences?.stats?.useQuery();

  // إنشاء مراسلة جديدة
  const createMutation = trpc.comms.correspondences?.create?.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الرسالة بنجاح");
      setShowNewMessage(false);
      setNewMessage({
        subject: "",
        content: "",
        type: "internal",
        priority: "normal",
        recipientName: "",
        recipientDepartment: "",
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في إنشاء الرسالة: " + error.message);
    },
  });

  // إرسال مراسلة
  const sendMutation = trpc.comms.correspondences?.send?.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في إرسال الرسالة: " + error.message);
    },
  });

  // تحديث حالة المراسلة
  const updateStatusMutation = trpc.comms.correspondences?.updateStatus?.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحالة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في تحديث الحالة: " + error.message);
    },
  });

  // حذف مراسلة
  const deleteMutation = trpc.comms.correspondences?.delete?.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الرسالة بنجاح");
      setSelectedMessage(null);
      refetch();
    },
    onError: (error) => {
      toast.error("فشل في حذف الرسالة: " + error.message);
    },
  });

  const handleCreateMessage = () => {
    if (!newMessage.subject.trim()) {
      toast.error("يرجى إدخال موضوع الرسالة");
      return;
    }
    createMutation.mutate(newMessage);
  };

  const handleSendMessage = (id: number) => {
    sendMutation.mutate({ id });
  };

  const handleMarkAsRead = (id: number) => {
    updateStatusMutation.mutate({ id, status: "read" });
  };

  const handleArchive = (id: number) => {
    updateStatusMutation.mutate({ id, status: "archived" });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMutation.mutate({ id: messageToDelete });
    }
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      email: { label: "بريد إلكتروني", color: "bg-blue-100 text-blue-800" },
      internal: { label: "داخلي", color: "bg-green-100 text-green-800" },
      letter: { label: "خطاب رسمي", color: "bg-purple-100 text-purple-800" },
      memo: { label: "مذكرة", color: "bg-orange-100 text-orange-800" },
      circular: { label: "تعميم", color: "bg-pink-100 text-pink-800" },
    };
    return types[type] || { label: type, color: "bg-gray-100 text-gray-800" };
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: "مسودة", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      sent: { label: "مرسل", color: "bg-green-100 text-green-800", icon: Send },
      read: { label: "مقروء", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
      archived: { label: "مؤرشف", color: "bg-purple-100 text-purple-800", icon: Archive },
    };
    return statuses[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: Mail };
  };

  const getPriorityLabel = (priority: string) => {
    const priorities: Record<string, { label: string; color: string }> = {
      high: { label: "عالية", color: "text-red-600" },
      normal: { label: "عادية", color: "text-gray-600" },
      low: { label: "منخفضة", color: "text-blue-600" },
    };
    return priorities[priority] || { label: priority, color: "text-gray-600" };
  };

  const filteredCorrespondences = correspondences?.filter((c: any) =>
    c.subject?.toLowerCase().includes(globalFilter.toLowerCase()) ||
    c.senderName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
    c.recipientName?.toLowerCase().includes(globalFilter.toLowerCase())
  ) || [];

  const statsData = [
    { label: "الوارد", value: stats?.inbox || 0, icon: Inbox, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "غير مقروء", value: stats?.unread || 0, icon: Mail, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "المرسل", value: stats?.sent || 0, icon: Send, color: "text-green-600", bg: "bg-green-50" },
    { label: "الأرشيف", value: stats?.archived || 0, icon: Archive, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التواصل والمراسلات</h2>
          <p className="text-muted-foreground">إدارة الرسائل والخطابات والمراسلات الداخلية</p>
        </div>
        <Button onClick={() => setShowNewMessage(true)}>
          <Plus className="h-4 w-4 ms-2" />
          رسالة جديدة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
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
            <CardTitle>صندوق الوارد</CardTitle>
              <PrintButton title="صندوق الوارد" />
            <div className="relative">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pe-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCorrespondences.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد رسائل</p>
              <p className="text-sm mt-2">ابدأ بإنشاء رسالة جديدة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>المرسل</TableHead>
                  <TableHead>المستلم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCorrespondences.map((message: any) => {
                  const typeInfo = getTypeLabel(message.type);
                  const statusInfo = getStatusLabel(message.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={message.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {message.status === "sent" && !message.readAt && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <span className={message.status === "sent" && !message.readAt ? "font-bold" : ""}>
                            {message.subject}
                          </span>
                          {message.priority === "high" && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{message.senderName || "-"}</TableCell>
                      <TableCell>{message.recipientName || message.recipientDepartment || "-"}</TableCell>
                      <TableCell>
                        <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(message.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {message.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendMessage(message.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {message.status === "sent" && !message.readAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(message.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(message.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(message.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* نافذة إنشاء رسالة جديدة */}
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>رسالة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select
                  value={newMessage.type}
                  onValueChange={(value: any) => setNewMessage({ ...newMessage, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">داخلي</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="letter">خطاب رسمي</SelectItem>
                    <SelectItem value="memo">مذكرة</SelectItem>
                    <SelectItem value="circular">تعميم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select
                  value={newMessage.priority}
                  onValueChange={(value: any) => setNewMessage({ ...newMessage, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="normal">عادية</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المستلم</Label>
                <Input
                  value={newMessage.recipientName}
                  onChange={(e) => setNewMessage({ ...newMessage, recipientName: e.target.value })}
                  placeholder="اسم المستلم"
                />
              </div>
              <div className="space-y-2">
                <Label>القسم</Label>
                <Input
                  value={newMessage.recipientDepartment}
                  onChange={(e) => setNewMessage({ ...newMessage, recipientDepartment: e.target.value })}
                  placeholder="القسم أو الإدارة"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الموضوع *</Label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                placeholder="موضوع الرسالة"
              />
            </div>
            <div className="space-y-2">
              <Label>المحتوى</Label>
              <Textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                placeholder="محتوى الرسالة..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewMessage(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleCreateMessage}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Plus className="h-4 w-4 ms-2" />
              )}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة عرض الرسالة */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">المرسل:</span>{" "}
                  <span className="font-medium">{selectedMessage.senderName || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">المستلم:</span>{" "}
                  <span className="font-medium">
                    {selectedMessage.recipientName || selectedMessage.recipientDepartment || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">النوع:</span>{" "}
                  <Badge className={getTypeLabel(selectedMessage.type).color}>
                    {getTypeLabel(selectedMessage.type).label}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">الأولوية:</span>{" "}
                  <span className={getPriorityLabel(selectedMessage.priority).color}>
                    {getPriorityLabel(selectedMessage.priority).label}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">التاريخ:</span>{" "}
                  <span>{formatDate(selectedMessage.createdAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">الحالة:</span>{" "}
                  <Badge className={getStatusLabel(selectedMessage.status).color}>
                    {getStatusLabel(selectedMessage.status).label}
                  </Badge>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="whitespace-pre-wrap">{selectedMessage.content || "لا يوجد محتوى"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
