import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Save, User, Briefcase, CreditCard, Phone, FileText, Upload, Mail, MessageSquare, Send, CheckCircle2, Shield, Loader2, AlertCircle, Building2, Users } from 'lucide-react';
import {
  useEmployees,
  useDepartments,
  useBranches,
  useRoles,
  usePositions,
  useCreateEmployee,
  useInviteEmployee
} from '@/services/hrService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppContext } from '@/contexts/AppContext';

export default function AddEmployee() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const [showInlineForm, setShowInlineForm] = useState(false);

  const { selectedRole: userRole, selectedBranchId } = useAppContext();
  const isLoadingAuth = false; // Assume auth is handled or get from context

  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [createdEmployeeId, setCreatedEmployeeId] = useState<number | null>(null);
  const [inviteMethod, setInviteMethod] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [sendInviteOnCreate, setSendInviteOnCreate] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  // قراءة معاملات URL لتعبئة القسم والدور تلقائياً
  const urlParams = new URLSearchParams(window.location.search);
  const preRole = urlParams.get('role') || 'EMPLOYEE';
  const preDeptId = urlParams.get('departmentId') || '';

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    departmentId: preDeptId, branchId: String(selectedBranchId || ''), positionId: '', roleCode: preRole,
    managerId: '', joinDate: new Date().toISOString().split('T')[0], workType: 'full_time',
    nationalId: '', nationality: '', dateOfBirth: '', gender: '', maritalStatus: '', address: '',
    emergencyName: '', emergencyRelation: '', emergencyPhone: '',
    bankName: '', bankAccount: '',
    basicSalary: '', housingAllowance: '', transportAllowance: '',
    city: '', iban: '',
  });

  // جلب البيانات من API
  const { data: departmentsData, isLoading: isLoadingDepts } = useDepartments({ branchId: formData.branchId ? parseInt(formData.branchId) : (selectedBranchId || null) });
  const allDepartments = departmentsData || [];
  const departments = allDepartments;
  const { data: branchesData, isLoading: isLoadingBranches } = useBranches();
  const branches = branchesData || [];
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles();
  const roles = (rolesData || []).filter((r: string) => r && r.trim() !== "").map((r: string) => ({
    id: r,
    name: r,
    nameAr: r === 'OWNER' ? 'مالك' : r === 'GENERAL_MANAGER' ? 'مدير عام' : r === 'DEPARTEMENT_MANAGER' ? 'مدير قسم' : r === 'SUPERVISOR' ? 'مشرف' : r === 'EMPLOYEE' ? 'موظف' : r === 'AGENT' ? 'مندوب' : r
  }));
  const { data: positionsData, isLoading: isLoadingPositions } = usePositions({ branchId: formData.branchId ? parseInt(formData.branchId) : (selectedBranchId || null) });
  const positions = positionsData || [];
  const { data: employeesData } = useEmployees();
  const managers = (employeesData || []).filter((e: any) =>
    e.user?.role === 'GENERAL_MANAGER' || e.user?.role === 'DEPARTEMENT_MANAGER'
  );

  const isLoading = isLoadingDepts || isLoadingBranches || isLoadingRoles || isLoadingPositions;

  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const createEmployeeMutation = useCreateEmployee();
  const sendInviteMutation = useInviteEmployee();

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) { toast.error('يرجى ملء الاسم والبريد الإلكتروني'); setActiveTab('personal'); return; }
    if (!formData.departmentId) { toast.error('يرجى تحديد القسم'); setActiveTab('work'); return; }
    setIsSubmitting(true);
    try {
      const data = await createEmployeeMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.departmentId ? { id: parseInt(formData.departmentId) } : undefined,
        position: formData.positionId ? { id: parseInt(formData.positionId) } : undefined,
        branch: formData.branchId ? { id: Number(formData.branchId) } : undefined,
        salary: formData.basicSalary ? parseFloat(formData.basicSalary) : undefined,
        role: formData.roleCode,
        status: 'active',
        // Also include full profile data if provided
        nationalId: formData.nationalId,
        nationality: formData.nationality,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        address: formData.address,
        city: formData.city,
        emergencyName: formData.emergencyName,
        emergencyRelation: formData.emergencyRelation,
        emergencyPhone: formData.emergencyPhone,
        bankName: formData.bankName,
        bankAccount: formData.bankAccount,
        iban: formData.iban,
      });

      toast.success('تم إضافة الموظف بنجاح');
      if (sendInviteOnCreate && data.id) {
        setCreatedEmployeeId(data.id);
        setShowInviteDialog(true);
      } else {
        navigate('/hr/employees');
      }
    } catch (err: any) {
      const apiError = err.response?.data?.message || err.response?.data?.error;
      if (err.response?.status === 409 || (apiError && apiError.includes('email'))) {
        toast.error(apiError || 'عذراً، البريد الإلكتروني الذي أدخلته مستخدم بالفعل لموظف آخر.');
      } else {
        toast.error(`فشل الحفظ: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) return <div className="p-8 text-center">جاري التحميل...</div>;


  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/employees"><Button variant="ghost" size="icon" aria-label="رفع"><ArrowRight className="h-5 w-5" /></Button></Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إضافة موظف جديد</h2>
            <p className="text-gray-500">أدخل البيانات الأساسية — الموظف سيُكمل بياناته عند تفعيل حسابه</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="autoApprove" checked={autoApprove} onCheckedChange={(c) => setAutoApprove(c as boolean)} />
            <Label htmlFor="autoApprove" className="text-sm cursor-pointer">قبول تلقائي</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sendInvite" checked={sendInviteOnCreate} onCheckedChange={(c) => setSendInviteOnCreate(c as boolean)} />
            <Label htmlFor="sendInvite" className="text-sm cursor-pointer">إرسال دعوة تفعيل</Label>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 ms-2 animate-spin" /> : <Save className="h-4 w-4 ms-2" />}
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الموظف'}
          </Button>
        </div>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">تدفق إضافة الموظف:</p>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded">1. أنت تُدخل البيانات الأساسية</span><span>←</span>
                <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded">2. يتم إرسال دعوة للموظف</span><span>←</span>
                <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded">3. الموظف يُفعّل ويُكمل بياناته</span><span>←</span>
                <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded">4. {autoApprove ? 'قبول تلقائي' : 'أنت تُراجع وتعتمد'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 w-full">
          <TabsTrigger value="personal" className="gap-2"><User className="h-4 w-4" />البيانات الأساسية</TabsTrigger>
          <TabsTrigger value="work" className="gap-2"><Briefcase className="h-4 w-4" />بيانات العمل</TabsTrigger>
          <TabsTrigger value="salary" className="gap-2"><CreditCard className="h-4 w-4" />الراتب</TabsTrigger>
          <TabsTrigger value="extra" className="gap-2"><Phone className="h-4 w-4" />بيانات إضافية</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" />الوثائق</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />البيانات الأساسية</CardTitle>
              <CardDescription>الحد الأدنى المطلوب — البيانات الشخصية الأخرى سيُكملها الموظف بنفسه</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>الاسم الأول <span className="text-red-500">*</span></Label>
                  <Input placeholder="أدخل الاسم الأول" value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>اسم العائلة <span className="text-red-500">*</span></Label>
                  <Input placeholder="أدخل اسم العائلة" value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني <span className="text-red-500">*</span></Label>
                  <Input type="email" placeholder="employee@company.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                  <p className="text-xs text-gray-500">سيُستخدم لتسجيل الدخول واستلام الدعوة</p>
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال</Label>
                  <Input placeholder="+966 5X XXX XXXX" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>رقم الهوية الوطنية</Label>
                <Input placeholder="اختياري — الموظف يُكمله عند التفعيل" value={formData.nationalId} onChange={(e) => updateField('nationalId', e.target.value)} />
              </div>
              <div className="flex justify-end"><Button onClick={() => setActiveTab('work')}>التالي: بيانات العمل</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />بيانات العمل</CardTitle>
              <CardDescription>حدد القسم والفرع والمسمى الوظيفي والدور</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" />الفرع</Label>
                  <Select value={formData.branchId} onValueChange={(v) => updateField('branchId', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                    <SelectContent>
                      {branches.length === 0 ? <div className="p-2 text-sm text-gray-500 text-center">لا توجد فروع — أضف من إدارة النظام</div> :
                        branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.nameAr || b.name}{b.city ? ` — ${b.city}` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Users className="h-4 w-4" />القسم <span className="text-red-500">*</span></Label>
                  <Select value={formData.departmentId} onValueChange={(v) => updateField('departmentId', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                    <SelectContent>
                      {departments.length === 0 ? <div className="p-2 text-sm text-gray-500 text-center">لا توجد أقسام — أضف من الإعدادات</div> :
                        departments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.nameAr || d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>المنصب</Label>
                  <Select value={formData.positionId} onValueChange={(v) => updateField('positionId', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر المنصب" /></SelectTrigger>
                    <SelectContent>
                      {positions.length === 0 ? <div className="p-2 text-sm text-gray-500 text-center">لا توجد مناصب — أضف من الإعدادات</div> :
                        positions.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Shield className="h-4 w-4" />الدور في النظام</Label>
                  <Select value={formData.roleCode} onValueChange={(v) => updateField('roleCode', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                    <SelectContent>
                      {roles.length > 0 ? roles.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#6b7280' }} />{r.nameAr || r.name}</span>
                        </SelectItem>
                      )) : <>
                        <SelectItem value="OWNER">مالك</SelectItem>
                        <SelectItem value="GENERAL_MANAGER">مدير عام</SelectItem>
                        <SelectItem value="DEPARTEMENT_MANAGER">مدير قسم</SelectItem>
                        <SelectItem value="SUPERVISOR">مشرف</SelectItem>
                        <SelectItem value="EMPLOYEE">موظف</SelectItem>
                        <SelectItem value="AGENT">مندوب</SelectItem>
                      </>}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">الدور يحدد صلاحيات الموظف (موظف، مشرف، مدير قسم...)</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>المدير المباشر</Label>
                  <Select value={formData.managerId} onValueChange={(v) => updateField('managerId', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر المدير المباشر (اختياري)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مدير مباشر</SelectItem>
                      {managers.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.firstName} {m.lastName} — {(typeof m.position === 'object' ? m.position?.title : m.position) || (typeof m.department === 'object' ? (m.department?.nameAr || m.department?.name) : m.department) || "موظف"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الالتحاق</Label>
                  <Input type="date" value={formData.joinDate} onChange={(e) => updateField('joinDate', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2" style={{ maxWidth: '50%' }}>
                <Label>نوع العمل</Label>
                <Select value={formData.workType} onValueChange={(v) => updateField('workType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">دوام كامل</SelectItem>
                    <SelectItem value="part_time">دوام جزئي</SelectItem>
                    <SelectItem value="contract">عقد مؤقت</SelectItem>
                    <SelectItem value="remote">عمل عن بعد</SelectItem>
                    <SelectItem value="internship">تدريب تعاوني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('personal')}>السابق</Button>
                <Button onClick={() => setActiveTab('salary')}>التالي: الراتب</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />الراتب والبدلات</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2"><Label>الراتب الأساسي (ر.س)</Label><Input type="number" placeholder="0" value={formData.basicSalary} onChange={(e) => updateField('basicSalary', e.target.value)} /></div>
                <div className="space-y-2"><Label>بدل السكن (ر.س)</Label><Input type="number" placeholder="0" value={formData.housingAllowance} onChange={(e) => updateField('housingAllowance', e.target.value)} /></div>
                <div className="space-y-2"><Label>بدل النقل (ر.س)</Label><Input type="number" placeholder="0" value={formData.transportAllowance} onChange={(e) => updateField('transportAllowance', e.target.value)} /></div>
              </div>
              {formData.basicSalary && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">ملخص الراتب الشهري:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-gray-500">أساسي:</span> <span className="font-bold">{Number(formData.basicSalary || 0).toLocaleString('ar-SA')}</span></div>
                    <div><span className="text-gray-500">سكن:</span> <span className="font-bold">{Number(formData.housingAllowance || 0).toLocaleString('ar-SA')}</span></div>
                    <div><span className="text-gray-500">نقل:</span> <span className="font-bold">{Number(formData.transportAllowance || 0).toLocaleString('ar-SA')}</span></div>
                    <div><span className="text-gray-500">الإجمالي:</span> <span className="font-bold text-green-600">{(Number(formData.basicSalary || 0) + Number(formData.housingAllowance || 0) + Number(formData.transportAllowance || 0)).toLocaleString('ar-SA')} ر.س</span></div>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('work')}>السابق</Button>
                <Button onClick={() => setActiveTab('extra')}>التالي</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extra">
          <Card>
            <CardHeader><CardTitle>بيانات إضافية (اختيارية)</CardTitle><CardDescription>يمكن للموظف إكمالها عند تفعيل حسابه</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2"><Label>الجنسية</Label>
                  <Select value={formData.nationality} onValueChange={(v) => updateField('nationality', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {['سعودي', 'مصري', 'أردني', 'سوري', 'يمني', 'هندي', 'باكستاني', 'فلبيني', 'أخرى'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>تاريخ الميلاد</Label><Input type="date" value={formData.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} /></div>
                <div className="space-y-2"><Label>الجنس</Label>
                  <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4 flex items-center gap-2"><Phone className="h-4 w-4" />جهة اتصال الطوارئ</h4>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label>الاسم</Label><Input placeholder="اسم جهة الاتصال" value={formData.emergencyName} onChange={(e) => updateField('emergencyName', e.target.value)} required /></div>
                  <div className="space-y-2"><Label>صلة القرابة</Label>
                    <Select value={formData.emergencyRelation} onValueChange={(v) => updateField('emergencyRelation', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>{['أب', 'أم', 'أخ/أخت', 'زوج/زوجة', 'ابن/ابنة', 'صديق', 'أخرى'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>رقم الجوال</Label><Input placeholder="+966 5X XXX XXXX" value={formData.emergencyPhone} onChange={(e) => updateField('emergencyPhone', e.target.value)} /></div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('salary')}>السابق</Button>
                <Button onClick={() => setActiveTab('documents')}>التالي: الوثائق</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle>الوثائق والمستندات</CardTitle><CardDescription>يمكنك رفع الوثائق الآن أو تركها للموظف</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {['صورة الهوية الوطنية', 'صورة جواز السفر', 'الشهادة التعليمية', 'السيرة الذاتية'].map((doc, i) => (
                  <div key={doc ?? `div-${i}`} className="space-y-2">
                    <Label>{doc}</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">اسحب الملف أو اضغط للاختيار</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setActiveTab('extra')}>السابق</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 ms-2 animate-spin" /> : <Save className="h-4 w-4 ms-2" />}
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الموظف'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showInviteDialog} onOpenChange={(open) => { if (!open) { setShowInviteDialog(false); navigate('/hr/employees'); } }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              تم إضافة الموظف بنجاح
            </DialogTitle>
            <DialogDescription>
              {autoApprove ? 'الموظف مُفعّل تلقائياً.' : 'سيتم إرسال دعوة للموظف. بعد التفعيل ستحتاج للمراجعة.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label>طريقة الإرسال</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[{ v: 'email' as const, icon: Mail, l: 'البريد' }, { v: 'whatsapp' as const, icon: MessageSquare, l: 'واتساب' }, { v: 'both' as const, icon: Send, l: 'كلاهما' }].map(m => (
                <Button key={m.v} variant={inviteMethod === m.v ? 'default' : 'outline'} className="flex flex-col items-center gap-2 h-auto py-4" onClick={() => setInviteMethod(m.v)}>
                  <m.icon className="h-5 w-5" /><span className="text-xs">{m.l}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => { setShowInviteDialog(false); navigate('/hr/employees'); }}>تخطي</Button>
            <Button
              onClick={() => createdEmployeeId && sendInviteMutation.mutate({ employeeId: createdEmployeeId, method: inviteMethod }, {
                onSuccess: () => {
                  toast.success('تم إرسال الدعوة بنجاح');
                  setShowInviteDialog(false);
                  navigate('/hr/employees');
                }
              })}
              disabled={sendInviteMutation.isPending}
            >
              {sendInviteMutation.isPending ? 'جاري الإرسال...' : 'إرسال الدعوة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
