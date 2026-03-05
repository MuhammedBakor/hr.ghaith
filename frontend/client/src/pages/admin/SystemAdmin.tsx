import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Settings, Shield, Zap, Clock, Users, Plus, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Lock, Unlock, ArrowRight } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

type ViewMode = "list" | "add-company" | "add-setting" | "add-rule" | "add-role-pack";

export default function SystemAdmin() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const queryClient = useQueryClient();
  const { data: currentUser, isError, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("companies");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Form states
  const [newCompany, setNewCompany] = useState({
    code: "",
    name: "",
    nameAr: "",
    email: "",
    phone: "",
    city: "",
    taxNumber: "",
  });

  const [newSetting, setNewSetting] = useState({
    key: "",
    value: "",
    type: "string" as const,
    category: "",
    scope: "global" as const,
    label: "",
    labelAr: "",
    description: "",
  });

  const [newRule, setNewRule] = useState({
    code: "",
    name: "",
    nameAr: "",
    triggerType: "event" as const,
    triggerEvent: "",
    actionType: "notification" as const,
    actionConfig: "",
    description: "",
  });

  const [newRolePack, setNewRolePack] = useState({
    code: "",
    name: "",
    nameAr: "",
    category: "",
    description: "",
  });

  // Queries
  const { data: companies, refetch: refetchCompanies } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => api.get('/admin/companies').then(r => r.data),
  });
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings', 'system'],
    queryFn: () => api.get('/admin/settings', { params: { category: 'system' } }).then(r => r.data),
  });
  const { data: rules, refetch: refetchRules } = useQuery({
    queryKey: ['admin', 'automation-rules'],
    queryFn: () => api.get('/admin/automation-rules').then(r => r.data),
  });
  const { data: dueTimers, refetch: refetchTimers } = useQuery({
    queryKey: ['admin', 'timers', 'due'],
    queryFn: () => api.get('/admin/timers/due').then(r => r.data),
  });
  const { data: rolePacks, refetch: refetchRolePacks } = useQuery({
    queryKey: ['admin', 'role-packs'],
    queryFn: () => api.get('/admin/role-packs').then(r => r.data),
  });
  const { data: failedChecks } = useQuery({
    queryKey: ['admin', 'governance', 'failed-checks'],
    queryFn: () => api.get('/admin/governance/failed-checks').then(r => r.data),
  });
  const { data: protectedEndpoints } = useQuery({
    queryKey: ['admin', 'governance', 'protected-endpoints'],
    queryFn: () => api.get('/admin/governance/protected-endpoints').then(r => r.data),
  });

  // Mutations
  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/companies', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء الشركة بنجاح");
      setViewMode("list");
      refetchCompanies();
      setNewCompany({ code: "", name: "", nameAr: "", email: "", phone: "", city: "", taxNumber: "" });
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const createSettingMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/settings', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء الإعداد بنجاح");
      setViewMode("list");
      setNewSetting({ key: "", value: "", type: "string", category: "", scope: "global", label: "", labelAr: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/automation-rules', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء القاعدة بنجاح");
      setViewMode("list");
      refetchRules();
      setNewRule({ code: "", name: "", nameAr: "", triggerType: "event", triggerEvent: "", actionType: "notification", actionConfig: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const createRolePackMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/role-packs', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء حزمة الأدوار بنجاح");
      setViewMode("list");
      refetchRolePacks();
      setNewRolePack({ code: "", name: "", nameAr: "", category: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const stats = [
    { label: "الشركات", value: companies?.length || 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "قواعد الأتمتة", value: rules?.length || 0, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "المؤقتات المستحقة", value: dueTimers?.length || 0, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "حزم الأدوار", value: rolePacks?.length || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const handleBackToList = () => {
    setViewMode("list");
  };

  // Render Add Company Form (in same page)
  const renderAddCompanyForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إضافة شركة جديدة</h2>
          <p className="text-muted-foreground">أدخل بيانات الشركة الجديدة</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الشركة</CardTitle>
          <PrintButton title="بيانات الشركة" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input
                  value={newCompany.code}
                  onChange={(e) => setNewCompany({ ...newCompany, code: e.target.value })}
                  placeholder="COMP001"
                />
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={newCompany.city}
                  onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                  placeholder="الرياض"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>اسم الشركة (إنجليزي)</Label>
              <Input
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="اسم الشركة"
              />
            </div>
            <div className="space-y-2">
              <Label>اسم الشركة (عربي)</Label>
              <Input
                value={newCompany.nameAr}
                onChange={(e) => setNewCompany({ ...newCompany, nameAr: e.target.value })}
                placeholder="اسم الشركة"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  placeholder="info@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  placeholder="+966..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الرقم الضريبي</Label>
              <Input
                value={newCompany.taxNumber}
                onChange={(e) => setNewCompany({ ...newCompany, taxNumber: e.target.value })}
                placeholder="300..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
              <Button disabled={createRuleMutation.isPending} onClick={() => createCompanyMutation.mutate(newCompany)} disabled={createCompanyMutation.isPending}>
                {createCompanyMutation.isPending ? "جاري الإنشاء..." : "إنشاء الشركة"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Add Setting Form (in same page)
  const renderAddSettingForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إضافة إعداد جديد</h2>
          <p className="text-muted-foreground">أدخل بيانات الإعداد الجديد</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الإعداد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المفتاح</Label>
                <Input
                  value={newSetting.key}
                  onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                  placeholder="setting.key"
                />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Input
                  value={newSetting.category}
                  onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
                  placeholder="system"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={newSetting.type} onValueChange={(v: any) => setNewSetting({ ...newSetting, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">نص</SelectItem>
                    <SelectItem value="number">رقم</SelectItem>
                    <SelectItem value="boolean">منطقي</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>النطاق</Label>
                <Select value={newSetting.scope} onValueChange={(v: any) => setNewSetting({ ...newSetting, scope: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">عام</SelectItem>
                    <SelectItem value="company">شركة</SelectItem>
                    <SelectItem value="branch">فرع</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>القيمة</Label>
              <Input
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                placeholder="القيمة"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التسمية (إنجليزي)</Label>
                <Input
                  value={newSetting.label}
                  onChange={(e) => setNewSetting({ ...newSetting, label: e.target.value })}
                  placeholder="اسم الإعداد"
                />
              </div>
              <div className="space-y-2">
                <Label>التسمية (عربي)</Label>
                <Input
                  value={newSetting.labelAr}
                  onChange={(e) => setNewSetting({ ...newSetting, labelAr: e.target.value })}
                  placeholder="تسمية الإعداد"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={newSetting.description}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                placeholder="وصف الإعداد..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
              <Button onClick={() => createSettingMutation.mutate(newSetting)} disabled={createSettingMutation.isPending}>
                {createSettingMutation.isPending ? "جاري الإنشاء..." : "إنشاء الإعداد"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Add Rule Form (in same page)
  const renderAddRuleForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إضافة قاعدة أتمتة</h2>
          <p className="text-muted-foreground">أدخل بيانات القاعدة الجديدة</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات القاعدة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input
                  value={newRule.code}
                  onChange={(e) => setNewRule({ ...newRule, code: e.target.value })}
                  placeholder="RULE001"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع المشغل</Label>
                <Select value={newRule.triggerType} onValueChange={(v: any) => setNewRule({ ...newRule, triggerType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">حدث</SelectItem>
                    <SelectItem value="schedule">جدولة</SelectItem>
                    <SelectItem value="condition">شرط</SelectItem>
                    <SelectItem value="manual">يدوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>اسم القاعدة (إنجليزي)</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="اسم القاعدة"
              />
            </div>
            <div className="space-y-2">
              <Label>اسم القاعدة (عربي)</Label>
              <Input
                value={newRule.nameAr}
                onChange={(e) => setNewRule({ ...newRule, nameAr: e.target.value })}
                placeholder="اسم القاعدة"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحدث المشغل</Label>
                <Input
                  value={newRule.triggerEvent}
                  onChange={(e) => setNewRule({ ...newRule, triggerEvent: e.target.value })}
                  placeholder="request.created"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع الإجراء</Label>
                <Select value={newRule.actionType} onValueChange={(v: any) => setNewRule({ ...newRule, actionType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">إشعار</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="escalation">تصعيد</SelectItem>
                    <SelectItem value="status_change">تغيير حالة</SelectItem>
                    <SelectItem value="create_task">إنشاء مهمة</SelectItem>
                    <SelectItem value="api_call">استدعاء API</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="وصف القاعدة..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
              <Button onClick={() => createRuleMutation.mutate(newRule)} disabled={createRuleMutation.isPending}>
                {createRuleMutation.isPending ? "جاري الإنشاء..." : "إنشاء القاعدة"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Add Role Pack Form (in same page)
  const renderAddRolePackForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowRight className="h-4 w-4 ms-2" />
          العودة للقائمة
        </Button>
        <div>
          <h2 className="text-2xl font-bold">إضافة حزمة أدوار</h2>
          <p className="text-muted-foreground">أدخل بيانات الحزمة الجديدة</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الحزمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input
                  value={newRolePack.code}
                  onChange={(e) => setNewRolePack({ ...newRolePack, code: e.target.value })}
                  placeholder="PACK001"
                />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Input
                  value={newRolePack.category}
                  onChange={(e) => setNewRolePack({ ...newRolePack, category: e.target.value })}
                  placeholder="hr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>اسم الحزمة (إنجليزي)</Label>
              <Input
                value={newRolePack.name}
                onChange={(e) => setNewRolePack({ ...newRolePack, name: e.target.value })}
                placeholder="Role Pack Name"
              />
            </div>
            <div className="space-y-2">
              <Label>اسم الحزمة (عربي)</Label>
              <Input
                value={newRolePack.nameAr}
                onChange={(e) => setNewRolePack({ ...newRolePack, nameAr: e.target.value })}
                placeholder="اسم الحزمة"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={newRolePack.description}
                onChange={(e) => setNewRolePack({ ...newRolePack, description: e.target.value })}
                placeholder="وصف الحزمة..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
              <Button onClick={() => createRolePackMutation.mutate(newRolePack)} disabled={createRolePackMutation.isPending}>
                {createRolePackMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحزمة"}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">إدارة النظام</h2>
          <p className="text-gray-500">Kernel Fix Sprint - Scope Contract & Governance</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Shield className="h-4 w-4 ms-1" />
          مدير النظام
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.id ?? `Card-${index}`} className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            الشركات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            الأتمتة
          </TabsTrigger>
          <TabsTrigger value="timers" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            المؤقتات
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            الأدوار
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الحوكمة
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>إدارة الشركات</CardTitle>
                <CardDescription>إدارة الشركات والكيانات في النظام</CardDescription>
              </div>
              <Button onClick={() => setViewMode("add-company")}>
                <Plus className="h-4 w-4 ms-2" />
                إضافة شركة
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies?.map((company: any) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-mono">{company.code}</TableCell>
                      <TableCell>{company.nameAr || company.name}</TableCell>
                      <TableCell>{company.city}</TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>
                        {company.isActive ? (
                          <Badge className="bg-green-100 text-green-700">نشط</Badge>
                        ) : (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toast.info('اضغط على العنصر لتعديله')}>تعديل</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!companies || companies.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        لا توجد شركات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>إعدادات النظام</CardTitle>
                <CardDescription>إدارة إعدادات النظام العامة</CardDescription>
              </div>
              <Button onClick={() => setViewMode("add-setting")}>
                <Plus className="h-4 w-4 ms-2" />
                إضافة إعداد
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المفتاح</TableHead>
                    <TableHead>التسمية</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>النطاق</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.map((setting: any) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-mono">{setting.key}</TableCell>
                      <TableCell>{setting.labelAr || setting.label}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{setting.value}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{setting.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{setting.scope}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toast.info('اضغط على العنصر لتعديله')}>تعديل</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!settings || settings.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        لا توجد إعدادات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>قواعد الأتمتة</CardTitle>
                <CardDescription>إدارة قواعد الأتمتة والتشغيل التلقائي</CardDescription>
              </div>
              <Button onClick={() => setViewMode("add-rule")}>
                <Plus className="h-4 w-4 ms-2" />
                إضافة قاعدة
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>المشغل</TableHead>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules?.map((rule: any) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-mono">{rule.code}</TableCell>
                      <TableCell>{rule.nameAr || rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.triggerType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rule.actionType}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.isActive ? (
                          <Badge className="bg-green-100 text-green-700">نشط</Badge>
                        ) : (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toast.info('اضغط على العنصر لتعديله')}>تعديل</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!rules || rules.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        لا توجد قواعد أتمتة
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timers Tab */}
        <TabsContent value="timers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>المؤقتات المستحقة</CardTitle>
                <CardDescription>المؤقتات والتذكيرات التي حان موعدها</CardDescription>
              </div>
              <Button variant="outline" onClick={() => refetchTimers()}>
                <RefreshCw className="h-4 w-4 ms-2" />
                تحديث
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المرجع</TableHead>
                    <TableHead>موعد الاستحقاق</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueTimers?.map((timer: any) => (
                    <TableRow key={timer.id}>
                      <TableCell className="font-mono">{timer.code}</TableCell>
                      <TableCell>{timer.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{timer.timerType}</Badge>
                      </TableCell>
                      <TableCell>{timer.referenceType} #{timer.referenceId}</TableCell>
                      <TableCell>{formatDateTime(timer.dueAt)}</TableCell>
                      <TableCell>
                        <Badge variant={timer.status === "pending" ? "default" : "secondary"}>
                          {timer.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!dueTimers || dueTimers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        لا توجد مؤقتات مستحقة
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>حزم الأدوار</CardTitle>
                <CardDescription>قوالب الأدوار الجاهزة للتعيين</CardDescription>
              </div>
              <Button onClick={() => setViewMode("add-role-pack")}>
                <Plus className="h-4 w-4 ms-2" />
                إضافة حزمة
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead>افتراضي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolePacks?.map((pack: any) => (
                    <TableRow key={pack.id}>
                      <TableCell className="font-mono">{pack.code}</TableCell>
                      <TableCell>{pack.nameAr || pack.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pack.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {pack.isDefault ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {pack.isActive ? (
                          <Badge className="bg-green-100 text-green-700">نشط</Badge>
                        ) : (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/governance/permissions'}>إدارة الصلاحيات</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!rolePacks || rolePacks.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        لا توجد حزم أدوار
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Failed Checks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  فحوصات الحوكمة الفاشلة
                </CardTitle>
                <CardDescription>آخر محاولات الوصول المرفوضة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {failedChecks?.slice(0, 5).map((check: any) => (
                    <div key={check.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{check.endpoint}</p>
                        <p className="text-xs text-gray-500">{check.failureReason}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(check.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        {check.checkType}
                      </Badge>
                    </div>
                  ))}
                  {(!failedChecks || failedChecks.length === 0) && (
                    <div className="text-center text-gray-500 py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                      <p>لا توجد فحوصات فاشلة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Protected Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  نقاط النهاية المحمية
                </CardTitle>
                <CardDescription>قائمة الـ APIs المحمية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {protectedEndpoints?.slice(0, 8).map((endpoint: any) => (
                    <div key={endpoint.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {endpoint.method}
                        </Badge>
                        <span className="text-sm font-mono">{endpoint.endpoint}</span>
                      </div>
                      <Badge variant={
                        endpoint.riskLevel === "critical" ? "destructive" :
                          endpoint.riskLevel === "high" ? "default" :
                            "secondary"
                      }>
                        {endpoint.riskLevel}
                      </Badge>
                    </div>
                  ))}
                  {(!protectedEndpoints || protectedEndpoints.length === 0) && (
                    <div className="text-center text-gray-500 py-8">
                      <Unlock className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p>لا توجد نقاط نهاية محمية مسجلة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Main render
  switch (viewMode) {
    case "add-company":
      return renderAddCompanyForm();
    case "add-setting":
      return renderAddSettingForm();
    case "add-rule":
      return renderAddRuleForm();
    case "add-role-pack":
      return renderAddRolePackForm();
    default:
      return renderListView();
  }
}
