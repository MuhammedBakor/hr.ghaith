import { useState, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowRight, 
  Upload, 
  Image as ImageIcon, 
  Stamp, 
  PenTool,
  Trash2,
  Eye,
  Save,
  Loader2,
  Building2,
  FileText
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import { LetterPrintWrapper, AppointmentLetter } from '@/components/letters';

export default function LetterheadSettings() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<any>({});
  const createMutation = useMutation({ mutationFn: (data: any) => api.put('/official-letters/branch-letterhead', data).then(r => r.data), onSuccess: () => { refetch(); setShowCreateForm(false); setCreateData({}); } });

  const handleSubmit = () => { saveMutation.mutate({}); };

  const { data: currentUser, isError, error, isLoading} = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api.get('/auth/me').then(r => r.data) });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedBranchId, branches } = useAppContext();
  const [activeTab, setActiveTab] = useState('letterhead');
  const [selectedBranch, setSelectedBranch] = useState<string>(selectedBranchId?.toString() || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [letterhead, setLetterhead] = useState<string | null>(null);
  const [stamp, setStamp] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const letterheadInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // جلب بيانات الكليشة الحالية
  const { data: currentSettings, refetch } = useQuery({
    queryKey: ['officialLetters', 'letterhead', selectedBranch],
    queryFn: () => api.get('/official-letters/letterhead', { params: { branchId: selectedBranch ? parseInt(selectedBranch) : undefined } }).then(r => r.data),
    enabled: !!selectedBranch,
  });

  // تحديث البيانات عند تغيير الإعدادات
  if (currentSettings && !letterhead && !stamp && !signature) {
    if (currentSettings.letterhead) setLetterhead(currentSettings.letterhead);
    if (currentSettings.stamp) setStamp(currentSettings.stamp);
    if (currentSettings.signature) setSignature(currentSettings.signature);
  }

  // Mutation لحفظ الإعدادات
  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put('/official-letters/branch-letterhead', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات بنجاح');
      refetch();
    },
    onError: (error: any) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const handleFileUpload = async (file: File, type: 'letterhead' | 'stamp' | 'signature') => {
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      // تحويل الملف إلى Base64 للعرض المؤقت
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        switch (type) {
          case 'letterhead':
            setLetterhead(base64);
            break;
          case 'stamp':
            setStamp(base64);
            break;
          case 'signature':
            setSignature(base64);
            break;
        }
      };
      reader.readAsDataURL(file);
      
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBranch) {
      toast.error('يرجى اختيار الفرع');
      return;
    }

    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        branchId: parseInt(selectedBranch),
        letterhead: letterhead || undefined,
        stamp: stamp || undefined,
        signature: signature || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = (type: 'letterhead' | 'stamp' | 'signature') => {
    switch (type) {
      case 'letterhead':
        setLetterhead(null);
        break;
      case 'stamp':
        setStamp(null);
        break;
      case 'signature':
        setSignature(null);
        break;
    }
  };

  const currentBranch = branches?.find(b => b.id.toString() === selectedBranch);
  // Empty state
  const isEmpty = !currentUser || (Array.isArray(currentUser) && currentUser.length === 0);


  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      {isLoading && <div className="text-center py-8 text-gray-500">جاري التحميل...</div>}
        {/* إضافة جديد */}
        <div className="mb-4 flex justify-between items-center">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {showCreateForm ? 'إلغاء' : '+ إضافة جديد'}
          </button>
        </div>
        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="الاسم" value={createData.name || ''} onChange={e => setCreateData({...createData, name: e.target.value})} className="px-3 py-2 border rounded-lg" />
              <input placeholder="الوصف" value={createData.description || ''} onChange={e => setCreateData({...createData, description: e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <button onClick={() => createMutation.mutate(createData)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">حفظ</button>
          </div>
        )}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" aria-label="رفع">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">إعدادات الكليشة والختم</h2>
            <p className="text-gray-500">إدارة ترويسة الخطابات والختم والتوقيع الرسمي</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 ms-2" />
            معاينة
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 ms-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ms-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>

      {/* اختيار الفرع */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Building2 className="h-5 w-5 text-gray-500" />
            <Label>الفرع:</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent>
                {branches?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-md">
          <TabsTrigger value="letterhead" className="gap-2">
            <FileText className="h-4 w-4" />
            الترويسة
          </TabsTrigger>
          <TabsTrigger value="stamp" className="gap-2">
            <Stamp className="h-4 w-4" />
            الختم
          </TabsTrigger>
          <TabsTrigger value="signature" className="gap-2">
            <PenTool className="h-4 w-4" />
            التوقيع
          </TabsTrigger>
        </TabsList>

        {/* الترويسة */}
        <TabsContent value="letterhead" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ترويسة الخطابات (الكليشة)</CardTitle>
              <CardDescription>
                صورة الترويسة التي ستظهر في أعلى جميع الخطابات الرسمية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {letterhead ? (
                  <div className="space-y-4">
                    <img 
                      src={letterhead} 
                      alt="ترويسة الخطابات" 
                      className="max-h-40 mx-auto object-contain"
                    />
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => letterheadInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 ms-2" />
                        تغيير
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleRemove('letterhead')}
                      >
                        <Trash2 className="h-4 w-4 ms-2" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => letterheadInputRef.current?.click()}
                  >
                    <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">اضغط لرفع صورة الترويسة</p>
                    <p className="text-sm text-gray-400">PNG, JPG - الحد الأقصى 5MB</p>
                  </div>
                )}
                <input
                  ref={letterheadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'letterhead');
                  }}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">نصائح للترويسة المثالية:</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>استخدم صورة بدقة عالية (1200 × 300 بكسل على الأقل)</li>
                  <li>تأكد من أن الخلفية شفافة أو بيضاء</li>
                  <li>يجب أن تتضمن شعار الشركة واسمها ومعلومات الاتصال</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الختم */}
        <TabsContent value="stamp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ختم الشركة</CardTitle>
              <CardDescription>
                صورة الختم الرسمي الذي سيظهر في الخطابات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {stamp ? (
                  <div className="space-y-4">
                    <img 
                      src={stamp} 
                      alt="ختم الشركة" 
                      className="h-32 w-32 mx-auto object-contain"
                    />
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => stampInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 ms-2" />
                        تغيير
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleRemove('stamp')}
                      >
                        <Trash2 className="h-4 w-4 ms-2" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => stampInputRef.current?.click()}
                  >
                    <Stamp className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">اضغط لرفع صورة الختم</p>
                    <p className="text-sm text-gray-400">PNG بخلفية شفافة - الحد الأقصى 5MB</p>
                  </div>
                )}
                <input
                  ref={stampInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'stamp');
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التوقيع */}
        <TabsContent value="signature" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>التوقيع الرسمي</CardTitle>
              <CardDescription>
                صورة التوقيع الرسمي للمدير المعتمد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {signature ? (
                  <div className="space-y-4">
                    <img 
                      src={signature} 
                      alt="التوقيع" 
                      className="h-24 mx-auto object-contain"
                    />
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => signatureInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 ms-2" />
                        تغيير
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleRemove('signature')}
                      >
                        <Trash2 className="h-4 w-4 ms-2" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => signatureInputRef.current?.click()}
                  >
                    <PenTool className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">اضغط لرفع صورة التوقيع</p>
                    <p className="text-sm text-gray-400">PNG بخلفية شفافة - الحد الأقصى 5MB</p>
                  </div>
                )}
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'signature');
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* معاينة الخطاب */}
      <LetterPrintWrapper
        title="معاينة الخطاب"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        <AppointmentLetter
          letterNumber="LTR-2026-0001"
          letterDate={new Date().toLocaleDateString('ar-SA')}
          employeeName="أحمد محمد العلي"
          employeeNumber="EMP-001"
          nationalId="1234567890"
          department="تقنية المعلومات"
          position="مطور برمجيات"
          hireDate={new Date().toLocaleDateString('ar-SA')}
          salary="15,000"
          contractType="دائم"
          approvedBy={{
            name: "محمد أحمد",
            position: "المدير العام",
            signature: signature || undefined,
          }}
          companyName="شركة غيث للتقنية"
          branchName={currentBranch?.name}
          letterhead={letterhead || undefined}
          stamp={stamp || undefined}
        />
      </LetterPrintWrapper>
    </div>
  );
}
