import { useAppContext } from '@/contexts/AppContext';
import { useEmployees, useDepartments } from '@/services/hrService';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Eye, Building2 } from 'lucide-react';
import { Link } from 'wouter';

const getRoleArabic = (role: string) => {
  switch (role?.toUpperCase()) {
    case 'OWNER': return 'مالك';
    case 'GENERAL_MANAGER': return 'مدير عام';
    case 'DEPARTEMENT_MANAGER': return 'مدير قسم';
    case 'SUPERVISOR': return 'مشرف';
    case 'EMPLOYEE': return 'موظف';
    case 'AGENT': return 'مندوب';
    default: return role || '-';
  }
};

const getStatusArabic = (status: string) => {
  switch (status) {
    case 'active': return 'نشط';
    case 'inactive': return 'غير نشط';
    case 'terminated': return 'منتهي';
    case 'on_leave': return 'في إجازة';
    case 'suspended': return 'موقوف';
    default: return status || '-';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'inactive': return 'bg-gray-100 text-gray-700';
    case 'terminated': return 'bg-red-100 text-red-700';
    case 'on_leave': return 'bg-amber-100 text-amber-700';
    case 'suspended': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function DepartmentEmployees() {
  const { currentUserId } = useAppContext();
  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();

  // Find current employee (the manager)
  const currentEmployee = employees.find((emp: any) =>
    emp.userId === currentUserId || emp.user?.id === currentUserId
  );

  const currentDeptId = typeof currentEmployee?.department === 'object'
    ? currentEmployee?.department?.id
    : currentEmployee?.departmentId;

  const currentDept = typeof currentEmployee?.department === 'object'
    ? currentEmployee?.department
    : departments.find((d: any) => d.id === currentDeptId);

  const deptName = currentDept?.nameAr || currentDept?.name || 'القسم';

  // Filter employees in the same department
  const deptEmployees = employees.filter((emp: any) => {
    const empDeptId = typeof emp.department === 'object' ? emp.department?.id : emp.departmentId;
    return empDeptId && empDeptId === currentDeptId;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">موظفي {deptName}</h1>
            <p className="text-sm text-gray-500">عدد الموظفين: {deptEmployees.length}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1">
          {deptEmployees.length} موظف
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {deptEmployees.filter((e: any) => e.status === 'active').length}
            </p>
            <p className="text-sm text-gray-500">نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {deptEmployees.filter((e: any) => e.status === 'on_leave').length}
            </p>
            <p className="text-sm text-gray-500">في إجازة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">
              {deptEmployees.filter((e: any) => e.status === 'inactive').length}
            </p>
            <p className="text-sm text-gray-500">غير نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {deptEmployees.filter((e: any) => e.status === 'suspended' || e.status === 'terminated').length}
            </p>
            <p className="text-sm text-gray-500">موقوف / منتهي</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            قائمة الموظفين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deptEmployees.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              لا يوجد موظفين في هذا القسم
            </div>
          ) : (
            <div className="divide-y">
              {deptEmployees.map((emp: any) => {
                const role = emp.userRole || emp.user?.role || emp.role || '';
                const position = typeof emp.position === 'object' ? (emp.position?.nameAr || emp.position?.name) : emp.position;
                return (
                  <div key={emp.id} className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {(emp.firstName || '?')[0]}{(emp.lastName || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{emp.employeeNumber}</span>
                          {position && <><span>•</span><span>{position}</span></>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {getRoleArabic(role)}
                        </Badge>
                        <Badge className={`text-xs block ${getStatusColor(emp.status)}`}>
                          {getStatusArabic(emp.status)}
                        </Badge>
                      </div>
                      <Link href={`/hr/employees/${emp.id}`}>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="عرض الملف">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
