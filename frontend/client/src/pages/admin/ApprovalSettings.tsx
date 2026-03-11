import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from 'sonner';
import { Settings, Save, Clock } from 'lucide-react';

const MODULES = [
  { module: 'hr', entityType: 'leave', label: 'الإجازات', icon: '🏖️' },
  { module: 'finance', entityType: 'expense', label: 'المصروفات', icon: '💰' },
  { module: 'finance', entityType: 'invoice', label: 'الفواتير', icon: '📄' },
  { module: 'finance', entityType: 'purchase_order', label: 'طلبات الشراء', icon: '🛒' },
  { module: 'hr', entityType: 'payroll', label: 'الرواتب', icon: '💵' },
  { module: 'requests', entityType: 'request', label: 'الطلبات العامة', icon: '📋' },
];

export default function ApprovalSettingsPage() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: settings, isLoading, refetch, isError, error} = useQuery({
    queryKey: ["approvalSettings", "list"],
    queryFn: () => api.get("/approval-settings").then(r => r.data),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => api.post("/approval-settings", data).then(r => r.data),
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const getSettingValue = (module: string, entityType: string, field: string) => {
    const setting = settings?.find((s: any) => s.module === module && s.entityType === entityType);
    return setting ? (setting as any)[field] : undefined;
  };

  const handleSave = (module: string, entityType: string, data: any) => {
    upsertMutation.mutate({ module, entityType, ...data });
  };

  
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );
  // Empty state
  const isEmpty = !settings || (Array.isArray(settings) && settings.length === 0);


  return (
    <div className="p-6 space-y-6" dir="rtl">
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
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> إعدادات الموافقات
        </h2>
        <p className="text-gray-500 mt-1">تحكم في آلية الموافقة على كل نوع من العمليات</p>
      </div>

      <div className="grid gap-6">
        {MODULES.map(({ module, entityType, label, icon }) => {
          const autoEnabled = getSettingValue(module, entityType, 'autoApproveEnabled') || false;
          const maxAmount = getSettingValue(module, entityType, 'autoApproveMaxAmount');
          const maxDays = getSettingValue(module, entityType, 'autoApproveMaxDays');
          const requiresSecond = getSettingValue(module, entityType, 'requiresSecondApproval') || false;
          const escalationHours = getSettingValue(module, entityType, 'escalationHours') || 48;

          return (
            <Card key={`${module}-${entityType}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span> {label}
                  <span className="text-sm font-normal text-gray-400">({module}/{entityType})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* الموافقة التلقائية */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-medium">الموافقة التلقائية</Label>
                      <p className="text-xs text-gray-500">موافقة تلقائية بدون مراجعة</p>
                    </div>
                    <Switch
                      checked={autoEnabled}
                      onCheckedChange={(checked) => handleSave(module, entityType, { autoApproveEnabled: checked })}
                    />
                  </div>

                  {/* الحد الأقصى للمبلغ */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="font-medium">الحد الأقصى للمبلغ</Label>
                    <Input
                      type="number" placeholder="بدون حد"
                      defaultValue={maxAmount ? parseFloat(maxAmount.toString()) : ''}
                      onBlur={(e) => {
                        if (e.target.value) handleSave(module, entityType, { autoApproveMaxAmount: parseFloat(e.target.value) });
                      }}
                      className="mt-1"
                    />
                  </div>

                  {/* الحد الأقصى للأيام */}
                  {(entityType === 'leave') && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="font-medium">الحد الأقصى للأيام</Label>
                      <Input
                        type="number" placeholder="بدون حد"
                        defaultValue={maxDays || ''}
                        onBlur={(e) => {
                          if (e.target.value) handleSave(module, entityType, { autoApproveMaxDays: parseInt(e.target.value) });
                        }}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {/* الموافقة المزدوجة */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-medium">موافقة مزدوجة</Label>
                      <p className="text-xs text-gray-500">تتطلب موافقتين</p>
                    </div>
                    <Switch
                      checked={requiresSecond}
                      onCheckedChange={(checked) => handleSave(module, entityType, { requiresSecondApproval: checked })}
                    />
                  </div>

                  {/* ساعات التصعيد */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ساعات التصعيد
                    </Label>
                    <Input
                      type="number" placeholder="48"
                      defaultValue={escalationHours}
                      onBlur={(e) => {
                        if (e.target.value) handleSave(module, entityType, { escalationHours: parseInt(e.target.value) });
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    
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
