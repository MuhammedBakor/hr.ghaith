import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, Trash2, Mail, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800",
  manager: "bg-blue-100 text-blue-800",
  member: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800",
};

const roleLabels: Record<string, string> = {
  owner: "مالك",
  manager: "مدير",
  member: "عضو",
  viewer: "مشاهد",
};

export default function ProjectMembers() {
  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';
  const { selectedBranchId } = useAppContext();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");

  const { data: projects } = useQuery({ queryKey: ['projects', 'list'], queryFn: () => api.get('/projects').then(r => r.data) });
  const { data: users } = useQuery({
    queryKey: ['hr', 'employees', selectedBranchId],
    queryFn: () => {
      const params: any = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      return api.get('/hr/employees', { params }).then(r => r.data);
    }
  });
  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ['projects', 'members', selectedProjectId],
    queryFn: () => api.get(`/projects/members?projectId=${selectedProjectId}`).then(r => r.data),
    enabled: !!selectedProjectId
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: any) => api.post('/projects/members', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إضافة العضو بنجاح");
      setIsAddOpen(false);
      setSelectedUserId(null);
      setSelectedRole("member");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/projects/members/${data.id}?projectId=${data.projectId}`).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إزالة العضو بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleAddMember = () => {
    if (!selectedProjectId || !selectedUserId) {
      toast.error("يرجى اختيار المشروع والمستخدم");
      return;
    }
    addMemberMutation.mutate({
      projectId: selectedProjectId,
      userId: selectedUserId,
      role: selectedRole as "owner" | "manager" | "member" | "viewer",
    });
  };

  const handleRemoveMember = (memberId: number) => {
    if (confirm("هل أنت متأكد من إزالة هذا العضو؟")) {
      removeMemberMutation.mutate({ id: memberId, projectId: selectedProjectId! });
    }
  };

  const filteredMembers = members?.filter((member: any) => {
    const name = member.user?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">أعضاء المشاريع</h1>
          <p className="text-muted-foreground">إدارة فرق العمل في المشاريع</p>
        </div>
        {isAddOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          
          
            <div className="mb-4 border-b pb-3">
              <h3 className="text-lg font-bold">إضافة عضو جديد</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label>المستخدم</Label>
                <Select
                  value={selectedUserId?.toString() || ""}
                  onValueChange={(value) => setSelectedUserId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستخدم" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الدور</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">مالك</SelectItem>
                    <SelectItem value="manager">مدير</SelectItem>
                    <SelectItem value="member">عضو</SelectItem>
                    <SelectItem value="viewer">مشاهد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddMember} 
                className="w-full"
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? "جاري الإضافة..." : "إضافة العضو"}
              </Button>
            </div>
          
        </div>)}

      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select 
                value={selectedProjectId?.toString() || ""} 
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
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
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الأعضاء..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pe-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة الأعضاء
            {members && <Badge variant="secondary">{members.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedProjectId ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>يرجى اختيار مشروع لعرض الأعضاء</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد أعضاء في هذا المشروع</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">العضو</TableHead>
                  <TableHead className="text-end">الدور</TableHead>
                  <TableHead className="text-end">البريد</TableHead>
                  <TableHead className="text-end">تاريخ الإضافة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {(member.user?.name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[member.role] || roleColors.member}>
                        {roleLabels[member.role] || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.user?.email || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.createdAt ? format(new Date(member.createdAt), "dd MMM yyyy", { locale: ar }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
