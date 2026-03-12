import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, FileDown, Trash2, Edit, PauseCircle, Loader2, Archive, XCircle, PlayCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, FileText, Calendar, Clock, DollarSign, Award, GraduationCap, Building2, Filter, UserPlus, Zap, ClipboardList, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useEmployees,
  useUpdateEmployee,
  useDeleteEmployee,
  useUpdateEmployeeStatus,
  useDepartments,
  usePositions,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition
} from '@/services/hrService';
import { Link } from 'wouter';
import { useAppContext } from '@/contexts/AppContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PrintButton } from '@/components/PrintButton';
import { ExportButtons } from '@/components/ExportButtons';
import { toast } from 'sonner';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  positionId: number | null;
  department: string;
  departmentId: number | null;
  status: string;
  joinDate: string;
  branchId: number | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">نشط</Badge>;
    case 'inactive':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">غير نشط</Badge>;
    case 'suspended':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">موقوف مؤقتاً</Badge>;
    case 'on_leave':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">في إجازة</Badge>;
    case 'terminated':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">منتهي الخدمة</Badge>;
    case 'incomplete':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">غير مكتمل</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Quick links for HR sub-modules
const hrModules = [
  { title: 'الحضور والانصراف', icon: Clock, href: '/hr/attendance', color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'الإجازات', icon: Calendar, href: '/hr/leaves', color: 'text-green-600', bg: 'bg-green-50' },
  { title: 'الرواتب', icon: DollarSign, href: '/hr/payroll', color: 'text-amber-600', bg: 'bg-amber-50' },
  { title: 'تقييم الأداء', icon: Award, href: '/hr/performance', color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: 'التدريب', icon: GraduationCap, href: '/hr/training', color: 'text-pink-600', bg: 'bg-pink-50' },
  { title: 'الهيكل التنظيمي', icon: Building2, href: '/hr/organization', color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export default function EmployeeList() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || String(userRole).includes("manager");
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [activeTab, setActiveTab] = useState('employees');
  const [terminationOpen, setTerminationOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationType, setTerminationType] = useState<string>('');
  const [terminationNotes, setTerminationNotes] = useState('');

  // حقول التعديل
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPositionId, setEditPositionId] = useState<string>('');
  const [editDepartmentId, setEditDepartmentId] = useState<string>('');

  // Get branch from AppContext
  const { selectedBranchId, currentBranch, currentEmployee, selectedRole } = useAppContext();

  // For generic department managers: also filter by their own department
  // Specialist managers (hr_manager, legal_manager, etc.) can see all employees in their branch
  const isGenericDeptManager = selectedRole === 'department_manager';
  const deptManagerDeptId = isGenericDeptManager && currentEmployee?.department?.id
    ? currentEmployee.department.id : null;

  // Fetch data using hrService hooks - filter by branchId (company context) and optionally departmentId
  const { data: employeesData, isLoading: loading, isError } = useEmployees({
    branchId: selectedBranchId,
    departmentId: deptManagerDeptId,
  });
  const { data: departmentsData } = useDepartments({ branchId: selectedBranchId });
  const { data: positionsData } = usePositions({ branchId: selectedBranchId });

  // Mutations
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const statusMutation = useUpdateEmployeeStatus();

  const createDeptMutation = useCreateDepartment();
  const updateDeptMutation = useUpdateDepartment();
  const deleteDeptMutation = useDeleteDepartment();

  const createPosMutation = useCreatePosition();
  const updatePosMutation = useUpdatePosition();
  const deletePosMutation = useDeletePosition();
  const employees: Employee[] = (employeesData || []).map((emp: any) => ({
    id: String(emp.id),
    firstName: emp.firstName || '',
    lastName: emp.lastName || '',
    email: emp.email || '',
    phone: emp.phone || '',
    position: (typeof emp.position === 'object' ? emp.position?.title : emp.position) || '',
    positionId: (typeof emp.position === 'object' ? emp.position?.id : null),
    department: (typeof emp.department === 'object' ? (emp.department?.nameAr || emp.department?.name) : emp.department) || '',
    departmentId: (typeof emp.department === 'object' ? emp.department?.id : null),
    status: emp.status || 'active',
    joinDate: emp.hireDate ? new Date(emp.hireDate).toISOString() : (emp.createdAt ? new Date(emp.createdAt).toISOString() : ''),
    branchId: typeof emp.branch === 'object' ? emp.branch?.id : emp.branchId,
  }));

  // الحصول على اسم الفرع المختار
  const branchName = currentBranch?.name || 'جميع الفروع';

  // دوال المساعدة
  const resetEditForm = () => {
    setSelectedEmployee(null);
    setEditFirstName('');
    setEditLastName('');
    setEditEmail('');
    setEditPhone('');
    setEditPositionId('');
    setEditDepartmentId('');
  };

  const resetTerminationForm = () => {
    setSelectedEmployee(null);
    setTerminationType('');
    setTerminationReason('');
    setTerminationNotes('');
  };

  const openEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditFirstName(emp.firstName);
    setEditLastName(emp.lastName);
    setEditEmail(emp.email);
    setEditPhone(emp.phone || '');
    setEditPositionId(emp.positionId ? String(emp.positionId) : '');
    setEditDepartmentId(emp.departmentId ? String(emp.departmentId) : '');
    setEditOpen(true);
  };

  const openSuspend = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSuspendOpen(true);
  };

  const openTermination = (emp: Employee) => {
    setSelectedEmployee(emp);
    setTerminationOpen(true);
  };

  const openDelete = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDeleteOpen(true);
  };

  const handleUpdateEmployee = () => {
    if (!selectedEmployee) return;

    const updateData: any = {
      id: parseInt(selectedEmployee.id),
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      phone: editPhone,
    };
    if (editDepartmentId) {
      updateData.department = { id: parseInt(editDepartmentId) };
    }
    if (editPositionId) {
      updateData.position = { id: parseInt(editPositionId) };
    }

    updateEmployeeMutation.mutate(updateData, {
      onSuccess: () => {
        toast.success('تم تحديث بيانات الموظف بنجاح');
        setEditOpen(false);
        resetEditForm();
      },
      onError: (err: any) => toast.error(`فشل في تحديث البيانات: ${err.message}`)
    });
  };

  const handleSuspendEmployee = () => {
    if (!selectedEmployee) return;

    statusMutation.mutate({
      id: parseInt(selectedEmployee.id),
      status: 'suspended',
    }, {
      onSuccess: () => {
        toast.success('تم إيقاف الموظف مؤقتاً');
        setSuspendOpen(false);
        setSelectedEmployee(null);
      },
      onError: (err: any) => toast.error(`فشل في الإيقاف: ${err.message}`)
    });
  };

  const handleReactivateEmployee = (emp: Employee) => {
    statusMutation.mutate({
      id: parseInt(emp.id),
      status: 'active',
    }, {
      onSuccess: () => toast.success('تم إعادة تنشيط الموظف بنجاح'),
      onError: (err: any) => toast.error(`فشل في إعادة التنشيط: ${err.message}`)
    });
  };

  const handleTerminateEmployee = () => {
    if (!selectedEmployee || !terminationType || !terminationReason) return;

    statusMutation.mutate({
      id: parseInt(selectedEmployee.id),
      status: 'terminated',
    }, {
      onSuccess: () => {
        toast.success('تم إنهاء خدمة الموظف');
        setTerminationOpen(false);
        resetTerminationForm();
      },
      onError: (err: any) => toast.error(`فشل في إنهاء الخدمة: ${err.message}`)
    });
  };

  const handleDeleteEmployee = () => {
    if (!selectedEmployee) return;

    deleteEmployeeMutation.mutate(parseInt(selectedEmployee.id), {
      onSuccess: () => {
        toast.success('تم حذف الموظف بنجاح');
        setDeleteOpen(false);
        setSelectedEmployee(null);
      },
      onError: (err: any) => toast.error(`فشل في حذف الموظف: ${err.message}`)
    });
  };

  const handleArchiveEmployee = (emp: Employee) => {
    statusMutation.mutate({
      id: parseInt(emp.id),
      status: 'inactive',
    }, {
      onSuccess: () => toast.success('تم أرشفة الموظف بنجاح'),
      onError: (err: any) => toast.error(`فشل في الأرشفة: ${err.message}`)
    });
  };

  // Department & Position handlers
  const handleCreateDept = (name: string, description: string) => {
    createDeptMutation.mutate({ name, description, status: 'active' }, {
      onSuccess: () => toast.success('تم إضافة القسم بنجاح'),
      onError: (err: any) => toast.error(err.message)
    });
  };

  const handleDeleteDept = (id: number) => {
    confirmDelete(() => {
      deleteDeptMutation.mutate(id, {
        onSuccess: () => toast.success('تم حذف القسم'),
        onError: (err: any) => toast.error(err.message)
      });
    });
  };

  const handleCreatePos = (title: string, description: string) => {
    createPosMutation.mutate({ title, description, status: 'active' }, {
      onSuccess: () => toast.success('تم إضافة المنصب بنجاح'),
      onError: (err: any) => toast.error(err.message)
    });
  };

  const handleDeletePos = (id: number) => {
    confirmDelete(() => {
      deletePosMutation.mutate(id, {
        onSuccess: () => toast.success('تم حذف المنصب'),
        onError: (err: any) => toast.error(err.message)
      });
    });
  };

  // تعريف الأعمدة داخل المكون للوصول إلى الدوال
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'firstName',
      header: 'الاسم',
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <p className="font-medium whitespace-nowrap">{row.original.firstName} {row.original.lastName}</p>
          <p className="text-sm text-gray-500 truncate max-w-[200px]">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'القسم',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.department || '-'}</span>
      ),
    },
    {
      accessorKey: 'position',
      header: 'المنصب',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.position || '-'}</span>
      ),
    },
    {
      accessorKey: 'joinDate',
      header: 'تاريخ الانضمام',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{formatDate(row.original.joinDate)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const emp = row.original;
        const isSuspended = emp.status === 'suspended';
        const isTerminated = emp.status === 'terminated';
        const isInactive = emp.status === 'inactive';
        const isActive = emp.status === 'active';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="إجراءات">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/hr/employees/${emp.id}`}>
                  <FileText className="ms-2 h-4 w-4" />
                  عرض الملف
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/hr/employees/${emp.id}?mode=edit`}>
                  <Edit className="ms-2 h-4 w-4" />
                  تعديل البيانات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Reactivate - show when suspended, terminated, or inactive */}
              {(isSuspended || isTerminated || isInactive) && (
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => handleReactivateEmployee(emp)}
                >
                  <PlayCircle className="ms-2 h-4 w-4" />
                  إعادة تنشيط
                </DropdownMenuItem>
              )}
              {/* Suspend - show when active */}
              {isActive && (
                <DropdownMenuItem
                  className="text-amber-600"
                  onClick={() => openSuspend(emp)}
                >
                  <PauseCircle className="ms-2 h-4 w-4" />
                  إيقاف مؤقت
                </DropdownMenuItem>
              )}
              {/* Archive */}
              {isActive && (
                <DropdownMenuItem
                  className="text-blue-600"
                  onClick={() => handleArchiveEmployee(emp)}
                >
                  <Archive className="ms-2 h-4 w-4" />
                  أرشفة
                </DropdownMenuItem>
              )}
              {/* Terminate - show when not already terminated */}
              {!isTerminated && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => openTermination(emp)}
                >
                  <XCircle className="ms-2 h-4 w-4" />
                  إنهاء الخدمة
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Delete */}
              {canDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => openDelete(emp)}
                >
                  <Trash2 className="ms-2 h-4 w-4" />
                  حذف الموظف
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الموارد البشرية</h2>
          <p className="text-gray-500">إدارة شاملة للموظفين والموارد البشرية</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hr/employees/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة سريعة
            </Button>
          </Link>
          <Link href="/hr/employees/add-full">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة شاملة
            </Button>
          </Link>
        </div>
      </div>

      {/* فلتر الفرع النشط */}
      {selectedBranchId && (
        <Alert className="bg-blue-50 border-blue-200">
          <Filter className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            يتم عرض موظفي <strong>{branchName}</strong> فقط. لعرض جميع الموظفين، اختر "جميع الفروع" من القائمة العلوية.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Links to Sub-modules */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {hrModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed hover:border-primary/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className={`p-3 rounded-full mb-2 ${module.bg}`}>
                  <module.icon className={`h-5 w-5 ${module.color}`} />
                </div>
                <span className="text-sm font-medium">{module.title}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="employees" className="flex-shrink-0">
            قائمة الموظفين
            <Badge className="ms-2 bg-green-100 text-green-800 text-xs">{employees.filter(e => e.status === 'active' || e.status === 'incomplete').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="suspended" className="flex-shrink-0">
            موقوفون مؤقتاً
            <Badge className="ms-2 bg-amber-100 text-amber-800 text-xs">{employees.filter(e => e.status === 'suspended').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex-shrink-0">
            مؤرشفون
            <Badge className="ms-2 bg-blue-100 text-blue-800 text-xs">{employees.filter(e => e.status === 'inactive').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="terminated" className="flex-shrink-0">
            منتهية خدماتهم
            <Badge className="ms-2 bg-gray-100 text-gray-800 text-xs">{employees.filter(e => e.status === 'terminated').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex-shrink-0">الأقسام</TabsTrigger>
          <TabsTrigger value="positions" className="flex-shrink-0">المناصب</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {selectedBranchId ? (
                  <>
                    <Building2 className="h-5 w-5 text-primary" />
                    موظفو {branchName}
                  </>
                ) : (
                  'الموظفون النشطون'
                )}
              </CardTitle>
              <CardDescription>
                {loading ? 'جاري التحميل...' : `${employees.filter(e => e.status === 'active').length} موظف نشط` + (employees.filter(e => e.status === 'incomplete').length > 0 ? ` · ${employees.filter(e => e.status === 'incomplete').length} غير مكتمل` : '')}
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <PrintButton title="قائمة الموظفين" />
                <ExportButtons
                  data={employees.filter(e => e.status === 'active' || e.status === 'incomplete').map(emp => ({
                    name: `${emp.firstName} ${emp.lastName}`,
                    email: emp.email,
                    position: emp.position,
                    department: emp.department,
                    joinDate: emp.joinDate,
                    status: emp.status === 'incomplete' ? 'غير مكتمل' : 'نشط'
                  }))}
                  columns={[
                    { key: 'name', label: 'الاسم' },
                    { key: 'email', label: 'البريد الإلكتروني' },
                    { key: 'position', label: 'المنصب' },
                    { key: 'department', label: 'القسم' },
                    { key: 'joinDate', label: 'تاريخ الانضمام' },
                    { key: 'status', label: 'الحالة' }
                  ]}
                  filename="employees"
                  title="قائمة الموظفين"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={employees.filter(e => e.status === 'active' || e.status === 'incomplete')}
                  searchKey="firstName"
                  searchPlaceholder="بحث بالاسم..."
                  emptyMessage={selectedBranchId ? `لا يوجد موظفين في ${branchName}` : "لا يوجد موظفين"}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الموقوفون مؤقتاً */}
        <TabsContent value="suspended" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-600" />
                الموظفون الموقوفون مؤقتاً
              </CardTitle>
              <CardDescription>
                {employees.filter(e => e.status === 'suspended').length} موظف موقوف
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={employees.filter(e => e.status === 'suspended')}
                searchKey="firstName"
                searchPlaceholder="بحث بالاسم..."
                emptyMessage="لا يوجد موظفون موقوفون حالياً"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* المؤرشفون */}
        <TabsContent value="archived" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Archive className="h-5 w-5 text-blue-600" />
                الموظفون المؤرشفون
              </CardTitle>
              <CardDescription>
                {employees.filter(e => e.status === 'inactive').length} موظف مؤرشف
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={employees.filter(e => e.status === 'inactive')}
                searchKey="firstName"
                searchPlaceholder="بحث بالاسم..."
                emptyMessage="لا يوجد موظفون مؤرشفون"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* منتهية خدماتهم */}
        <TabsContent value="terminated" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-gray-600" />
                الموظفون المنتهية خدماتهم
              </CardTitle>
              <CardDescription>
                {employees.filter(e => e.status === 'terminated').length} موظف منتهي الخدمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={employees.filter(e => e.status === 'terminated')}
                searchKey="firstName"
                searchPlaceholder="بحث بالاسم..."
                emptyMessage="لا يوجد موظفون منتهية خدماتهم"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>الأقسام</CardTitle>
                <CardDescription>قائمة الأقسام في المنظمة</CardDescription>
              </div>
              <Link href="/hr/organization">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 ms-2" />
                  إضافة قسم
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {departmentsData && departmentsData.length > 0 ? (
                <div className="space-y-2">
                  {departmentsData.map((dept: any) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDept(dept.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Badge variant={dept.status === 'active' ? 'default' : 'secondary'}>
                          {dept.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                        {/* زر إضافة موظف للقسم */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              <UserPlus className="h-4 w-4" />
                              إضافة
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>إضافة موظف - {dept.nameAr || dept.name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {[
                              { label: 'مدير قسم', role: 'DEPARTEMENT_MANAGER' },
                              { label: 'مشرف', role: 'SUPERVISOR' },
                              { label: 'موظف', role: 'EMPLOYEE' },
                              { label: 'مندوب', role: 'AGENT' },
                            ].map((item) => (
                              <DropdownMenu key={item.role}>
                                <DropdownMenuTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="justify-between cursor-pointer">
                                    {item.label}
                                    <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                                  </DropdownMenuItem>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="left" className="w-44">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/hr/employees/add?role=${item.role}&departmentId=${dept.id}`}>
                                      <Zap className="h-4 w-4 ms-2" />
                                      إضافة سريعة
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/hr/employees/add-full?role=${item.role}&departmentId=${dept.id}`}>
                                      <ClipboardList className="h-4 w-4 ms-2" />
                                      إضافة شاملة
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="font-medium">{dept.nameAr || dept.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">لا توجد أقسام مسجلة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>المناصب الوظيفية</CardTitle>
                <CardDescription>قائمة المناصب الوظيفية</CardDescription>
              </div>
              <Link href="/settings/hr/positions">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 ms-2" />
                  إضافة منصب
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {positionsData && positionsData.length > 0 ? (
                <div className="space-y-2">
                  {positionsData.map((pos: any) => (
                    <div key={pos.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{pos.title}</p>
                        <p className="text-sm text-gray-500">{pos.description || 'لا يوجد وصف'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pos.status === 'active' ? 'default' : 'secondary'}>
                          {pos.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePos(pos.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">لا توجد مناصب مسجلة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة تعديل بيانات الموظف */}
      {editOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">

        <div className="mb-4 border-b pb-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            تعديل بيانات الموظف
          </h3>
          <p className="text-sm text-gray-500">
            تعديل بيانات الموظف <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>
          </p>
        </div>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم الأول *</Label>
              <Input
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="الاسم الأول"
              />
            </div>
            <div className="space-y-2">
              <Label>الاسم الأخير *</Label>
              <Input
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="الاسم الأخير"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="رقم الهاتف"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select value={editDepartmentId} onValueChange={setEditDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  {(departmentsData || []).map((dept: any) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.nameAr || dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المنصب</Label>
              <Select value={editPositionId} onValueChange={setEditPositionId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنصب" />
                </SelectTrigger>
                <SelectContent>
                  {(positionsData || []).map((pos: any) => (
                    <SelectItem key={pos.id} value={String(pos.id)}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
          <Button variant="outline" onClick={() => { setEditOpen(false); resetEditForm(); }}>
            إلغاء
          </Button>
          <Button
            onClick={handleUpdateEmployee}
            disabled={!editFirstName || !editLastName || !editEmail || updateEmployeeMutation.isPending}
          >
            {updateEmployeeMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>

      </div>)}


      {/* نافذة إيقاف الموظف مؤقتاً */}
      {suspendOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">

        <div className="mb-4 border-b pb-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-amber-600" />
            إيقاف الموظف مؤقتاً
          </h3>
          <p className="text-sm text-gray-500">
            هل أنت متأكد من إيقاف الموظف <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> مؤقتاً؟
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 my-4">
          <p className="text-sm text-amber-800">
            <strong>تنبيه:</strong> سيتم إيقاف حساب الموظف مؤقتاً ولن يتمكن من الوصول إلى النظام حتى يتم إعادة تنشيطه.
          </p>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
          <Button variant="outline" onClick={() => { setSuspendOpen(false); setSelectedEmployee(null); }}>
            إلغاء
          </Button>
          <Button
            variant="default"
            className="bg-amber-600 hover:bg-amber-700"
            onClick={handleSuspendEmployee}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            تأكيد الإيقاف
          </Button>
        </div>

      </div>)}


      {/* نافذة إنهاء خدمة الموظف */}
      {terminationOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">

        <div className="mb-4 border-b pb-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            إنهاء خدمة الموظف
          </h3>
          <p className="text-sm text-gray-500">
            سيتم إنهاء خدمة الموظف <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> وتعطيل حسابه في النظام.
          </p>
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>نوع إنهاء الخدمة *</Label>
            <Select value={terminationType} onValueChange={setTerminationType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع إنهاء الخدمة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resignation">استقالة</SelectItem>
                <SelectItem value="termination">فصل</SelectItem>
                <SelectItem value="retirement">تقاعد</SelectItem>
                <SelectItem value="contract_end">انتهاء العقد</SelectItem>
                <SelectItem value="mutual_agreement">اتفاق متبادل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>سبب إنهاء الخدمة *</Label>
            <Select value={terminationReason} onValueChange={setTerminationReason}>
              <SelectTrigger>
                <SelectValue placeholder="اختر السبب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal_reasons">أسباب شخصية</SelectItem>
                <SelectItem value="better_opportunity">فرصة عمل أفضل</SelectItem>
                <SelectItem value="performance_issues">مشاكل في الأداء</SelectItem>
                <SelectItem value="policy_violation">مخالفة السياسات</SelectItem>
                <SelectItem value="restructuring">إعادة هيكلة</SelectItem>
                <SelectItem value="health_reasons">أسباب صحية</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea
              value={terminationNotes}
              onChange={(e) => setTerminationNotes(e.target.value)}
              placeholder="أدخل أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>تنبيه:</strong> سيتم تعطيل حساب الموظف في النظام ولن يتمكن من تسجيل الدخول.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
          <Button variant="outline" onClick={() => { setTerminationOpen(false); resetTerminationForm(); }}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleTerminateEmployee}
            disabled={!terminationType || !terminationReason || statusMutation.isPending}
          >
            {statusMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            <FileDown className="ms-2 h-4 w-4" />
            تأكيد إنهاء الخدمة
          </Button>
        </div>

      </div>)}

      {/* نافذة حذف الموظف */}
      {deleteOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">

        <div className="mb-4 border-b pb-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            حذف الموظف
          </h3>
          <p className="text-sm text-gray-500">
            هل أنت متأكد من حذف الموظف <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>؟
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
          <p className="text-sm text-red-800">
            <strong>تحذير:</strong> سيتم حذف الموظف نهائياً من النظام. هذا الإجراء لا يمكن التراجع عنه. إذا كنت تريد فقط تعطيل الحساب، استخدم "إيقاف مؤقت" أو "أرشفة" بدلاً من ذلك.
          </p>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
          <Button variant="outline" onClick={() => { setDeleteOpen(false); setSelectedEmployee(null); }}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteEmployee}
            disabled={deleteEmployeeMutation.isPending}
          >
            {deleteEmployeeMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            <Trash2 className="ms-2 h-4 w-4" />
            تأكيد الحذف
          </Button>
        </div>

      </div>)}

    </div>
  );
}
