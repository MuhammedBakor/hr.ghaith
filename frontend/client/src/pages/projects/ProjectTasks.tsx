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
import { Search, ListTodo, Clock, CheckCircle2, AlertCircle, User, Target, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
};

const statusLabels: Record<string, string> = {
  todo: "قيد الانتظار",
  in_progress: "قيد التنفيذ",
  review: "قيد المراجعة",
  done: "مكتملة",
};

const statusIcons: Record<string, React.ReactNode> = {
  todo: <AlertCircle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  review: <Target className="h-4 w-4" />,
  done: <CheckCircle2 className="h-4 w-4" />,
};

export default function ProjectTasks() {
  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [newTask, setNewTask] = useState<{
    projectId: number;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    status: "todo" | "in_progress" | "review" | "done";
    estimatedHours: string;
  }>({
    projectId: 0,
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    estimatedHours: "",
  });

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['projects', 'tasks', selectedProjectId],
    queryFn: () => api.get(selectedProjectId ? `/projects/tasks?projectId=${selectedProjectId}` : '/projects/tasks').then(r => r.data),
  });
  const { data: projects } = useQuery({ queryKey: ['projects', 'list'], queryFn: () => api.get('/projects').then(r => r.data) });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => api.post('/projects/tasks', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء المهمة بنجاح");
      setIsCreateOpen(false);
      setNewTask({
        projectId: selectedProjectId || 0,
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        estimatedHours: "",
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: any) => api.put(`/projects/tasks/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم تحديث المهمة بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/projects/tasks/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success("تم حذف المهمة بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error("يرجى إدخال عنوان المهمة");
      return;
    }
    if (!newTask.projectId) {
      toast.error("يرجى اختيار المشروع");
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus as any });
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
      deleteTaskMutation.mutate({ id: taskId });
    }
  };

  const filteredTasks = tasks?.filter((task: any) => {
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  const stats = {
    total: tasks?.length || 0,
    todo: tasks?.filter((t: any) => t.status === "todo").length || 0,
    inProgress: tasks?.filter((t: any) => t.status === "in_progress").length || 0,
    done: tasks?.filter((t: any) => t.status === "done").length || 0,
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">مهام المشاريع</h1>
          <p className="text-muted-foreground">إدارة ومتابعة مهام المشاريع</p>
        </div>
        {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إنشاء مهمة جديدة</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label>المشروع</Label>
                <Select
                  value={newTask.projectId?.toString() || ""}
                  onValueChange={(value) => setNewTask({ ...newTask, projectId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>العنوان</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="عنوان المهمة"
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="وصف المهمة"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الأولوية</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as "low" | "medium" | "high" | "urgent" })}
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
                  <Label>الساعات المقدرة</Label>
                  <Input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button 
                onClick={handleCreateTask} 
                className="w-full"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
              </Button>
            </div>
          
        </div>)}

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ListTodo className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المهام</p>
              <p className="text-lg md:text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              <p className="text-lg md:text-2xl font-bold">{stats.todo}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
              <p className="text-lg md:text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">مكتملة</p>
              <p className="text-lg md:text-2xl font-bold">{stats.done}</p>
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
                  placeholder="البحث في المهام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
            <Select 
              value={selectedProjectId?.toString() || "all"} 
              onValueChange={(value) => setSelectedProjectId(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="جميع المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المشاريع</SelectItem>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="todo">قيد الانتظار</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="review">قيد المراجعة</SelectItem>
                <SelectItem value="done">مكتملة</SelectItem>
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

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المهام</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مهام</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">العنوان</TableHead>
                  <TableHead className="text-end">المشروع</TableHead>
                  <TableHead className="text-end">الأولوية</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task: any) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {projects?.find((p: any) => p.id === task.projectId)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[task.priority] || priorityColors.medium}>
                        {priorityLabels[task.priority] || task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-1 w-fit ${statusColors[task.status] || statusColors.todo}`}>
                        {statusIcons[task.status]}
                        {statusLabels[task.status] || task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: ar }) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "in_progress")}>
                            بدء العمل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "review")}>
                            إرسال للمراجعة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, "done")}>
                            إكمال المهمة
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600"
                          >
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
