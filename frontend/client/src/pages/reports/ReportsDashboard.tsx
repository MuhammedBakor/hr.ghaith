import { useState, useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Filter, BarChart3, TrendingUp, Users, DollarSign, Car, FileCheck, Search, RefreshCw, Building2, Loader2 } from "lucide-react";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

// تعريف أنواع التقارير المتاحة
const REPORT_CATEGORIES = [
  { id: "hr", name: "الموارد البشرية", icon: Users, color: "text-blue-600" },
  { id: "finance", name: "المالية", icon: DollarSign, color: "text-green-600" },
  { id: "fleet", name: "الأسطول", icon: Car, color: "text-purple-600" },
  { id: "requests", name: "الطلبات", icon: FileCheck, color: "text-amber-600" },
  { id: "documents", name: "المستندات", icon: FileText, color: "text-cyan-600" },
  { id: "property", name: "الأملاك", icon: Building2, color: "text-rose-600" },
];

const AVAILABLE_REPORTS = [
  // تقارير الموارد البشرية
  { id: "hr-employees", name: "تقرير الموظفين", category: "hr", description: "قائمة شاملة بجميع الموظفين وبياناتهم" },
  { id: "hr-attendance", name: "تقرير الحضور والانصراف", category: "hr", description: "سجل الحضور والانصراف للموظفين" },
  { id: "hr-leaves", name: "تقرير الإجازات", category: "hr", description: "ملخص الإجازات المستخدمة والمتبقية" },
  { id: "hr-contracts", name: "تقرير العقود", category: "hr", description: "العقود المنتهية والقريبة من الانتهاء" },
  
  // تقارير المالية
  { id: "finance-invoices", name: "تقرير الفواتير", category: "finance", description: "قائمة الفواتير حسب الحالة والفترة" },
  { id: "finance-payments", name: "تقرير المدفوعات", category: "finance", description: "سجل المدفوعات والمستحقات" },
  { id: "finance-budget", name: "تقرير الميزانية", category: "finance", description: "مقارنة الميزانية بالمصروفات الفعلية" },
  { id: "finance-aging", name: "تقرير أعمار الديون", category: "finance", description: "تحليل المستحقات حسب العمر" },
  
  // تقارير الأسطول
  { id: "fleet-vehicles", name: "تقرير المركبات", category: "fleet", description: "قائمة المركبات وحالتها" },
  { id: "fleet-maintenance", name: "تقرير الصيانة", category: "fleet", description: "سجل الصيانة والتكاليف" },
  { id: "fleet-fuel", name: "تقرير الوقود", category: "fleet", description: "استهلاك الوقود لكل مركبة" },
  
  // تقارير الطلبات
  { id: "requests-summary", name: "ملخص الطلبات", category: "requests", description: "إحصائيات الطلبات حسب النوع والحالة" },
  { id: "requests-sla", name: "تقرير SLA", category: "requests", description: "أداء الاستجابة للطلبات" },
  { id: "requests-pending", name: "الطلبات المعلقة", category: "requests", description: "الطلبات التي تحتاج إجراء" },
  
  // تقارير المستندات
  { id: "documents-inventory", name: "جرد المستندات", category: "documents", description: "قائمة المستندات حسب النوع" },
  { id: "documents-expiring", name: "المستندات المنتهية", category: "documents", description: "المستندات القريبة من انتهاء الصلاحية" },
  
  // تقارير الأملاك
  { id: "property-inventory", name: "جرد العقارات", category: "property", description: "قائمة العقارات وحالتها" },
  { id: "property-contracts", name: "عقود الإيجار", category: "property", description: "العقود النشطة والمنتهية" },
  { id: "property-revenue", name: "إيرادات الإيجار", category: "property", description: "تحليل إيرادات الإيجار" },
];

