import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Printer, FileSpreadsheet, Users, XCircle, Timer, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useUser } from '@/services/authService';
import { useEmployees, useAttendance } from '@/services/hrService';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import * as XLSX from 'xlsx';

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  totalLateMinutes: number;
  totalEarlyLeaveMinutes: number;
  totalWorkHours: number;
  attendanceRate: number;
}

interface EmployeeAttendanceReport {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  stats: AttendanceStats;
}

export default function AttendanceReports() {
  const { data: currentUser, isError, error } = useUser();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'hr_manager';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { selectedBranchId, branches } = useAppContext();
  const selectedBranch = branches?.find(b => b.id === selectedBranchId);
  const printRef = useRef<HTMLDivElement>(null);

  // الفلاتر
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // جلب الموظفين
  const { data: employeesData } = useEmployees();

  // جلب الأقسام - استخدام قائمة فريدة من الموظفين
  const departmentsData = useMemo(() => {
    if (!employeesData) return [];
    const depts = new Set<string>();
    employeesData.forEach((emp: any) => {
      const deptName = typeof emp.department === 'object' ? emp.department?.name : emp.department;
      if (deptName) depts.add(deptName);
    });
    return Array.from(depts).map((d, i) => ({ id: i + 1, name: d }));
  }, [employeesData]);

  // جلب سجلات الحضور للشهر المحدد
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  const { data: attendanceData, isLoading } = useAttendance();

  // حساب الإحصائيات لكل موظف
  const employeeReports = useMemo(() => {
    if (!employeesData || !attendanceData) return [];

    const reports: EmployeeAttendanceReport[] = [];
    const workDaysInMonth = endDate.getDate(); // عدد أيام الشهر

    for (const employee of employeesData) {
      const deptName = typeof employee.department === 'object' ? employee.department?.name : employee.department;

      // فلترة حسب الموظف المحدد
      if (selectedEmployee !== 'all' && employee.id !== parseInt(selectedEmployee)) continue;

      // فلترة حسب القسم
      if (selectedDepartment !== 'all' && deptName !== selectedDepartment) continue;

      const employeeAttendance = attendanceData.filter((a: any) => a.employeeId === employee.id);

      let presentDays = 0;
      let lateDays = 0;
      let earlyLeaveDays = 0;
      let totalLateMinutes = 0;
      let totalEarlyLeaveMinutes = 0;
      let totalWorkHours = 0;

      for (const record of employeeAttendance) {
        if (record.status === 'present' || record.status === 'late' || record.status === 'early_leave' || record.status === 'checked_in') {
          presentDays++;
        }
        if (record.status === 'late') {
          lateDays++;
          // حساب دقائق التأخير (افتراض وقت البدء 8:00)
          if (record.checkIn) {
            const checkIn = new Date(record.checkIn);
            const expectedStart = new Date(checkIn);
            expectedStart.setHours(8, 0, 0, 0);
            if (checkIn > expectedStart) {
              totalLateMinutes += Math.floor((checkIn.getTime() - expectedStart.getTime()) / 60000);
            }
          }
        }
        if (record.status === 'early_leave') {
          earlyLeaveDays++;
          // حساب دقائق الخروج المبكر (افتراض وقت الانتهاء 17:00)
          if (record.checkOut) {
            const checkOut = new Date(record.checkOut);
            const expectedEnd = new Date(checkOut);
            expectedEnd.setHours(17, 0, 0, 0);
            if (checkOut < expectedEnd) {
              totalEarlyLeaveMinutes += Math.floor((expectedEnd.getTime() - checkOut.getTime()) / 60000);
            }
          }
        }
        if (record.workHours) {
          totalWorkHours += parseFloat(record.workHours);
        }
      }

      const absentDays = workDaysInMonth - presentDays;
      const attendanceRate = workDaysInMonth > 0 ? (presentDays / workDaysInMonth) * 100 : 0;

      reports.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email || '',
        employeeCode: employee.employeeNumber || '',
        department: deptName || '',
        stats: {
          totalDays: workDaysInMonth,
          presentDays,
          absentDays,
          lateDays,
          earlyLeaveDays,
          totalLateMinutes,
          totalEarlyLeaveMinutes,
          totalWorkHours,
          attendanceRate,
        },
      });
    }

    return reports;
  }, [employeesData, attendanceData, selectedEmployee, selectedDepartment, endDate]);

  // الإحصائيات الإجمالية
  const totalStats = useMemo(() => {
    if (employeeReports.length === 0) return null;

    return {
      totalEmployees: employeeReports.length,
      avgAttendanceRate: employeeReports.reduce((sum, r) => sum + r.stats.attendanceRate, 0) / employeeReports.length,
      totalLateDays: employeeReports.reduce((sum, r) => sum + r.stats.lateDays, 0),
      totalAbsentDays: employeeReports.reduce((sum, r) => sum + r.stats.absentDays, 0),
      totalLateMinutes: employeeReports.reduce((sum, r) => sum + r.stats.totalLateMinutes, 0),
      totalWorkHours: employeeReports.reduce((sum, r) => sum + r.stats.totalWorkHours, 0),
    };
  }, [employeeReports]);

  // تصدير Excel
  const handleExportExcel = () => {
    const data = employeeReports.map(r => ({
      'كود الموظف': r.employeeCode,
      'اسم الموظف': r.employeeName,
      'القسم': r.department,
      'أيام العمل': r.stats.totalDays,
      'أيام الحضور': r.stats.presentDays,
      'أيام الغياب': r.stats.absentDays,
      'أيام التأخير': r.stats.lateDays,
      'أيام الخروج المبكر': r.stats.earlyLeaveDays,
      'دقائق التأخير': r.stats.totalLateMinutes,
      'دقائق الخروج المبكر': r.stats.totalEarlyLeaveMinutes,
      'ساعات العمل': r.stats.totalWorkHours.toFixed(1),
      'نسبة الحضور %': r.stats.attendanceRate.toFixed(1),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الحضور');

    const monthName = formatDate(selectedYear, selectedMonth - 1);
    XLSX.writeFile(wb, `تقرير_الحضور_${monthName}.xlsx`);
    toast.success('تم تصدير التقرير بنجاح');
  };

  // طباعة التقرير
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const monthName = formatDate(selectedYear, selectedMonth - 1);
    const reportNumber = `ATT-${selectedYear}${String(selectedMonth).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الحضور الشهري - ${monthName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', sans-serif;
            padding: 20px;
            direction: rtl;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo { height: 60px; }
          .title { text-align: center; flex: 1; }
          .title h1 { font-size: 18px; margin-bottom: 5px; }
          .title h2 { font-size: 14px; color: #666; }
          .meta { font-size: 12px; text-align: left; }
          .meta p { margin: 2px 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
          }
          th { background: #f0f0f0; font-weight: 600; }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .summary-card {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
            border-radius: 5px;
          }
          .summary-card h3 { font-size: 12px; color: #666; }
          .summary-card p { font-size: 18px; font-weight: 700; }
          .footer {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .signature { text-align: center; }
          .signature-line {
            width: 150px;
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
          }
          .barcode { font-family: monospace; font-size: 10px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${(selectedBranch as any)?.logo ? `<img src="${(selectedBranch as any).logo}" class="logo" alt="شعار الفرع">` : '<div></div>'}
          <div class="title">
            <h1>تقرير الحضور الشهري</h1>
            <h2>${monthName}</h2>
          </div>
          <div class="meta">
            <p><strong>رقم التقرير:</strong> ${reportNumber}</p>
            <p><strong>الفرع:</strong> ${(selectedBranch as any)?.nameAr || selectedBranch?.name || 'جميع الفروع'}</p>
            <p><strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        ${totalStats ? `
        <div class="summary">
          <div class="summary-card">
            <h3>عدد الموظفين</h3>
            <p>${totalStats.totalEmployees}</p>
          </div>
          <div class="summary-card">
            <h3>متوسط نسبة الحضور</h3>
            <p>${totalStats.avgAttendanceRate.toFixed(1)}%</p>
          </div>
          <div class="summary-card">
            <h3>إجمالي أيام التأخير</h3>
            <p>${totalStats.totalLateDays}</p>
          </div>
          <div class="summary-card">
            <h3>إجمالي أيام الغياب</h3>
            <p>${totalStats.totalAbsentDays}</p>
          </div>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>كود الموظف</th>
              <th>اسم الموظف</th>
              <th>القسم</th>
              <th>أيام الحضور</th>
              <th>أيام الغياب</th>
              <th>أيام التأخير</th>
              <th>دقائق التأخير</th>
              <th>ساعات العمل</th>
              <th>نسبة الحضور</th>
            </tr>
          </thead>
          <tbody>
            ${employeeReports.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.employeeCode}</td>
                <td>${r.employeeName}</td>
                <td>${r.department}</td>
                <td>${r.stats.presentDays}</td>
                <td>${r.stats.absentDays}</td>
                <td>${r.stats.lateDays}</td>
                <td>${r.stats.totalLateMinutes}</td>
                <td>${r.stats.totalWorkHours.toFixed(1)}</td>
                <td>${r.stats.attendanceRate.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature">
            <div class="signature-line">مدير الموارد البشرية</div>
          </div>
          <div class="barcode">
            <p>رقم المرجع: ${reportNumber}</p>
          </div>
          <div class="signature">
            <div class="signature-line">المدير العام</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);


  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{(error as any)?.message}</p>
    </div>
  );

  return (
    <div className="space-y-6" ref={printRef}>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="بحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">&#10005;</button>}
      </div>
      {/* العنوان والأزرار */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">تقارير الحضور الشهرية</h2>
          <p className="text-muted-foreground">عرض وتصدير تقارير الحضور والانصراف</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 ms-2" />
            طباعة
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 ms-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            فلترة التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>الشهر</Label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>السنة</Label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الموظف</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الموظفين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {employeesData?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.nameAr || emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {departmentsData?.map((dept: any) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.nameAr || dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات الإجمالية */}
      {totalStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">عدد الموظفين</p>
                <h3 className="text-2xl font-bold mt-1">{totalStats.totalEmployees}</h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط نسبة الحضور</p>
                <h3 className="text-2xl font-bold mt-1">{totalStats.avgAttendanceRate.toFixed(1)}%</h3>
              </div>
              <div className={`p-3 rounded-xl ${totalStats.avgAttendanceRate >= 90 ? 'bg-green-50' : totalStats.avgAttendanceRate >= 75 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                {totalStats.avgAttendanceRate >= 90 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي أيام التأخير</p>
                <h3 className="text-2xl font-bold mt-1">{totalStats.totalLateDays}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <Timer className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي أيام الغياب</p>
                <h3 className="text-2xl font-bold mt-1">{totalStats.totalAbsentDays}</h3>
              </div>
              <div className="p-3 rounded-xl bg-red-50">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* جدول التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            تفاصيل الحضور
          </CardTitle>
          <CardDescription>
            تقرير الحضور لشهر {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : employeeReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد بيانات للفترة المحددة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-end font-medium">#</th>
                    <th className="p-3 text-end font-medium">كود الموظف</th>
                    <th className="p-3 text-end font-medium">اسم الموظف</th>
                    <th className="p-3 text-end font-medium">القسم</th>
                    <th className="p-3 text-center font-medium">أيام الحضور</th>
                    <th className="p-3 text-center font-medium">أيام الغياب</th>
                    <th className="p-3 text-center font-medium">أيام التأخير</th>
                    <th className="p-3 text-center font-medium">دقائق التأخير</th>
                    <th className="p-3 text-center font-medium">ساعات العمل</th>
                    <th className="p-3 text-center font-medium">نسبة الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeReports.map((report, index) => (
                    <tr key={report.employeeId} className="border-b hover:bg-muted/30">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{report.employeeCode}</td>
                      <td className="p-3 font-medium">{report.employeeName}</td>
                      <td className="p-3">{report.department}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {report.stats.presentDays}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={report.stats.absentDays > 0 ? "bg-red-50 text-red-700" : ""}>
                          {report.stats.absentDays}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={report.stats.lateDays > 0 ? "bg-amber-50 text-amber-700" : ""}>
                          {report.stats.lateDays}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">{report.stats.totalLateMinutes}</td>
                      <td className="p-3 text-center">{report.stats.totalWorkHours.toFixed(1)}</td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="outline"
                          className={
                            report.stats.attendanceRate >= 90 ? "bg-green-50 text-green-700" :
                              report.stats.attendanceRate >= 75 ? "bg-yellow-50 text-yellow-700" :
                                "bg-red-50 text-red-700"
                          }
                        >
                          {report.stats.attendanceRate.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
