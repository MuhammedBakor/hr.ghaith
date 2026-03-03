import { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Loader2,
  RefreshCw,
  Printer,
  Download,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";

interface DepartmentFormData {
  name: string;
  code: string;
  parentId: number | null;
  managerId: number | null;
  description: string;
}

interface PositionFormData {
  title: string;
  departmentId: number | null;
  grade: string;
  description: string;
  minSalary: string;
  maxSalary: string;
}

const initialDeptForm: DepartmentFormData = {
  name: '',
  code: '',
  parentId: null,
  managerId: null,
  description: '',
};

const initialPositionForm: PositionFormData = {
  title: '',
  departmentId: null,
  grade: 'C1',
  description: '',
  minSalary: '',
  maxSalary: '',
};

export default function OrganizationStructure() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [activeTab, setActiveTab] = useState('chart');
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<number[]>([1, 2]);
  
  // نماذج الإنشاء
  const [deptForm, setDeptForm] = useState<DepartmentFormData>(initialDeptForm);
  const [positionForm, setPositionForm] = useState<PositionFormData>(initialPositionForm);
  
  // نماذج التعديل
  const [editingDept, setEditingDept] = useState<any>(null);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [isEditPositionOpen, setIsEditPositionOpen] = useState(false);
  
  // نوافذ الحذف
  const [deletingDept, setDeletingDept] = useState<any>(null);
  const [deletingPosition, setDeletingPosition] = useState<any>(null);
  const [isDeleteDeptOpen, setIsDeleteDeptOpen] = useState(false);
  const [isDeletePositionOpen, setIsDeletePositionOpen] = useState(false);

  // جلب البيانات من API
  const { data: employeesData, isError, error} = trpc.hr.employees.list.useQuery();
  const { data: departmentsData, isLoading: loadingDepts, refetch: refetchDepts } = trpc.hrExtended.departments.list.useQuery();
  const { data: positionsData, isLoading: loadingPositions, refetch: refetchPositions } = trpc.hrExtended.positions.list.useQuery();
  
  // Mutations للأقسام
  const createDeptMutation = trpc.hrExtended.departments.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء القسم بنجاح');
      setShowNewDepartment(false);
      setDeptForm(initialDeptForm);
      refetchDepts();
    },
    onError: (error) => {
      toast.error(`فشل في إنشاء القسم: ${error.message}`);
    },
  });
  
  const updateDeptMutation = trpc.hrExtended.departments.update.useMutation({
    onSuccess: () => {
      toast.success('تم تعديل القسم بنجاح');
      setIsEditDeptOpen(false);
      setEditingDept(null);
      refetchDepts();
    },
    onError: (error) => {
      toast.error(`فشل في تعديل القسم: ${error.message}`);
    },
  });
  
  const deleteDeptMutation = trpc.hrExtended.departments.delete.useMutation({
    onSuccess: () => {
      toast.success('تم حذف القسم بنجاح');
      setIsDeleteDeptOpen(false);
      setDeletingDept(null);
      refetchDepts();
    },
    onError: (error) => {
      toast.error(`فشل في حذف القسم: ${error.message}`);
    },
  });
  
  // Mutations للمسميات الوظيفية
  const createPositionMutation = trpc.hrExtended.positions.create.useMutation({
    onSuccess: () => {
      toast.success('تم إنشاء المسمى الوظيفي بنجاح');
      setShowNewPosition(false);
      setPositionForm(initialPositionForm);
      refetchPositions();
    },
    onError: (error) => {
      toast.error(`فشل في إنشاء المسمى الوظيفي: ${error.message}`);
    },
  });
  
  const updatePositionMutation = trpc.hrExtended.positions.update.useMutation({
    onSuccess: () => {
      toast.success('تم تعديل المسمى الوظيفي بنجاح');
      setIsEditPositionOpen(false);
      setEditingPosition(null);
      refetchPositions();
    },
    onError: (error) => {
      toast.error(`فشل في تعديل المسمى الوظيفي: ${error.message}`);
    },
  });
  
  const deletePositionMutation = trpc.hrExtended.positions.delete.useMutation({
    onSuccess: () => {
      toast.success('تم حذف المسمى الوظيفي بنجاح');
      setIsDeletePositionOpen(false);
      setDeletingPosition(null);
      refetchPositions();
    },
    onError: (error) => {
      toast.error(`فشل في حذف المسمى الوظيفي: ${error.message}`);
    },
  });

  // تحويل البيانات إلى شجرة هرمية
  const departmentsTree = useMemo(() => {
    if (!departmentsData || departmentsData.length === 0) {
      return [];
    }
    
    // بناء خريطة للأقسام
    const deptMap = new Map();
    departmentsData.forEach((dept: any) => {
      deptMap.set(dept.id, { ...dept, children: [] });
    });
    
    // بناء الشجرة
    const roots: any[] = [];
    departmentsData.forEach((dept: any) => {
      const deptNode = deptMap.get(dept.id);
      if (dept.parentId && deptMap.has(dept.parentId)) {
        deptMap.get(dept.parentId).children.push(deptNode);
      } else {
        roots.push(deptNode);
      }
    });
    
    return roots;
  }, [departmentsData]);

  // قائمة الأقسام المسطحة
  const flatDepartments = departmentsData || [];
  const positions = positionsData || [];

  // إحصائيات
  const totalEmployees = employeesData?.length || 0;
  const totalDepartments = flatDepartments.length;
  const totalPositions = positions.length;

  const toggleDepartment = (deptId: number) => {
    setExpandedDepts(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  // دوال الإنشاء
  const handleCreateDept = () => {
    if (!deptForm.name) {
      toast.error('يرجى إدخال اسم القسم');
      return;
    }
    createDeptMutation.mutate({
      name: deptForm.name,
      code: deptForm.code || deptForm.name.substring(0, 4).toUpperCase(),
      parentId: deptForm.parentId || undefined,
      managerId: deptForm.managerId || undefined,
    });
  };

  const handleCreatePosition = () => {
    if (!positionForm.title) {
      toast.error('يرجى إدخال المسمى الوظيفي');
      return;
    }
    createPositionMutation.mutate({
      departmentId: positionForm.departmentId || undefined,
      title: positionForm.title,
      minSalary: positionForm.minSalary || undefined,
      maxSalary: positionForm.maxSalary || undefined,
      description: positionForm.description || undefined,
    });
  };

  // دوال التعديل
  const handleEditDept = (dept: any) => {
    setEditingDept(dept);
    setIsEditDeptOpen(true);
  };

  const handleUpdateDept = () => {
    if (!editingDept) return;
    updateDeptMutation.mutate({
      id: editingDept.id,
      name: editingDept.name,
    });
  };

  const handleEditPosition = (position: any) => {
    setEditingPosition(position);
    setIsEditPositionOpen(true);
  };

  const handleUpdatePosition = () => {
    if (!editingPosition) return;
    updatePositionMutation.mutate({
      id: editingPosition.id,
      title: editingPosition.title,
    });
  };

  // دوال الحذف
  const handleDeleteDept = (dept: any) => {
    setDeletingDept(dept);
    setIsDeleteDeptOpen(true);
  };

  const confirmDeleteDept = () => {
    if (!deletingDept) return;
    deleteDeptMutation.mutate({ id: deletingDept.id });
  };

  const handleDeletePosition = (position: any) => {
    setDeletingPosition(position);
    setIsDeletePositionOpen(true);
  };

  const confirmDeletePosition = () => {
    if (!deletingPosition) return;
    deletePositionMutation.mutate({ id: deletingPosition.id });
  };

  // دوال الطباعة والتصدير
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = activeTab === 'departments' ? flatDepartments : positions;
    if (data.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    
    let headers: string[];
    let csvData: any[][];
    
    if (activeTab === 'departments') {
      headers = ['الرقم', 'الاسم', 'الرمز', 'القسم الأب'];
      csvData = flatDepartments.map((d: any) => [d.id, d.name || d.nameAr, d.code, d.parentId || '-']);
    } else {
      headers = ['الرقم', 'المسمى', 'القسم', 'المستوى'];
      csvData = positions.map((p: any) => [p.id, p.title || p.titleAr, p.departmentId, p.level]);
    }
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('تم تصدير البيانات بنجاح');
  };

  // Mutation لاستيراد الأقسام
  const importDeptsMutation = trpc.hrExtended.departments.bulkImport.useMutation({
    onSuccess: (result) => {
      toast.success(`تم استيراد ${result.imported} قسم بنجاح`);
      if (result.failed > 0) {
        toast.warning(`فشل استيراد ${result.failed} قسم`);
      }
      refetchDepts();
    },
    onError: (error) => {
      toast.error(`فشل في الاستيراد: ${error.message}`);
    },
  });

  // Mutation لاستيراد المسميات الوظيفية
  const importPositionsMutation = trpc.hrExtended.positions.bulkImport.useMutation({
    onSuccess: (result) => {
      toast.success(`تم استيراد ${result.imported} مسمى وظيفي بنجاح`);
      if (result.failed > 0) {
        toast.warning(`فشل استيراد ${result.failed} مسمى`);
      }
      refetchPositions();
    },
    onError: (error) => {
      toast.error(`فشل في الاستيراد: ${error.message}`);
    },
  });

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        toast.info(`تم اختيار الملف: ${file.name}. جاري المعالجة...`);
        
        try {
          const text = await file.text();
          const lines = text.split('\n').filter((line: string) => line.trim());
          
          if (lines.length < 2) {
            toast.error('الملف فارغ أو لا يحتوي على بيانات');
            return;
          }

          const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
          
          // تحديد نوع الاستيراد بناءً على العناوين
          if (headers.includes('الاسم') || headers.includes('name') || headers.includes('القسم')) {
            // استيراد أقسام
            const departments = lines.slice(1).map((line: string) => {
              const values = line.split(',');
              return {
                name: values[0]?.trim() || '',
                code: values[1]?.trim() || undefined,
              };
            }).filter((d: any) => d.name);

            if (departments.length > 0) {
              importDeptsMutation.mutate({ departments });
            } else {
              toast.error('لم يتم العثور على أقسام صالحة للاستيراد');
            }
          } else if (headers.includes('المسمى') || headers.includes('title') || headers.includes('الوظيفة')) {
            // استيراد مسميات وظيفية
            const positions = lines.slice(1).map((line: string) => {
              const values = line.split(',');
              return {
                title: values[0]?.trim() || '',
                level: values[1]?.trim() || undefined,
              };
            }).filter((p: any) => p.title);

            if (positions.length > 0) {
              importPositionsMutation.mutate({ positions });
            } else {
              toast.error('لم يتم العثور على مسميات صالحة للاستيراد');
            }
          } else {
            toast.error('تنسيق الملف غير معروف. يجب أن يحتوي على عمود الاسم أو المسمى');
          }
        } catch (error) {
          toast.error('فشل في قراءة الملف');
        }
      }
    };
    input.click();
  };

  const renderDepartmentTree = (dept: any, level: number = 0) => {
    const isExpanded = expandedDepts.includes(dept.id);
    const hasChildren = dept.children && dept.children.length > 0;

    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div key={dept.id}>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">✕</button>}
        </div>
        <div 
          className={`flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-gray-50 cursor-pointer`}
          style={{ marginRight: `${level * 24}px` }}
          onClick={() => hasChildren && toggleDepartment(dept.id)}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="w-4" />
            )}
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">{dept.name || dept.nameAr}</h4>
              <p className="text-sm text-gray-500">{dept.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{dept.employeeCount || 0} موظف</Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditDept(dept); }}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {dept?.children?.map((child: any) => renderDepartmentTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loadingDepts || loadingPositions) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الهيكل التنظيمي</h2>
          <p className="text-gray-500">إدارة الأقسام والمسميات الوظيفية</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 ms-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 ms-2" />
            تصدير Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 ms-2" />
            استيراد
          </Button>
          <Button variant="outline" onClick={() => setShowNewPosition(true)}>
            <Plus className="h-4 w-4 ms-2" />
            مسمى وظيفي
          </Button>
          <Button onClick={() => setShowNewDepartment(true)}>
            <Plus className="h-4 w-4 ms-2" />
            قسم جديد
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الأقسام</p>
                <h3 className="text-2xl font-bold">{totalDepartments}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">المسميات الوظيفية</p>
                <h3 className="text-2xl font-bold">{totalPositions}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الموظفين</p>
                <h3 className="text-2xl font-bold">{totalEmployees}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الدرجات الوظيفية</p>
                <h3 className="text-2xl font-bold">6</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <ChevronRight className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chart">الهيكل التنظيمي</TabsTrigger>
          <TabsTrigger value="departments">الأقسام</TabsTrigger>
          <TabsTrigger value="positions">المسميات الوظيفية</TabsTrigger>
        </TabsList>

        {/* Chart Tab */}
        <TabsContent value="chart" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>شجرة الهيكل التنظيمي</CardTitle>
              <PrintButton title="شجرة الهيكل التنظيمي" />
                <CardDescription>عرض هرمي للأقسام والإدارات</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => { refetchDepts(); refetchPositions(); }}>
                <RefreshCw className="h-4 w-4 ms-2" />
                تحديث
              </Button>
            </CardHeader>
            <CardContent>
              {departmentsTree.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد أقسام</p>
                  <Button className="mt-4" onClick={() => setShowNewDepartment(true)}>
                    <Plus className="h-4 w-4 ms-2" />
                    إضافة قسم
                  </Button>
                </div>
              ) : (
                departmentsTree.map((dept: any) => renderDepartmentTree(dept))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>قائمة الأقسام</CardTitle>
                <CardDescription>جميع الأقسام والإدارات</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchDepts()}>
                <RefreshCw className="h-4 w-4 ms-2" />
                تحديث
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {flatDepartments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد أقسام</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>القسم</TableHead>
                      <TableHead>الرمز</TableHead>
                      <TableHead>عدد الموظفين</TableHead>
                      <TableHead>القسم الأب</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flatDepartments.map((dept: any) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name || dept.nameAr}</TableCell>
                        <TableCell><Badge variant="outline">{dept.code}</Badge></TableCell>
                        <TableCell>{dept.employeeCount || 0}</TableCell>
                        <TableCell>{dept.parentId ? flatDepartments.find((d: any) => d.id === dept.parentId)?.name || '-' : '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditDept(dept)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteDept(dept)}>
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
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>المسميات الوظيفية</CardTitle>
                <CardDescription>جميع المسميات والدرجات الوظيفية</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchPositions()}>
                <RefreshCw className="h-4 w-4 ms-2" />
                تحديث
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {positions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد مسميات وظيفية</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المسمى الوظيفي</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>المستوى</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position: any) => (
                      <TableRow key={position.id}>
                        <TableCell className="font-medium">{position.title || position.titleAr}</TableCell>
                        <TableCell>{flatDepartments.find((d: any) => d.id === position.departmentId)?.name || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{position.level || 'C1'}</Badge></TableCell>
                        <TableCell>
                          <Badge className={position.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {position.isActive !== false ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditPosition(position)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeletePosition(position)}>
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
        </TabsContent>
      </Tabs>

      {/* New Department Dialog */}
      {showNewDepartment && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">قسم جديد</h3>
            <p className="text-sm text-gray-500">إضافة قسم أو إدارة جديدة</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم القسم *</Label>
              <Input 
                placeholder="مثال: قسم المبيعات" 
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>رمز القسم</Label>
              <Input 
                placeholder="مثال: SALES" 
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>القسم الأب</Label>
              <Select 
                value={deptForm.parentId?.toString() || 'none'}
                onValueChange={(value) => setDeptForm({ ...deptForm, parentId: value === 'none' ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم الأب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون (قسم رئيسي)</SelectItem>
                  {flatDepartments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name || dept.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewDepartment(false)}>إلغاء</Button>
            <Button onClick={handleCreateDept} disabled={createDeptMutation.isPending}>
              {createDeptMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ms-2" />}
              إضافة
            </Button>
          </div>
        </div>
      </div>)}

      {/* Edit Department Dialog */}
      {isEditDeptOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل القسم</h3>
            <p className="text-sm text-gray-500">تعديل بيانات القسم</p>
          </div>
          {editingDept && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم القسم</Label>
                <Input 
                  value={editingDept.name || editingDept.nameAr || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value, nameAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>رمز القسم</Label>
                <Input 
                  value={editingDept.code || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsEditDeptOpen(false)}>إلغاء</Button>
            <Button onClick={handleUpdateDept} disabled={updateDeptMutation.isPending}>
              {updateDeptMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ms-2" />}
              حفظ
            </Button>
          </div>
        </div>
      </div>)}

      {/* Delete Department Dialog */}
      <AlertDialog open={isDeleteDeptOpen} onOpenChange={setIsDeleteDeptOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا القسم؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف القسم "{deletingDept?.name || deletingDept?.nameAr}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDept} className="bg-red-600 hover:bg-red-700">
              حذف القسم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Position Dialog */}
      {showNewPosition && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">مسمى وظيفي جديد</h3>
            <p className="text-sm text-gray-500">إضافة مسمى وظيفي جديد</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المسمى الوظيفي *</Label>
              <Input 
                placeholder="مثال: مدير المشاريع" 
                value={positionForm.title}
                onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select 
                value={positionForm.departmentId?.toString() || ''}
                onValueChange={(value) => setPositionForm({ ...positionForm, departmentId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  {flatDepartments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name || dept.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الدرجة الوظيفية</Label>
              <Select 
                value={positionForm.grade}
                onValueChange={(value) => setPositionForm({ ...positionForm, grade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدرجة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1 - إدارة عليا</SelectItem>
                  <SelectItem value="B1">B1 - إدارة وسطى</SelectItem>
                  <SelectItem value="B2">B2 - إشرافي</SelectItem>
                  <SelectItem value="C1">C1 - تنفيذي أول</SelectItem>
                  <SelectItem value="C2">C2 - تنفيذي</SelectItem>
                  <SelectItem value="D1">D1 - مبتدئ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأدنى للراتب</Label>
                <Input 
                  type="number"
                  placeholder="أدخل..." 
                  value={positionForm.minSalary}
                  onChange={(e) => setPositionForm({ ...positionForm, minSalary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى للراتب</Label>
                <Input 
                  type="number"
                  placeholder="أدخل..." 
                  value={positionForm.maxSalary}
                  onChange={(e) => setPositionForm({ ...positionForm, maxSalary: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewPosition(false)}>إلغاء</Button>
            <Button onClick={handleCreatePosition} disabled={createPositionMutation.isPending}>
              {createPositionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ms-2" />}
              إضافة
            </Button>
          </div>
        </div>
      </div>)}

      {/* Edit Position Dialog */}
      {isEditPositionOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل المسمى الوظيفي</h3>
            <p className="text-sm text-gray-500">تعديل بيانات المسمى الوظيفي</p>
          </div>
          {editingPosition && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>المسمى الوظيفي</Label>
                <Input 
                  value={editingPosition.title || editingPosition.titleAr || ''}
                  onChange={(e) => setEditingPosition({ ...editingPosition, title: e.target.value, titleAr: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setIsEditPositionOpen(false)}>إلغاء</Button>
            <Button onClick={handleUpdatePosition} disabled={updatePositionMutation.isPending}>
              {updatePositionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ms-2" />}
              حفظ
            </Button>
          </div>
        </div>
      </div>)}

      {/* Delete Position Dialog */}
      <AlertDialog open={isDeletePositionOpen} onOpenChange={setIsDeletePositionOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المسمى الوظيفي؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المسمى الوظيفي "{editingPosition?.title || editingPosition?.titleAr}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePosition} className="bg-red-600 hover:bg-red-700">
              حذف المسمى
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
