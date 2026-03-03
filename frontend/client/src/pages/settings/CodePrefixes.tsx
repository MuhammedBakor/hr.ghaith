import React from "react";
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog } from "@/components/ui/dialog";
import {

  Hash,
  Save,
  RotateCcw,
  FileText,
  Users,
  Car,
  Building2,
  Wallet,
  Package,
  Receipt,
  ClipboardList,
  Wrench,
  Fuel,
  MapPin,
  Route,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Award,
  Loader2
} from 'lucide-react';

// تعريف بادئات الأكواد الافتراضية
const defaultPrefixConfig = {
  // المالية
  invoice: { name: 'الفواتير', icon: Receipt, category: 'المالية', defaultPrefix: 'INV' },
  expense: { name: 'المصروفات', icon: Wallet, category: 'المالية', defaultPrefix: 'EXP' },
  account: { name: 'الحسابات', icon: Building2, category: 'المالية', defaultPrefix: 'ACC' },
  journalEntry: { name: 'القيود المحاسبية', icon: FileText, category: 'المالية', defaultPrefix: 'JE' },
  purchaseOrder: { name: 'طلبات الشراء', icon: ClipboardList, category: 'المالية', defaultPrefix: 'PO' },
  vendor: { name: 'الموردين', icon: Building2, category: 'المالية', defaultPrefix: 'VND' },
  voucher: { name: 'السندات', icon: Receipt, category: 'المالية', defaultPrefix: 'VCH' },
  warehouse: { name: 'المستودعات', icon: Package, category: 'المالية', defaultPrefix: 'WH' },
  tax: { name: 'الضرائب', icon: Receipt, category: 'المالية', defaultPrefix: 'TAX' },

  // الموارد البشرية
  employee: { name: 'الموظفين', icon: Users, category: 'الموارد البشرية', defaultPrefix: 'EMP' },
  leave: { name: 'طلبات الإجازة', icon: Calendar, category: 'الموارد البشرية', defaultPrefix: 'LV' },
  training: { name: 'برامج التدريب', icon: GraduationCap, category: 'الموارد البشرية', defaultPrefix: 'TRN' },
  performance: { name: 'تقييم الأداء', icon: Award, category: 'الموارد البشرية', defaultPrefix: 'PRF' },
  violation: { name: 'المخالفات', icon: AlertTriangle, category: 'الموارد البشرية', defaultPrefix: 'VIO' },

  // إدارة الأسطول
  vehicle: { name: 'المركبات', icon: Car, category: 'إدارة الأسطول', defaultPrefix: 'VEH' },
  driver: { name: 'السائقين', icon: Users, category: 'إدارة الأسطول', defaultPrefix: 'DRV' },
  maintenance: { name: 'الصيانة', icon: Wrench, category: 'إدارة الأسطول', defaultPrefix: 'MNT' },
  fuel: { name: 'تعبئة الوقود', icon: Fuel, category: 'إدارة الأسطول', defaultPrefix: 'FUEL' },
  trip: { name: 'الرحلات', icon: Route, category: 'إدارة الأسطول', defaultPrefix: 'TRP' },
  geofence: { name: 'السياج الجغرافي', icon: MapPin, category: 'إدارة الأسطول', defaultPrefix: 'GEO' },
};

type PrefixKey = keyof typeof defaultPrefixConfig;

export default function CodePrefixes() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole.includes("manager");
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [prefixes, setPrefixes] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // جلب البادئات من قاعدة البيانات
  const { data: dbPrefixes, isLoading, refetch, isError, error } = trpc.codePrefixes.list.useQuery();

  // Mutation لتحديث البادئة
  const upsertMutation = trpc.codePrefixes.upsert.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حفظ البادئة: ${error.message}`);
    },
  });

  // Mutation لإعادة التعيين
  const resetMutation = trpc.codePrefixes.resetToDefaults.useMutation({
    onSuccess: () => {
      toast.success('تم إعادة تعيين البادئات للقيم الافتراضية');
      refetch();
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`فشل إعادة التعيين: ${error.message}`);
    },
  });

  // تحميل البادئات من قاعدة البيانات
  useEffect(() => {
    if (dbPrefixes) {
      const loadedPrefixes: Record<string, string> = {};
      dbPrefixes.forEach((p: any) => {
        loadedPrefixes[p.entityType] = p.prefix;
      });
      // دمج مع القيم الافتراضية
      Object.keys(defaultPrefixConfig).forEach(key => {
        if (!loadedPrefixes[key]) {
          loadedPrefixes[key] = defaultPrefixConfig[key as PrefixKey].defaultPrefix;
        }
      });
      setPrefixes(loadedPrefixes);
    }
  }, [dbPrefixes]);

  const handlePrefixChange = (key: string, value: string) => {
    setPrefixes(prev => ({ ...prev, [key]: value.toUpperCase() }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // حفظ جميع البادئات المعدلة
      const promises = Object.entries(prefixes).map(([entityType, prefix]) => {
        const config = defaultPrefixConfig[entityType as PrefixKey];
        return upsertMutation.mutateAsync({
          entityType,
          prefix,
          description: config?.name || entityType,
          category: config?.category || 'عام',
        });
      });

      await Promise.all(promises);
      setHasChanges(false);
      toast.success('تم حفظ بادئات الأكواد بنجاح');
    } catch (error) {
      // الخطأ يتم معالجته في onError
    }
  };

  const handleReset = () => {
    resetMutation.mutate({});
  };

  // تجميع البادئات حسب الفئة
  const groupedPrefixes = Object.entries(defaultPrefixConfig).reduce((acc, [key, value]) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push({ key, ...value });
    return acc;
  }, {} as Record<string, Array<{ key: string; name: string; icon: any; category: string; defaultPrefix: string }>>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            بادئات الأكواد
          </h2>
          <p className="text-gray-500 mt-1">
            تخصيص بادئات الأكواد التلقائية للكيانات المختلفة
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin ms-2" />
            ) : (
              <RotateCcw className="h-4 w-4 ms-2" />
            )}
            إعادة تعيين
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || upsertMutation.isPending}
          >
            {upsertMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin ms-2" />
            ) : (
              <Save className="h-4 w-4 ms-2" />
            )}
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Hash className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">كيف تعمل بادئات الأكواد؟</p>
              <p className="text-sm text-blue-700 mt-1">
                يتم استخدام البادئات لتوليد أكواد فريدة تلقائياً لكل كيان. مثال: EMP-0001 للموظفين، INV-0001 للفواتير.
                يمكنك تخصيص البادئة لكل نوع حسب احتياجاتك.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prefix Groups */}
      {Object.entries(groupedPrefixes).map(([category, items]) => (
        <Card key={category} className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
            <CardDescription>
              تخصيص بادئات أكواد {category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {!items?.length && <p className="text-center text-gray-500 py-8">لا توجد بيانات</p>}
              {items?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map(({ key, name, icon: Icon, defaultPrefix }) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50/50">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={key} className="text-sm font-medium">
                      {name}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={key}
                        value={prefixes[key] || defaultPrefix}
                        onChange={(e) => handlePrefixChange(key, e.target.value)}
                        className="h-8 w-24 text-center font-mono uppercase"
                        maxLength={10}
                      />
                      <Badge variant="outline" className="text-xs">
                        {prefixes[key] || defaultPrefix}-0001
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Change Indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 start-1/2 transform -translate-x-1/2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">لديك تغييرات غير محفوظة</span>
        </div>
      )}

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
}