export default function ReportsDashboard() {
  const { data: currentUser, isError, error} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'user';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const queryError = false; // Error state from useQuery

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['bi', 'dashboardStats'], queryFn: () => api.get('/bi/dashboard-stats').then(r => r.data) });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<string>("xlsx");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // فلترة التقارير
  const filteredReports = useMemo(() => {
    return AVAILABLE_REPORTS.filter(report => {
      const matchesCategory = selectedCategory === "all" || report.category === selectedCategory;
      const matchesSearch = report.name.includes(searchQuery) || report.description.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // الحصول على معلومات التقرير المحدد
  const selectedReportInfo = useMemo(() => {
    return AVAILABLE_REPORTS.find(r => r.id === selectedReport);
  }, [selectedReport]);

  // توليد التقرير
  const handleGenerateReport = async () => {
    if (!selectedReport) return;
    
    setIsGenerating(true);
    
    // محاكاة توليد التقرير
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);
    toast.success(`تم توليد التقرير: ${selectedReportInfo?.name} بصيغة ${exportFormat.toUpperCase()}`);
  };

  // الحصول على أيقونة الفئة
  const getCategoryIcon = (categoryId: string) => {
    const category = REPORT_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return FileText;
    return category.icon;
  };

  // الحصول على لون الفئة
  const getCategoryColor = (categoryId: string) => {
    const category = REPORT_CATEGORIES.find(c => c.id === categoryId);
    return category?.color || "text-gray-600";
  };

  if (statsLoading) {
    
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
    <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة التقارير</h1>
          <p className="text-muted-foreground">إنشاء وتصدير التقارير بمختلف الصيغ</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            {AVAILABLE_REPORTS.length} تقرير متاح
          </Badge>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الموظفين</p>
                <p className="text-2xl font-bold">{stats?.users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الفواتير</p>
                <p className="text-2xl font-bold">{stats?.invoices || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المركبات</p>
                <p className="text-2xl font-bold">{stats?.workflows || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <FileCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المشاريع</p>
                <p className="text-2xl font-bold">{stats?.projects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <FileText className="h-4 w-4" />
            إنشاء تقرير
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            حسب الفئة
          </TabsTrigger>
        </TabsList>

        {/* تبويب إنشاء التقارير */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* قائمة التقارير */}
            <div className="md:col-span-2 space-y-4">
              {/* فلاتر البحث */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في التقارير..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pe-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="جميع الفئات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        {REPORT_CATEGORIES.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* قائمة التقارير */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">التقارير المتاحة</CardTitle>
                  <CardDescription>اختر التقرير المطلوب لتوليده</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredReports.map(report => {
                      const Icon = getCategoryIcon(report.category);
                      const isSelected = selectedReport === report.id;
                      
                      return (
                        <div
                          key={report.id}
                          onClick={() => setSelectedReport(report.id)}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-transparent hover:border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className={`p-2 rounded-lg bg-muted ${getCategoryColor(report.category)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{report.name}</h4>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>
                          {isSelected && (
                            <Badge variant="default">محدد</Badge>
                          )}
                        </div>
                      );
                    })}
                    
                    {filteredReports.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد تقارير تطابق البحث</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* خيارات التقرير */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    خيارات التقرير
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedReport ? (
                    <>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="font-medium text-sm">{selectedReportInfo?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{selectedReportInfo?.description}</p>
                      </div>

                      <div className="space-y-2">
                        <Label>الفترة من</Label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>الفترة إلى</Label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>صيغة التصدير</Label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                            <SelectItem value="csv">CSV (.csv)</SelectItem>
                            <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                            <SelectItem value="json">JSON (.json)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="w-full gap-2" 
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            جاري التوليد...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            توليد وتحميل
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>اختر تقريراً من القائمة</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* إحصائيات الفئات */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    التقارير حسب الفئة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {REPORT_CATEGORIES.map(category => {
                    const count = AVAILABLE_REPORTS.filter(r => r.category === category.id).length;
                    const Icon = category.icon;
                    return (
                      <div 
                        key={category.id} 
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${category.color}`} />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* تبويب حسب الفئة */}
        <TabsContent value="categories">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REPORT_CATEGORIES.map(category => {
              const Icon = category.icon;
              const categoryReports = AVAILABLE_REPORTS.filter(r => r.category === category.id);
              
              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-muted ${category.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {category.name}
                    </CardTitle>
                    <CardDescription>{categoryReports.length} تقرير</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryReports.map(report => (
                        <div 
                          key={report.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedReport(report.id);
                            setSelectedCategory(category.id);
                          }}
                        >
                          <span className="text-sm">{report.name}</span>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
