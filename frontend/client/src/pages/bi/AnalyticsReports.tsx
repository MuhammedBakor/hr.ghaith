import React from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, BarChart3, Users, FolderKanban, Receipt, Workflow, FileSpreadsheet, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AnalyticsReports() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const handleExport = () => {
    const rows = document.querySelectorAll('table tr');
    if (!rows.length) return;
    let csv = '\uFEFF';
    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      csv += Array.from(cells).map(c => (c.textContent || '').trim()).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'report.csv';
    link.click();
  };

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['bi', 'dashboardStats'],
    queryFn: () => api.get('/bi/dashboard-stats').then(r => r.data),
  });
  const [isExporting, setIsExporting] = useState(false);
  
  const stats = dashboardData || { projects: 0, users: 0, invoices: 0, workflows: 0 };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const csvContent = [
        ['التقرير التحليلي - نظام غيث'],
        ['تاريخ التصدير', new Date().toLocaleDateString('ar-SA')],
        [''],
        ['المؤشر', 'القيمة'],
        ['المشاريع', stats.projects.toString()],
        ['المستخدمين', stats.users.toString()],
        ['الفواتير', stats.invoices.toString()],
        ['سير العمل', stats.workflows.toString()],
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير_تحليلي_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const jsonContent = JSON.stringify({
        title: 'التقرير التحليلي - نظام غيث',
        exportDate: new Date().toISOString(),
        data: {
          projects: stats.projects,
          users: stats.users,
          invoices: stats.invoices,
          workflows: stats.workflows,
        }
      }, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير_تحليلي_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('تم تصدير التقرير بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  const printReport = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>التقرير التحليلي - نظام غيث</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            th { background-color: #f3f4f6; }
            .footer { margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>التقرير التحليلي - نظام غيث</h1>
          <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
          <table>
            <thead>
              <tr><th>المؤشر</th><th>القيمة</th></tr>
            </thead>
            <tbody>
              <tr><td>المشاريع</td><td>${stats.projects}</td></tr>
              <tr><td>المستخدمين</td><td>${stats.users}</td></tr>
              <tr><td>الفواتير</td><td>${stats.invoices}</td></tr>
              <tr><td>سير العمل</td><td>${stats.workflows}</td></tr>
            </tbody>
          </table>
          <div class="footer">تم إنشاء هذا التقرير بواسطة نظام غيث
        <button onClick={handleExport} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100">تصدير CSV</button>
      </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">التقارير التحليلية</h2>
          <p className="text-gray-500">تقارير وتحليلات الأداء</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2" disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              تصدير
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV}>
              <FileSpreadsheet className="h-4 w-4 ms-2" />
              تصدير CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToJSON}>
              <FileDown className="h-4 w-4 ms-2" />
              تصدير JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={printReport}>
              <FileText className="h-4 w-4 ms-2" />
              طباعة التقرير
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المشاريع</p>
              <p className="text-2xl font-bold">{stats.projects}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المستخدمين</p>
              <p className="text-2xl font-bold">{stats.users}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Receipt className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الفواتير</p>
              <p className="text-2xl font-bold">{stats.invoices}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Workflow className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">سير العمل</p>
              <p className="text-2xl font-bold">{stats.workflows}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            التقارير المتاحة
          </CardTitle>
          <CardDescription>قائمة التقارير التحليلية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد تقارير مخصصة حالياً</p>
            <p className="text-sm mt-2">يمكنك إنشاء تقارير مخصصة من صفحة التقارير المخصصة</p>
          </div>
        </CardContent>
      </Card>
    
      {true && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل</h3>
          </div>
          <div className="py-4 text-sm text-muted-foreground">محتوى</div>
        
      </div>)}

    </div>
  );
}
