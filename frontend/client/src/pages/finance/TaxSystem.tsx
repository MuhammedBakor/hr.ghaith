import { useState } from "react";
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Calculator,
  FileText,
  Percent,
  DollarSign,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

// دالة توليد رمز الضريبة التلقائي
const generateTaxCode = (type: string) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => b.toString(36)).join("").substring(0, 4).toUpperCase();
  const prefix = type === 'vat' ? 'VAT' : type === 'withholding' ? 'WTH' : type === 'zakat' ? 'ZKT' : 'TAX';
  return `${prefix}-${timestamp.slice(-4)}${random}`;
};

const taxTypeConfig: Record<string, { label: string; color: string }> = {
  vat: { label: "ضريبة القيمة المضافة", color: "bg-blue-100 text-blue-700" },
  withholding: { label: "ضريبة الاستقطاع", color: "bg-purple-100 text-purple-700" },
  zakat: { label: "الزكاة", color: "bg-green-100 text-green-700" },
  customs: { label: "الجمارك", color: "bg-amber-100 text-amber-700" },
  other: { label: "أخرى", color: "bg-gray-100 text-gray-700" },
};

type ViewMode = 'list' | 'add';

export default function TaxSystem() {
  const [editingItem, setEditingItem] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/finance/tax/rates/${data.id}`).then(r => r.data),
    onSuccess: () => { refetch(); },
  });

  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'finance_manager';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState("rates");
  const [calcAmount, setCalcAmount] = useState<number>(0);
  const [selectedTaxRateId, setSelectedTaxRateId] = useState<number | null>(null);
  const [taxPeriod, setTaxPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  
  // Form state
  const [code, setCode] = useState(generateTaxCode('vat'));
  const [name, setName] = useState("");
  const [taxType, setTaxType] = useState<"vat" | "withholding" | "zakat" | "customs" | "other">("vat");
  const [rate, setRate] = useState<number>(15);
  const [appliesTo, setAppliesTo] = useState<"sales" | "purchases" | "both">("both");
  const [description, setDescription] = useState("");
  
  const { data: taxRates, isLoading, refetch } = useQuery({
    queryKey: ['finance', 'tax', 'rates'],
    queryFn: () => api.get('/finance/tax/rates').then(r => r.data),
  });
  const { data: taxReport } = useQuery({
    queryKey: ['finance', 'tax', 'report', taxPeriod],
    queryFn: () => api.get('/finance/tax/report', { params: { taxPeriod } }).then(r => r.data),
  });
  const { data: zakatCalc } = useQuery({
    queryKey: ['finance', 'tax', 'zakat', fiscalYear],
    queryFn: () => api.get('/finance/tax/calculate-zakat', { params: { fiscalYear } }).then(r => r.data),
  });
  const { data: calcResult } = useQuery({
    queryKey: ['finance', 'tax', 'calculate', calcAmount, selectedTaxRateId],
    queryFn: () => api.get('/finance/tax/calculate', { params: { amount: calcAmount, taxRateId: selectedTaxRateId || undefined } }).then(r => r.data),
    enabled: calcAmount > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/finance/tax/rates', data).then(r => r.data),
    onSuccess: () => {
      toast.success("تم إنشاء معدل الضريبة بنجاح");
      setViewMode('list');
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(`خطأ: ${error?.response?.data?.message || error.message}`);
    },
  });
  
  const resetForm = () => {
    setCode(generateTaxCode('vat'));
    setName("");
    setTaxType("vat");
    setRate(15);
    setAppliesTo("both");
    setDescription("");
  };

  const handleTaxTypeChange = (type: "vat" | "withholding" | "zakat" | "customs" | "other") => {
    setTaxType(type);
    setCode(generateTaxCode(type));
  };
  
  const handleCreate = () => {
    if (!name) {
      toast.error("يرجى إدخال الاسم");
      return;
    }
    
    createMutation.mutate({
      code,
      name,
      taxType,
      rate,
      appliesTo,
      description,
    });
  };

  // نموذج إضافة معدل ضريبة جديد
  if (viewMode === 'add') {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    
    return (
      <div className="space-y-6" dir="rtl">
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للقائمة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إضافة معدل ضريبة جديد</h1>
            <p className="text-muted-foreground">أدخل بيانات معدل الضريبة</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              بيانات معدل الضريبة
            </CardTitle>
              <PrintButton title="التقرير" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الرمز (تلقائي)</Label>
                  <Input
                    value={code}
                    disabled
                    className="bg-muted font-mono"
                   placeholder="أدخل القيمة" />
                </div>
                <div className="space-y-2">
                  <Label>الاسم *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ضريبة القيمة المضافة 15%"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الضريبة</Label>
                  <Select value={taxType} onValueChange={handleTaxTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vat">ضريبة القيمة المضافة</SelectItem>
                      <SelectItem value="withholding">ضريبة الاستقطاع</SelectItem>
                      <SelectItem value="zakat">الزكاة</SelectItem>
                      <SelectItem value="customs">الجمارك</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>النسبة (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>تطبق على</Label>
                <Select value={appliesTo} onValueChange={(v: any) => setAppliesTo(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">المبيعات فقط</SelectItem>
                    <SelectItem value="purchases">المشتريات فقط</SelectItem>
                    <SelectItem value="both">المبيعات والمشتريات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف معدل الضريبة..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ms-2" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ms-2" />
                    إنشاء
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض القائمة
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">نظام الضرائب والزكاة</h2>
          <p className="text-muted-foreground">إدارة معدلات الضرائب والتقارير الضريبية</p>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="rates" className="gap-2">
            <Percent className="h-4 w-4" />
            معدلات الضرائب
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            حاسبة الضريبة
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-2">
            <FileText className="h-4 w-4" />
            تقرير الضريبة
          </TabsTrigger>
          <TabsTrigger value="zakat" className="gap-2">
            <Receipt className="h-4 w-4" />
            حساب الزكاة
          </TabsTrigger>
        </TabsList>
        
        {/* Tax Rates Tab */}
        <TabsContent value="rates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setViewMode('add')}>
              <Plus className="h-4 w-4 ms-2" />
              معدل ضريبة جديد
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>قائمة معدلات الضرائب</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-end">الرمز</TableHead>
                      <TableHead className="text-end">الاسم</TableHead>
                      <TableHead className="text-end">النوع</TableHead>
                      <TableHead className="text-end">النسبة</TableHead>
                      <TableHead className="text-end">تطبق على</TableHead>
                      <TableHead className="text-end">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRates?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">لا توجد معدلات ضرائب</p>
                          <Button variant="link" onClick={() => setViewMode('add')}>
                            إضافة معدل ضريبة جديد
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      taxRates?.filter((item: any) => !searchTerm || JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase()))?.map((taxRate: any) => {
                        const type = taxTypeConfig[taxRate.taxType] || taxTypeConfig.other;
                        return (
                          <TableRow key={taxRate.id}>
                            <TableCell className="font-mono">{taxRate.code}</TableCell>
                            <TableCell className="font-medium">{taxRate.name}</TableCell>
                            <TableCell>
                              <Badge className={type.color}>{type.label}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{parseFloat(taxRate.rate)}%</TableCell>
                            <TableCell>
                              {taxRate.appliesTo === "sales" ? "المبيعات" : 
                               taxRate.appliesTo === "purchases" ? "المشتريات" : "الكل"}
                            </TableCell>
                            <TableCell>
                              <Badge className={taxRate.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                                {taxRate.isActive ? "نشط" : "غير نشط"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  حاسبة الضريبة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>المبلغ (ر.س)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                    placeholder="أدخل المبلغ"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>معدل الضريبة (اختياري)</Label>
                  <Select 
                    value={selectedTaxRateId?.toString() || "default"} 
                    onValueChange={(v) => setSelectedTaxRateId(v === "default" ? null : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="استخدام المعدل الافتراضي (15%)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">المعدل الافتراضي (15%)</SelectItem>
                      {taxRates?.map((tr: any) => (
                        <SelectItem key={tr.id} value={tr.id.toString()}>
                          {tr.name} ({parseFloat(tr.rate)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  النتيجة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calcResult ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">المبلغ الأساسي</span>
                      <span className="font-medium">{calcResult?.baseAmount?.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">نسبة الضريبة</span>
                      <span className="font-medium">{calcResult.taxRate}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">مبلغ الضريبة</span>
                      <span className="font-medium text-amber-600">{calcResult?.taxAmount?.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-muted/50 px-3 rounded-lg">
                      <span className="font-semibold">الإجمالي شامل الضريبة</span>
                      <span className="font-bold text-lg text-primary">{calcResult?.totalAmount?.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  
                <div className="flex gap-2 mt-2"> <button onClick={() => setEditingItem(taxRate)} className="text-blue-600 hover:text-blue-800 text-sm">تعديل</button> <button onClick={() => window.confirm("هل أنت متأكد من الحذف؟") && deleteMutation.mutate({id: taxRate.id})} className="text-red-600 hover:text-red-800 text-sm">حذف</button></div>
              </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    أدخل مبلغاً لحساب الضريبة
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tax Report Tab */}
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  تقرير الضريبة
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label>الفترة:</Label>
                  <Input
                    type="month"
                    value={taxPeriod}
                    onChange={(e) => setTaxPeriod(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {taxReport ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">ضريبة المخرجات (المبيعات)</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {taxReport?.outputTax?.toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">ضريبة المدخلات (المشتريات)</p>
                      <p className="text-2xl font-bold text-green-700">
                        {taxReport?.inputTax?.toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${taxReport.netTax >= 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                      <p className={`text-sm ${taxReport.netTax >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {taxReport.netTax >= 0 ? 'ضريبة مستحقة' : 'رصيد دائن'}
                      </p>
                      <p className={`text-2xl font-bold ${taxReport.netTax >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {Math.abs(taxReport.netTax).toLocaleString('ar-SA')} ر.س
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-4">ملخص الفترة</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">إجمالي المبيعات</span>
                        <span className="font-medium">{taxReport?.totalSales?.toLocaleString('ar-SA')} ر.س</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">إجمالي المشتريات</span>
                        <span className="font-medium">{taxReport?.totalPurchases?.toLocaleString('ar-SA')} ر.س</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center py-2 bg-muted/50 px-3 rounded-lg">
                      <span className="font-semibold">حالة الإقرار</span>
                      <span className={`font-medium ${taxReport.status === 'filed' ? 'text-green-600' : 'text-amber-600'}`}>
                        {taxReport.status === 'filed' ? 'مقدم' : 'قيد الإعداد'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات للفترة المحددة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Zakat Tab */}
        <TabsContent value="zakat" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  حساب الزكاة
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label>السنة المالية:</Label>
                  <Input
                    type="number"
                    min="2020"
                    max="2030"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-24"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {zakatCalc ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">الوعاء الزكوي</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">المخزون</span>
                          <span>{zakatCalc?.breakdown?.inventory.toLocaleString('ar-SA')} ر.س</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">النقدية</span>
                          <span>{zakatCalc?.breakdown?.cash.toLocaleString('ar-SA')} ر.س</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">الذمم المدينة</span>
                          <span>{zakatCalc?.breakdown?.receivables.toLocaleString('ar-SA')} ر.س</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">الحسميات</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">الذمم الدائنة</span>
                          <span className="text-red-600">({zakatCalc?.breakdown?.payables.toLocaleString('ar-SA')}) ر.س</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-semibold">صافي الوعاء الزكوي</span>
                      <span className="font-bold text-lg">{zakatCalc?.zakatBase?.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">نسبة الزكاة</span>
                      <span>{zakatCalc.zakatRate}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-green-100 px-3 rounded-lg">
                      <span className="font-bold text-green-800">الزكاة المستحقة</span>
                      <span className="font-bold text-xl text-green-700">{zakatCalc?.zakatAmount?.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات للسنة المالية المحددة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
