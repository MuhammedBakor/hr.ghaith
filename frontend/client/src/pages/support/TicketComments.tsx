import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { useRoute, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowRight,
  Send,
  RefreshCw,
  MessageSquare,
  Clock,
  User,
  Paperclip,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTicket, useTicketComments, useAddTicketComment } from "@/services/supportService";

export default function TicketComments() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ? parseInt(id) : 0;

  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { user: currentUser, error: authError } = useAuth();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState("");

  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId);

  const { data: comments, isLoading: commentsLoading, refetch } = useTicketComments(ticketId);

  const addCommentMutation = useAddTicketComment();

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("يرجى كتابة تعليق");
      return;
    }
    addCommentMutation.mutate({
      ticketId,
      content: newComment,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-blue-500">مفتوحة</Badge>;
      case "in_progress": return <Badge className="bg-amber-500">قيد المعالجة</Badge>;
      case "resolved": return <Badge className="bg-green-500">تم الحل</Badge>;
      case "closed": return <Badge variant="secondary">مغلقة</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const isLoading = ticketLoading || commentsLoading;

  if (authError) return <div className="p-8 text-center text-red-500">حدث خطأ في المصادقة</div>;


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/support/tickets">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">تعليقات التذكرة</h2>
          <p className="text-muted-foreground">
            {ticket ? `تذكرة #${ticket.id}: ${ticket.subject}` : "جاري التحميل..."}
          </p>
        </div>
      </div>

      {/* Ticket Info */}
      {ticket && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                <p className="text-muted-foreground text-sm">{ticket.description}</p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(ticket.status)}
                <Badge variant="outline">{ticket.priority}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            التعليقات ({comments?.length || 0})
          </CardTitle>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد تعليقات بعد</p>
              <p className="text-sm">كن أول من يضيف تعليقاً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{comment.userName || "مستخدم"}</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(comment.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>{comment.attachments.length} مرفق</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Comment */}
      <Card>
        <CardHeader>
          <CardTitle>إضافة تعليق</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="اكتب تعليقك هنا..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={addCommentMutation.isPending || !newComment.trim()}
              >
                {addCommentMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 ms-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 ms-2" />
                )}
                إرسال التعليق
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
