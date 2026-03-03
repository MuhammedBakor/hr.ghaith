import React from "react";
import { useState } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Plus,
  Users,
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from "@/components/ui/dialog";
import {
  useDepartments,
  useCreateDepartment,
  useEmployees
} from "@/services/hrService";

interface Department {
  id: number;
  name: string;
  managerId?: number | null;
  parentId?: number | null;
  employeeCount?: number;
  children?: Department[];
  expanded?: boolean;
}

type ViewMode = "list" | "add-department";

export default function Organization() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([1]));
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [newDeptName, setNewDeptName] = useState('');

  const queryClient = useQueryClient();

  // جلب الأقسام
  const { data: departmentsData, isLoading, isError } = useDepartments();

  // جلب الموظفين للإحصائيات
  const { data: employeesData } = useEmployees();

  // إنشاء قسم جديد
  const createDeptMutation = useCreateDepartment();

  const handleCreateDept = () => {
    createDeptMutation.mutate(
      { name: newDeptName, nameAr: newDeptName, code: `DEPT-${Date.now()}`, branchId: 1 },
      {
        onSuccess: () => {
          toast.success('تم إضافة القسم بنجاح');
          queryClient.invalidateQueries({ queryKey: ['departments'] });
          setViewMode("list");
          setNewDeptName('');
        },
        onError: (error: any) => {
          toast.error('فشل في إضافة القسم: ' + error.message);
        },
      }
    );
  };

  // تحويل البيانات المسطحة إلى شجرة
  const buildTree = (depts: Department[]): Department[] => {
    const map = new Map<number, Department>();
    const roots: Department[] = [];

    depts.forEach(dept => {
      map.set(dept.id, { ...dept, children: [], employeeCount: 0 });
    });

    // حساب عدد الموظفين لكل قسم
    if (employeesData) {
      employeesData.forEach((emp: { departmentId?: number | null;[key: string]: unknown }) => {
        if (emp.departmentId && map.has(emp.departmentId)) {
          const dept = map.get(emp.departmentId)!;
          dept.employeeCount = (dept.employeeCount || 0) + 1;
        }
      });
    }

    map.forEach(dept => {
      if (dept.parentId && map.has(dept.parentId)) {
        map.get(dept.parentId)!.children!.push(dept);
      } else {
        roots.push(dept);
      }
    });

    return roots;
  };

  const departments = departmentsData ? buildTree(departmentsData as Department[]) : [];
  const employees = employeesData || [];

  // حساب الإحصائيات
  const stats = {
    totalDepartments: departmentsData?.length || 0,
    totalEmployees: employees.length,
    totalManagers: departmentsData?.filter((d: Department) => d.managerId).length || 0,
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const DepartmentNode = ({ dept, level = 0 }: { dept: Department; level?: number }) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expandedIds.has(dept.id);


    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;


    return (
      <div className="relative">
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
          className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer ${level > 0 ? 'me-8' : ''}`}
          onClick={() => hasChildren && toggleExpand(dept.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}

          <div className="p-2 rounded-full bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1">
            <p className="font-medium">{dept.name}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {dept.managerId ? `مدير #${dept.managerId}` : 'بدون مدير'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {dept.employeeCount || 0} موظف
              </span>
            </div>
          </div>

          <Badge variant="outline">{dept.employeeCount || 0}</Badge>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 border-r-2 border-dashed border-muted me-4 pe-4">
            {dept.children!.map(child => (
              <DepartmentNode key={child.id} dept={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Add Department Form (in same page)
  const renderAddDepartmentForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setViewMode("list")}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إضافة قسم جديد</h2>
          <p className="text-muted-foreground">أدخل بيانات القسم الجديد</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات القسم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>اسم القسم *</Label>
              <Input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="مثال: قسم التطوير"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewMode("list")}>إلغاء</Button>
              <Button
                onClick={handleCreateDept}
                disabled={!newDeptName || createDeptMutation.isPending}
              >
                {createDeptMutation.isPending ? 'جاري الإضافة...' : 'إضافة القسم'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الهيكل التنظيمي</h2>
          <p className="text-gray-500">هيكل الأقسام والإدارات في المنظمة</p>
        </div>
        <Button className="gap-2" onClick={() => setViewMode("add-department")}>
          <Plus className="h-4 w-4" />
          إضافة قسم
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الأقسام</p>
              <p className="text-2xl font-bold">{stats.totalDepartments}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-50">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المديرون</p>
              <p className="text-2xl font-bold">{stats.totalManagers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            شجرة الهيكل التنظيمي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد أقسام. أضف قسماً جديداً للبدء.
            </div>
          ) : (
            <div className="space-y-2">
              {departments?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map(dept => (
                <DepartmentNode key={dept.id} dept={dept} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      {dialogOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">{editItem ? "تعديل" : "إضافة جديد"}</h3>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم / الوصف</label>
              <input className="w-full border rounded-md px-3 py-2" placeholder="أدخل البيانات..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => { setDialogOpen(false); }}>حفظ</Button>
          </div>
        </div>
      </div>)}
    </div>
  );

  // Main render
  switch (viewMode) {
    case "add-department":
      return renderAddDepartmentForm();
    default:
      return renderListView();
  }
}
