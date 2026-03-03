import { formatDate, formatDateTime } from '@/lib/formatDate';
import React from "react";
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  useTrainingPrograms,
  useCreateTrainingProgram
} from "@/services/trainingService";

// دالة توليد رقم البرنامج التدريبي التلقائي
const generateProgramCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  return `TRN-${timestamp.slice(-4)}${random}`;
};

interface TrainingProgram {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  instructor?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  maxParticipants?: number | null;
  status?: string | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming':
    case 'draft':
      return <Badge className="bg-blue-100 text-blue-800">قادم</Badge>;
    case 'active':
    case 'ongoing':
      return <Badge className="bg-green-100 text-green-800">جاري</Badge>;
    case 'completed':
      return <Badge className="bg-gray-100 text-gray-800">مكتمل</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

type ViewMode = 'list' | 'add';

export default function Training() {
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || String(userRole).includes("manager");
  const canDelete = userRole === "admin";

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [programCode] = useState(generateProgramCode());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [instructor, setInstructor] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Hooks
  const { data: programs = [], isLoading, isError } = useTrainingPrograms();
  const createProgramMutation = useCreateTrainingProgram();

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setInstructor('');
    setMaxParticipants('20');
    setStartDate('');
    setEndDate('');
  };

  const handleCreateProgram = () => {
    if (!name) {
      toast.error('يرجى إدخال اسم البرنامج');
      return;
    }

    createProgramMutation.mutate({
      name: name,
      description: description || undefined,
      category: category || undefined,
      instructor: instructor || undefined,
      maxParticipants: parseInt(maxParticipants),
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء البرنامج التدريبي بنجاح');
        setViewMode('list');
        resetForm();
      },
      onError: (error: any) => {
        toast.error('فشل في إنشاء البرنامج: ' + (error.response?.data?.message || error.message));
      }
    });
  };

  // حساب الإحصائيات
  const stats = {
    totalPrograms: programs.length,
    ongoing: programs.filter(p => p.status === 'active').length,
    upcoming: programs.filter(p => p.status === 'draft').length,
    completed: programs.filter(p => p.status === 'completed').length,
  };

  const columns: ColumnDef<TrainingProgram>[] = [
    {
      accessorKey: 'name',
      header: 'البرنامج التدريبي',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.category || '-'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'instructor',
      header: 'المدرب',
      cell: ({ row }) => row.original.instructor || '-',
    },
    {
      accessorKey: 'startDate',
      header: 'تاريخ البدء',
      cell: ({ row }) => row.original.startDate
        ? formatDate(row.original.startDate)
        : '-',
    },
    {
      accessorKey: 'maxParticipants',
      header: 'الحد الأقصى',
      cell: ({ row }) => row.original.maxParticipants || '-',
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status || 'upcoming'),
    },
  ];

  // نموذج إضافة برنامج تدريبي
  if (viewMode === 'add') {


    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إنشاء برنامج تدريبي جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات البرنامج التدريبي</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              بيانات البرنامج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم البرنامج (تلقائي)</Label>
                  <Input
                    value={programCode}
                    disabled
                    className="bg-muted font-mono"
                    placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>اسم البرنامج *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: دورة القيادة الفعالة"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف البرنامج التدريبي..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leadership">قيادة</SelectItem>
                      <SelectItem value="technical">تقني</SelectItem>
                      <SelectItem value="soft_skills">مهارات شخصية</SelectItem>
                      <SelectItem value="compliance">امتثال</SelectItem>
                      <SelectItem value="safety">سلامة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المدرب</Label>
                  <Input
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="اسم المدرب"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى للمشاركين</Label>
                  <Input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ البدء</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الانتهاء</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreateProgram} disabled={createProgramMutation.isPending}>
                {createProgramMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء البرنامج
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التدريب والتطوير</h2>
          <p className="text-muted-foreground">إدارة البرامج التدريبية للموظفين</p>
        </div>
        <Button onClick={() => setViewMode('add')}>
          <Plus className="h-4 w-4 ms-2" />
          برنامج جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي البرامج</p>
              <p className="text-2xl font-bold">{stats.totalPrograms}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">برامج جارية</p>
              <p className="text-2xl font-bold">{stats.ongoing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-50">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">برامج قادمة</p>
              <p className="text-2xl font-bold">{stats.upcoming}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">برامج مكتملة</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            البرامج التدريبية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">لا توجد برامج تدريبية</p>
              <Button variant="link" onClick={() => setViewMode('add')}>
                إنشاء برنامج تدريبي جديد
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={programs}
              searchKey="name"
              searchPlaceholder="بحث بالاسم..."
              emptyMessage="لا توجد برامج تدريبية"
            />
          )}
        </CardContent>
      </Card>

    </div>
  );
}
