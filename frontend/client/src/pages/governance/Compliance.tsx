import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
import React from "react";
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Shield, FileText, Loader2, XCircle } from 'lucide-react';

export default function Compliance() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const handleSubmit = () => { createMut.mutate({}); };

  const [searchTerm, setSearchTerm] = useState('');
  const utils = trpc.useUtils();

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const { data: documentsData, isLoading: loadingDocs, isError, error} = trpc.documents.list.useQuery();
  const { data: violationsData, isLoading: loadingViolations } = trpc.fleetExtended.violations.list.useQuery();
  const { data: auditsData, isLoading: loadingAudits } = trpc.audit.logs.useQuery({ limit: 100 });

  const createMut = trpc.documents.create.useMutation({ onError: (e: any) => { alert(e.message || "حدث خطأ"); }, onSuccess: () => {
        utils.documents.invalidate();
 window.location.reload(); } });
  
  const documents = (documentsData || []) as any[];
  const violations = (violationsData || []) as any[];
  const audits = (auditsData || []) as any[];
  
  const policies = documents.filter((d: any) => d.documentType === 'policy');
  const approvedPolicies = policies.filter((p: any) => p.status === 'approved' || p.status === 'published');
  const pendingViolations = violations.filter((v: any) => v.status === 'pending' || v.status === 'under_review');
  const completedAudits = audits.filter((a: any) => a.status === 'completed');
  
  // حساب نسبة الامتثال الفعلية
  const calculateComplianceRate = () => {
    // إذا لم تكن هناك سياسات، نعتبر النسبة 100%
    if (policies.length === 0) return 100;
    
    // نسبة السياسات المعتمدة
    const policyRate = (approvedPolicies.length / (policies.length || 1)) * 100;
    
    // نسبة المخالفات (كل مخالفة تخصم من النسبة)
    const violationPenalty = Math.min(pendingViolations.length * 5, 50); // حد أقصى 50%
    
    const finalRate = Math.max(0, Math.round(policyRate - violationPenalty));
    return finalRate;
  };
  
  const complianceRate = calculateComplianceRate();
  const isLoading = loadingDocs || loadingViolations || loadingAudits;

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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">الامتثال والالتزام</h2>
        <p className="text-gray-500">متابعة الامتثال للسياسات واللوائح</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${complianceStyle.bg}`}>
              <ComplianceIcon className={`h-6 w-6 ${complianceStyle.text}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">نسبة الامتثال</p>
              <p className={`text-2xl font-bold ${complianceStyle.text}`}>{complianceRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">السياسات</p>
              <p className="text-2xl font-bold">{policies.length}</p>
              <p className="text-xs text-gray-400">{approvedPolicies.length} معتمدة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المخالفات المعلقة</p>
              <p className="text-2xl font-bold">{pendingViolations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">المراجعات المكتملة</p>
              <p className="text-2xl font-bold">{completedAudits.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            حالة الامتثال
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceRate >= 90 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-green-50 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">مستوى الامتثال ممتاز</p>
              <p className="text-sm text-gray-400">جميع المتطلبات مستوفاة</p>
            </div>
          ) : complianceRate >= 70 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-amber-50 mb-4">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-amber-600 font-medium">مستوى الامتثال متوسط</p>
              <p className="text-sm text-gray-400">يوجد {pendingViolations.length} مخالفة بحاجة للمعالجة</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-red-50 mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">مستوى الامتثال منخفض</p>
              <p className="text-sm text-gray-400">يجب معالجة المخالفات واعتماد السياسات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة المخالفات المعلقة */}
      {pendingViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              المخالفات المعلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingViolations.slice(0, 5).map((violation: any) => (
                <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{violation.description || 'مخالفة'}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(violation.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                    {violation.status === 'pending' ? 'معلقة' : 'قيد المراجعة'}
                  </Badge>
                </div>
              ))}
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
