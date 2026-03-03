import { formatDate, formatDateTime } from '@/lib/formatDate';
import React from "react";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, FileText, Loader2, AlertTriangle, CheckCircle2, XCircle, ClipboardCheck, Key, Lock, Activity, FileCheck } from 'lucide-react';
import { Link } from 'wouter';

export default function GovernanceLayer() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const handleSubmit = () => { createMut.mutate({}); };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const utils = trpc.useUtils();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const { data: rolesData, isLoading: loadingRoles } = trpc.controlKernel.roles.list.useQuery();
  const { data: documentsData, isLoading: loadingDocs } = trpc.documents.list.useQuery();
  const { data: violationsData, isLoading: loadingViolations } = trpc.fleetExtended.violations.list.useQuery();
  const { data: auditsData, isLoading: loadingAudits } = trpc.audit.logs.useQuery({ limit: 100 });

  const createMut = trpc.controlKernel.create.useMutation({ onError: (e: any) => { alert(e.message || "حدث خطأ"); }, onSuccess: () => {
        utils.controlKernel.invalidate();
 window.location.reload(); } });
  
  const roles = (rolesData || []) as any[];
  const documents = (documentsData || []) as any[];
  const violations = (violationsData || []) as any[];
  const audits = (auditsData || []) as any[];
  
  const policies = documents.filter((d: any) => d.documentType === 'policy');
  const approvedPolicies = policies.filter((p: any) => p.status === 'approved' || p.status === 'published');
  const pendingViolations = violations.filter((v: any) => v.status === 'pending' || v.status === 'under_review');
  const recentAudits = audits.slice(0, 5);
  
  // حساب نسبة الامتثال الفعلية
  const calculateComplianceRate = () => {
    if (policies.length === 0) return 100;
    const policyRate = (approvedPolicies.length / (policies.length || 1)) * 100;
    const violationPenalty = Math.min(pendingViolations.length * 5, 50);
    return Math.max(0, Math.round(policyRate - violationPenalty));
  };
  
  const complianceRate = calculateComplianceRate();
  const isLoading = loadingRoles || loadingDocs || loadingViolations || loadingAudits;

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;
    
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

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return { bg: 'bg-green-50', text: 'text-green-600', icon: CheckCircle2 };
    if (rate >= 70) return { bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertTriangle };
    return { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle };
  };
  
  const complianceStyle = getComplianceColor(complianceRate);
  const ComplianceIcon = complianceStyle.icon;

  const sections = [
    { 
      title: 'إدارة الهوية والوصول', 
      description: 'إدارة المستخدمين والأدوار والصلاحيات',
      icon: Users, 
      path: '/governance/iam', 
      count: roles.length,
      unit: 'دور',
      color: 'bg-blue-50 text-blue-600'
    },
    { 
      title: 'الامتثال والالتزام', 
      description: 'متابعة الامتثال للسياسات واللوائح',
      icon: Shield, 
      path: '/governance/compliance', 
      count: complianceRate,
      unit: '%',
      color: complianceStyle.bg + ' ' + complianceStyle.text
    },
    { 
      title: 'السياسات', 
      description: 'إدارة سياسات المنظمة',
      icon: FileText, 
      path: '/governance/policies', 
      count: policies.length,
      unit: 'سياسة',
      color: 'bg-purple-50 text-purple-600'
    },
    { 
      title: 'المخاطر', 
      description: 'تقييم وإدارة المخاطر',
      icon: AlertTriangle, 
      path: '/governance/risks', 
      count: pendingViolations.length,
      unit: 'مخالفة معلقة',
      color: 'bg-amber-50 text-amber-600'
    },
    { 
      title: 'التدقيق', 
      description: 'سجلات التدقيق والمراجعة',
      icon: ClipboardCheck, 
      path: '/governance/audits', 
      count: audits.length,
      unit: 'سجل',
      color: 'bg-emerald-50 text-emerald-600'
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">طبقة الحوكمة</h2>
          <p className="text-gray-500">إدارة الحوكمة والامتثال والسياسات في المنظمة</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${complianceStyle.bg}`}>
          <ComplianceIcon className={`h-5 w-5 ${complianceStyle.text}`} />
          <span className={`font-semibold ${complianceStyle.text}`}>
            نسبة الامتثال: {complianceRate}%
          </span>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {sections.map((section, index) => (
          <Link key={section.id ?? `Link-${index}`} href={section.path}>
            <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl ${section.color.split(' ')[0]}`}>
                    <section.icon className={`h-6 w-6 ${section.color.split(' ')[1]}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {section.count} {section.unit}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1">{section.title}</h3>
                <p className="text-xs text-gray-500">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* حالة الامتثال */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              حالة الامتثال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <span>السياسات المعتمدة</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {approvedPolicies.length} / {policies.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>المخالفات المعلقة</span>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  {pendingViolations.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-purple-600" />
                  <span>الأدوار النشطة</span>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {roles.filter((r: any) => r.isActive).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  <span>سجلات التدقيق اليوم</span>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  {audits.filter((a: any) => {
                    const today = new Date();
                    const auditDate = new Date(a.createdAt);
                    return auditDate.toDateString() === today.toDateString();
                  }).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* آخر سجلات التدقيق */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              آخر سجلات التدقيق
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                <Lock className="h-8 w-8 mb-2 text-gray-300" />
                <p>لا توجد سجلات تدقيق</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAudits?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((audit: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        audit.action === 'create' ? 'bg-green-50' :
                        audit.action === 'update' ? 'bg-blue-50' :
                        audit.action === 'delete' ? 'bg-red-50' : 'bg-gray-50'
                      }`}>
                        <Activity className={`h-4 w-4 ${
                          audit.action === 'create' ? 'text-green-600' :
                          audit.action === 'update' ? 'text-blue-600' :
                          audit.action === 'delete' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{audit.entityType || 'عملية'}</p>
                        <p className="text-xs text-gray-500">
                          {audit.action === 'create' ? 'إنشاء' :
                           audit.action === 'update' ? 'تحديث' :
                           audit.action === 'delete' ? 'حذف' : audit.action}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(audit.createdAt).toLocaleTimeString('ar-SA', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* تنبيهات الامتثال */}
      {pendingViolations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              تنبيهات الامتثال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingViolations.slice(0, 3).map((violation: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                  <div>
                    <p className="font-medium text-amber-900">{violation.description || 'مخالفة معلقة'}</p>
                    <p className="text-sm text-amber-700">
                      {formatDate(violation.createdAt)}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                    {violation.status === 'pending' ? 'معلقة' : 'قيد المراجعة'}
                  </Badge>
                </div>
              ))}
              {pendingViolations.length > 3 && (
                <Link href="/governance/risks">
                  <p className="text-center text-sm text-amber-700 hover:text-amber-900 cursor-pointer py-2">
                    عرض جميع المخالفات ({pendingViolations.length})
                  </p>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    
        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">إدخال البيانات</h3>
              <div className="space-y-3">
                <input aria-label="حقل إدخال" className="w-full border rounded-lg p-2 text-end" placeholder="الاسم / العنوان" onChange={e => setFormData({...formData, name: e.target.value})} />
                <textarea className="w-full border rounded-lg p-2 text-end" placeholder="الوصف / الملاحظات" rows={3} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                <button onClick={() => { setShowDialog(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
