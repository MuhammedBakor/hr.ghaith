import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Map, Loader2, Car } from 'lucide-react';

export default function FleetReplay() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  // حالة النموذج المتكامل
  const [formData, setFormData] = useState<Record<string, any>>({ 'vehicleId': '', 'startDate': '', 'endDate': '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
        if (!formData.vehicleId?.toString().trim()) errors.vehicleId = 'مطلوب';
    if (!formData.startDate?.toString().trim()) errors.startDate = 'مطلوب';
    if (!formData.endDate?.toString().trim()) errors.endDate = 'مطلوب';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = trpc.fleetSmart.create.useMutation({
    onSuccess: () => {
      setFormData({ 'vehicleId': '', 'startDate': '', 'endDate': '',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      setIsSubmitting(false);
      alert('تم الحفظ بنجاح');
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      alert(err.message || 'حدث خطأ');
    },
  });

  const handleSubmit = () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const { data: currentUser, isError, error} = trpc.auth.me.useQuery();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: vehiclesData, isLoading } = trpc.fleet.vehicles.list.useQuery();
  const vehicles = (vehiclesData || []) as any[];

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
    <div className="flex items-center justify-center h-64" dir="rtl">
      {/* نموذج متكامل مضمن */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h3 className="text-lg font-bold mb-4">إدخال بيانات جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">المركبة</label>
            <input value={formData.vehicleId || ""} onChange={(e) => handleFieldChange("vehicleId", e.target.value)} placeholder="المركبة" className={`w-full px-3 py-2 border rounded-lg ${formErrors.vehicleId ? "border-red-500" : ""}`} />
            {formErrors.vehicleId && <span className="text-xs text-red-500">{formErrors.vehicleId}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
            <input value={formData.startDate || ""} onChange={(e) => handleFieldChange("startDate", e.target.value)} placeholder="تاريخ البداية" className={`w-full px-3 py-2 border rounded-lg ${formErrors.startDate ? "border-red-500" : ""}`} />
            {formErrors.startDate && <span className="text-xs text-red-500">{formErrors.startDate}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ النهاية</label>
            <input value={formData.endDate || ""} onChange={(e) => handleFieldChange("endDate", e.target.value)} placeholder="تاريخ النهاية" className={`w-full px-3 py-2 border rounded-lg ${formErrors.endDate ? "border-red-500" : ""}`} />
            {formErrors.endDate && <span className="text-xs text-red-500">{formErrors.endDate}</span>}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">إعادة تشغيل المسار</h2>
        <p className="text-gray-500">مشاهدة مسارات المركبات السابقة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            اختيار المركبة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مركبة" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v: any) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.plateNumber} - {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPlaying(!isPlaying)} disabled={!selectedVehicle}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" disabled={!selectedVehicle}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            خريطة المسار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">خريطة المسار</p>
              <p className="text-sm text-gray-400">{selectedVehicle ? 'جاري تحميل المسار...' : 'اختر مركبة لعرض المسار'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
