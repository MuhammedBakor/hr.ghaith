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
import { Plus, MoreHorizontal, FileText, Calendar, Clock, DollarSign, Award, GraduationCap, Building2, Filter, UserPlus, Zap, ClipboardList, ChevronDown, Users, AlertCircle } from 'lucide-react';
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
import { useAuth } from '@/_core/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PrintButton } from '@/components/PrintButton';
import { ExportButtons } from '@/components/ExportButtons';
import { toast } from 'sonner';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr: string;
  lastNameAr: string;
  email: string;
  phone: string;
  position: string;
  positionId: number | null;
  department: string;
  departmentId: number | null;
  status: string;
  joinDate: string;
  branchId: number | null;
  branchName: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500/10 text-green-600 border-green-200/50 hover:bg-green-500/20 px-3 py-1 rounded-lg">نشط</Badge>;
    case 'inactive':
      return <Badge className="bg-slate-500/10 text-slate-600 border-slate-200/50 hover:bg-slate-500/20 px-3 py-1 rounded-lg">غير نشط</Badge>;
    case 'suspended':
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200/50 hover:bg-amber-500/20 px-3 py-1 rounded-lg">موقوف مؤقتاً</Badge>;
    case 'on_leave':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/50 hover:bg-blue-500/20 px-3 py-1 rounded-lg">في إجازة</Badge>;
    case 'terminated':
      return <Badge className="bg-red-500/10 text-red-600 border-red-200/50 hover:bg-red-500/20 px-3 py-1 rounded-lg">منتهي الخدمة</Badge>;
    case 'incomplete':
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200/50 hover:bg-orange-500/20 px-3 py-1 rounded-lg">غير مكتمل</Badge>;
    default:
      return <Badge variant="outline" className="px-3 py-1 rounded-lg">{status}</Badge>;
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
  const { user } = useAuth();
  const isSystemOwner = ['owner', 'admin', 'system_admin'].includes((user?.role as string)?.toLowerCase() || '');
  const canEdit = userRole === "admin" || String(userRole).includes("manager");
  const canDelete = userRole === "admin" || isSystemOwner;

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
  const { selectedBranchId, currentBranch, currentEmployee, selectedRole, branches } = useAppContext();

  // Non-admin roles must have a branch selected before fetching data
  const isAdminOrGM = selectedRole === 'admin' || selectedRole === 'general_manager';
  const branchReady = isAdminOrGM || selectedBranchId !== null;

  // For generic department managers: also filter by their own department
  // Specialist managers (hr_manager, legal_manager, etc.) can see all employees in their branch
  const isGenericDeptManager = selectedRole === 'department_manager';
  const deptManagerDeptId = isGenericDeptManager && currentEmployee?.department?.id
    ? currentEmployee.department.id : null;

  // Fetch data using hrService hooks - filter by branchId (company context) and optionally departmentId
  // Don't fetch until branch is set for non-admin roles
  const { data: employeesData, isLoading: loading, isError } = useEmployees({
    branchId: selectedBranchId,
    departmentId: deptManagerDeptId,
    enabled: branchReady,
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
  const employees: Employee[] = (employeesData || []).map((emp: any) => {
    const branchId = typeof emp.branch === 'object' ? emp.branch?.id : emp.branchId;
    const branchName = branches.find(b => b.id === branchId)?.name || (typeof emp.branch === 'object' ? emp.branch?.name : '') || '';
    return {
      id: String(emp.id),
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      firstNameAr: emp.firstNameAr || emp.firstName || '',
      lastNameAr: emp.lastNameAr || emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      jobTitle: emp.jobTitle || '',
      position: (typeof emp.position === 'object' ? emp.position?.title : emp.position) || '',
      positionId: (typeof emp.position === 'object' ? emp.position?.id : null),
      department: (typeof emp.department === 'object' ? (emp.department?.nameAr || emp.department?.name) : emp.department) || '',
      departmentId: (typeof emp.department === 'object' ? emp.department?.id : null),
      status: emp.status || 'active',
      joinDate: emp.hireDate ? new Date(emp.hireDate).toISOString() : (emp.createdAt ? new Date(emp.createdAt).toISOString() : ''),
      branchId,
      branchName,
    };
  });

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

  // إظهار عمود الفرع فقط في الوضع الشامل (جميع الفروع)
  const isGlobalView = selectedBranchId === null;

  // تعريف الأعمدة داخل المكون للوصول إلى الدوال
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'firstName',
      header: 'الموظف',
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-semibold whitespace-nowrap">
            {(row.original.firstNameAr && row.original.lastNameAr)
              ? `${row.original.firstNameAr} ${row.original.lastNameAr}`
              : `${row.original.firstName} ${row.original.lastName}`}
          </p>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">{row.original.email}</p>
          {row.original.phone && (
            <p className="text-xs text-gray-400">{row.original.phone}</p>
          )}
        </div>
      ),
    },
    ...(isGlobalView ? [{
      accessorKey: 'branchName',
      header: 'الفرع',
      cell: ({ row }: any) => (
        <span className="whitespace-nowrap text-sm px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(41,128,185,0.1)', color: '#2980B9' }}>
          {row.original.branchName || '-'}
        </span>
      ),
    }] : []),
    {
      accessorKey: 'department',
      header: 'القسم',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.department || '-'}</span>
      ),
    },
    {
      accessorKey: 'position',
      header: 'المسمى الوظيفي',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.position || row.original.jobTitle || '-'}</span>
      ),
    },
    {
      accessorKey: 'joinDate',
      header: 'تاريخ الانضمام',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-gray-600">{formatDate(row.original.joinDate)}</span>
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
    <div className="space-y-6 min-h-screen bg-slate-50/50 -m-4 p-4 md:-m-8 md:p-8" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/50 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20">
              <Users className="h-5 w-5 text-[#C9A84C]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">الموارد البشرية</h2>
          </div>
          <p className="text-slate-500 text-sm">إدارة شاملة للموظفين والموارد البشرية في المؤسسة</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link href="/hr/employees/add" className="flex-1 md:flex-none">
            <Button className="w-full gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white border border-slate-700/50 shadow-md">
              <Plus className="h-4 w-4" />
              إضافة سريعة
            </Button>
          </Link>
          <Link href="/hr/employees/add-full" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full gap-2 border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10">
              <Plus className="h-4 w-4" />
              إضافة شاملة
            </Button>
          </Link>
        </div>
      </div>

      {/* فلتر الفرع النشط */}
      {selectedBranchId && (
        <Alert className="bg-[#C9A84C]/5 border-[#C9A84C]/20 rounded-2xl shadow-sm overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A84C]" />
          <Filter className="h-4 w-4 text-[#C9A84C]" />
          <AlertDescription className="text-slate-700 font-medium">
            يتم عرض موظفي <strong className="text-[#C9A84C]">{branchName}</strong> فقط. لعرض جميع الموظفين، اختر "جميع الفروع" من القائمة العلوية.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Links to Sub-modules */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {hrModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="group cursor-pointer bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-slate-700/50 shadow-lg hover:shadow-[#C9A84C]/20 transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9A84C] opacity-5 blur-[40px] group-hover:opacity-10 transition-opacity" />
              <CardContent className="p-5 flex flex-col items-center justify-center text-center relative z-10">
                <div className="p-3 rounded-xl mb-3 bg-[#C9A84C]/10 border border-[#C9A84C]/20 shadow-inner group-hover:scale-110 transition-transform">
                  <module.icon className="h-6 w-6 text-[#C9A84C]" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">{module.title}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#0f172a] p-1.5 rounded-2xl border border-slate-700/50 flex w-full overflow-x-auto scrollbar-none shadow-xl">
          <TabsTrigger value="employees" className="flex-shrink-0 rounded-xl py-2.5 px-6 text-slate-400 hover:text-white transition-all data-[state=active]:bg-[#C9A84C] data-[state=active]:text-white">
            قائمة الموظفين
            <Badge className="ms-2 bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30 text-[10px] px-1.5 h-4">
              {employees.filter(e => e.status === 'active' || e.status === 'incomplete').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="suspended" className="flex-shrink-0 rounded-xl py-2.5 px-6 text-slate-400 hover:text-white transition-all data-[state=active]:bg-[#C9A84C] data-[state=active]:text-white">
            موقوفون مؤقتاً
            <Badge className="ms-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 h-4">
              {employees.filter(e => e.status === 'suspended').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex-shrink-0 rounded-xl py-2.5 px-6 text-slate-400 hover:text-white transition-all data-[state=active]:bg-[#C9A84C] data-[state=active]:text-white">
            مؤرشفون
            <Badge className="ms-2 bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 h-4">
              {employees.filter(e => e.status === 'inactive').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="terminated" className="flex-shrink-0 rounded-xl py-2.5 px-6 text-slate-400 hover:text-white transition-all data-[state=active]:bg-[#C9A84C] data-[state=active]:text-white">
            منتهية خدماتهم
            <Badge className="ms-2 bg-slate-500/20 text-slate-400 border-slate-500/30 text-[10px] px-1.5 h-4">
              {employees.filter(e => e.status === 'terminated').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex-shrink-0 rounded-xl py-2.5 px-6 text-slate-400 hover:text-white transition-all data-[state=active]:bg-[#C9A84C] data-[state=active]:text-white">
            الأقسام
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex-shrink-0 rounded-xl py-2.5 px-6 text-slate-400 hover:text-white transition-all data-[state=active]:bg-[#C9A84C] data-[state=active]:text-white">
            المناصب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <Card className="bg-white/70 backdrop-blur-md rounded-2xl border-slate-200/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100/50 bg-slate-50/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                    {selectedBranchId ? (
                      <>
                        <Building2 className="h-5 w-5 text-[#C9A84C]" />
                        موظفو {branchName}
                      </>
                    ) : (
                      <>
                        <Users className="h-5 w-5 text-[#C9A84C]" />
                        الموظفون النشطون
                      </>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    {loading ? 'جاري التحميل...' : `${employees.filter(e => e.status === 'active').length} موظف نشط` + (employees.filter(e => e.status === 'incomplete').length > 0 ? ` · ${employees.filter(e => e.status === 'incomplete').length} غير مكتمل` : '')}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
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
          <Card className="bg-white/70 backdrop-blur-md rounded-2xl border-slate-200/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100/50 bg-slate-50/30">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <PauseCircle className="h-5 w-5 text-[#C9A84C]" />
                الموظفون الموقوفون مؤقتاً
              </CardTitle>
              <CardDescription className="text-slate-500">
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
          <Card className="bg-white/70 backdrop-blur-md rounded-2xl border-slate-200/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100/50 bg-slate-50/30">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Archive className="h-5 w-5 text-[#C9A84C]" />
                الموظفون المؤرشفون
              </CardTitle>
              <CardDescription className="text-slate-500">
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
          <Card className="bg-white/70 backdrop-blur-md rounded-2xl border-slate-200/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100/50 bg-slate-50/30">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <XCircle className="h-5 w-5 text-[#C9A84C]" />
                الموظفون المنتهية خدماتهم
              </CardTitle>
              <CardDescription className="text-slate-500">
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
          <Card className="bg-white/70 backdrop-blur-md rounded-2xl border-slate-200/50 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/50 bg-slate-50/30">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                  <Building2 className="h-5 w-5 text-[#C9A84C]" />
                  الأقسام
                </CardTitle>
                <CardDescription className="text-slate-500">قائمة الأقسام في المنظمة</CardDescription>
              </div>
              <Link href="/hr/organization">
                <Button variant="outline" size="sm" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10">
                  <Plus className="h-4 w-4 ms-2" />
                  إضافة قسم
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {departmentsData && departmentsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departmentsData.map((dept: any) => (
                    <div key={dept.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl border-r-4 border-r-[#C9A84C] shadow-sm hover:shadow-md hover:border-[#C9A84C]/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C] opacity-[0.03] blur-[50px] pointer-events-none" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-[#C9A84C]/10 group-hover:text-[#C9A84C] transition-colors">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-slate-900 text-lg">{dept.nameAr || dept.name}</p>
                          <div className="flex gap-2 items-center">
                            <Badge className={`${dept.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-200/50' : 'bg-slate-500/10 text-slate-600 border-slate-200/50'} text-[10px] px-2 h-5 rounded-md shadow-none`}>
                              {dept.status === 'active' ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDept(dept.id)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 border-[#C9A84C]/50 text-[#C9A84C] hover:bg-[#C9A84C]/10 py-0">
                              <UserPlus className="h-3.5 w-3.5" />
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
          <Card className="bg-white/70 backdrop-blur-md rounded-2xl border-slate-200/50 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/50 bg-slate-50/30">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                  <Award className="h-5 w-5 text-[#C9A84C]" />
                  المناصب الوظيفية
                </CardTitle>
                <CardDescription className="text-slate-500">قائمة المناصب الوظيفية</CardDescription>
              </div>
              <Link href="/settings/hr/positions">
                <Button variant="outline" size="sm" className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10">
                  <Plus className="h-4 w-4 ms-2" />
                  إضافة منصب
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {positionsData && positionsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positionsData.map((pos: any) => (
                    <div key={pos.id} className="flex flex-col justify-between p-5 bg-white border border-slate-200 rounded-2xl border-r-4 border-r-[#C9A84C] shadow-sm hover:shadow-md hover:border-[#C9A84C]/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C] opacity-[0.03] blur-[50px] pointer-events-none" />
                      <div className="relative z-10">
                        <p className="font-bold text-slate-900 text-lg">{pos.title}</p>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{pos.description || 'لا يوجد وصف متاح لهذا المنصب الوظيفي حالياً.'}</p>
                      </div>
                      <div className="flex items-center justify-between mt-6 relative z-10">
                        <Badge className={`${pos.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-200/50' : 'bg-slate-500/10 text-slate-600 border-slate-200/50'} text-[10px] px-2 h-5 rounded-md shadow-none`}>
                          {pos.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePos(pos.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
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
      {editOpen && (<div className="mt-6 p-6 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="p-1.5 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20">
              <Edit className="h-5 w-5 text-[#C9A84C]" />
            </div>
            تعديل بيانات الموظف
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            تعديل بيانات الموظف <strong className="text-slate-900">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>
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

        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 justify-end">
          <Button variant="ghost" onClick={() => { setEditOpen(false); resetEditForm(); }} className="text-slate-500 hover:bg-slate-100">
            إلغاء
          </Button>
          <Button
            onClick={handleUpdateEmployee}
            disabled={!editFirstName || !editLastName || !editEmail || updateEmployeeMutation.isPending}
            className="bg-[#C9A84C] hover:bg-[#B69542] text-white shadow-md px-8"
          >
            {updateEmployeeMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </Button>
        </div>

      </div>)}


      {/* نافذة إيقاف الموظف مؤقتاً */}
      {suspendOpen && (<div className="mt-8 p-6 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <PauseCircle className="h-5 w-5 text-amber-600" />
            </div>
            إيقاف الموظف مؤقتاً
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            هل أنت متأكد من إيقاف الموظف <strong className="text-slate-900">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> مؤقتاً؟
          </p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 my-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>تنبيه:</strong> سيتم إيقاف حساب الموظف مؤقتاً ولن يتمكن من الوصول إلى النظام حتى يتم إعادة تنشيطه يدوياً.
          </p>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 justify-end">
          <Button variant="ghost" onClick={() => { setSuspendOpen(false); setSelectedEmployee(null); }} className="text-slate-500 hover:bg-slate-100">
            إلغاء
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-md px-8"
            onClick={handleSuspendEmployee}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            تأكيد الإيقاف
          </Button>
        </div>
      </div>)}


      {/* نافذة إنهاء خدمة الموظف */}
      {terminationOpen && (<div className="mt-8 p-6 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            إنهاء خدمة الموظف
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            سيتم إنهاء خدمة الموظف <strong className="text-slate-900">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> وتعطيل حسابه نهائياً.
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

          <div className="bg-red-50/50 border border-red-200/50 rounded-xl p-4 mt-6 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800 leading-relaxed">
              <strong>تنبيه:</strong> سيتم تعطيل حساب الموظف في النظام ولن يتمكن من تسجيل الدخول نهائياً.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 justify-end">
          <Button variant="ghost" onClick={() => { setTerminationOpen(false); resetTerminationForm(); }} className="text-slate-500 hover:bg-slate-100">
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleTerminateEmployee}
            disabled={!terminationType || !terminationReason || statusMutation.isPending}
            className="shadow-md px-8"
          >
            {statusMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            تأكيد إنهاء الخدمة
          </Button>
        </div>
      </div>)}

      {/* نافذة حذف الموظف */}
      {deleteOpen && (<div className="mt-8 p-6 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            حذف الموظف نهائياً
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            هل أنت متأكد من حذف الموظف <strong className="text-slate-900">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong>؟
          </p>
        </div>

        <div className="bg-red-50/50 border border-red-200/50 rounded-xl p-4 my-6 flex gap-3 font-medium">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 leading-relaxed">
            <strong>تحذير:</strong> سيتم حذف كافة بيانات الموظف نهائياً. هذا الإجراء <strong>لا يمكن التراجع عنه</strong>.
          </p>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 justify-end">
          <Button variant="ghost" onClick={() => { setDeleteOpen(false); setSelectedEmployee(null); }} className="text-slate-500 hover:bg-slate-100">
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteEmployee}
            disabled={deleteEmployeeMutation.isPending}
            className="shadow-md px-8"
          >
            {deleteEmployeeMutation.isPending && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            تأكيد الحذف النهائي
          </Button>
        </div>
      </div>)}
    </div>
  );
}
