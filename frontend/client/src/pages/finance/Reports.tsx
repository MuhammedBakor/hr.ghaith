import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, BookOpen, Receipt, RefreshCw, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PrintButton } from "@/components/PrintButton";

// تكوين أنواع الحسابات
const accountTypeConfig: Record<string, { label: string; color: string }> = {
  asset: { label: "أصول", color: "bg-blue-100 text-blue-800" },
  liability: { label: "خصوم", color: "bg-red-100 text-red-800" },
  equity: { label: "حقوق ملكية", color: "bg-purple-100 text-purple-800" },
  revenue: { label: "إيرادات", color: "bg-green-100 text-green-800" },
  expense: { label: "مصروفات", color: "bg-amber-100 text-amber-800" },
};

// تنسيق المبالغ
function formatAmount(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export default function FinanceReports() {
  const { data: currentUser, isError, error} = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("trial-balance");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    accountType: "",
    includeZeroBalances: false,
  });

  // جلب ميزان المراجعة
  const { data: trialBalance, isLoading: loadingTB, refetch: refetchTB } = useQuery({
    queryKey: ['finance', 'reports', 'trial-balance', filters],
    queryFn: () => api.get('/finance/reports/trial-balance', {
      params: filters.fromDate || filters.toDate ? {
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        accountType: filters.accountType || undefined,
        includeZeroBalances: filters.includeZeroBalances,
      } : undefined,
    }).then(r => r.data),
    enabled: activeTab === "trial-balance",
  });

  // جلب دفتر الأستاذ
  const { data: generalLedger, isLoading: loadingGL, refetch: refetchGL } = useQuery({
    queryKey: ['finance', 'reports', 'general-ledger', selectedAccountId],
    queryFn: () => api.get('/finance/reports/general-ledger', {
      params: { accountId: selectedAccountId || undefined, limit: 100 },
    }).then(r => r.data),
    enabled: activeTab === "general-ledger",
  });

  // جلب كشف حساب
  const { data: accountStatement, isLoading: loadingAS, refetch: refetchAS } = useQuery({
    queryKey: ['finance', 'reports', 'account-statement', selectedAccountId],
    queryFn: () => api.get('/finance/reports/account-statement', {
      params: { accountId: selectedAccountId || 1, includeOpeningBalance: true },
    }).then(r => r.data),
    enabled: activeTab === "account-statement" && !!selectedAccountId,
  });

  // جلب قائمة الحسابات للاختيار
  const { data: accounts } = useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: () => api.get('/finance/accounts').then(r => r.data),
  });

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">التقارير المالية</h2>
          <p className="text-gray-500">ميزان المراجعة، دفتر الأستاذ، وكشف الحساب</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (activeTab === "trial-balance") refetchTB();
            else if (activeTab === "general-ledger") refetchGL();
            else if (activeTab === "account-statement") refetchAS();
          }}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="trial-balance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ميزان المراجعة
          </TabsTrigger>
          <TabsTrigger value="general-ledger" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            دفتر الأستاذ
          </TabsTrigger>
          <TabsTrigger value="account-statement" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            كشف حساب
          </TabsTrigger>
        </TabsList>

        {/* ميزان المراجعة */}
        <TabsContent value="trial-balance" className="space-y-4">
          {/* فلاتر */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                خيارات التقرير
              </CardTitle>
              <PrintButton title="التقرير" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع الحساب</Label>
                  <Select
                    value={filters.accountType}
                    onValueChange={(value) => setFilters({ ...filters, accountType: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="asset">أصول</SelectItem>
                      <SelectItem value="liability">خصوم</SelectItem>
                      <SelectItem value="equity">حقوق ملكية</SelectItem>
                      <SelectItem value="revenue">إيرادات</SelectItem>
                      <SelectItem value="expense">مصروفات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => refetchTB()} className="w-full">
                    <RefreshCw className="h-4 w-4 ms-2" />
                    تطبيق
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* حالة التوازن */}
          {trialBalance && (
            <Card className={trialBalance.isBalanced ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {trialBalance.isBalanced ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${trialBalance.isBalanced ? "text-green-800" : "text-red-800"}`}>
                        {trialBalance.isBalanced ? "الميزان متوازن" : "الميزان غير متوازن"}
                      </p>
                      <p className="text-sm text-gray-600">
                        تم التوليد في: {format(new Date(trialBalance.generatedAt), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="text-start">
                    <p className="text-sm text-gray-600">الفرق</p>
                    <p className={`text-lg font-bold ${trialBalance.isBalanced ? "text-green-600" : "text-red-600"}`}>
                      {formatAmount(Math.abs(trialBalance?.totals?.closingDebit - trialBalance?.totals?.closingCredit))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* جدول ميزان المراجعة */}
          <Card>
            <CardHeader>
              <CardTitle>ميزان المراجعة</CardTitle>
              <CardDescription>
                عرض أرصدة جميع الحسابات مع حركة الفترة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTB ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={_.id ?? `Skeleton-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-end">رمز الحساب</TableHead>
                        <TableHead className="text-end">اسم الحساب</TableHead>
                        <TableHead className="text-end">النوع</TableHead>
                        <TableHead className="text-start">مدين الفترة</TableHead>
                        <TableHead className="text-start">دائن الفترة</TableHead>
                        <TableHead className="text-start">الرصيد المدين</TableHead>
                        <TableHead className="text-start">الرصيد الدائن</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance?.accounts.map((account) => (
                        <TableRow key={account.accountId} className="hover:bg-gray-50">
                          <TableCell className="font-mono">{account.accountCode}</TableCell>
                          <TableCell className="font-medium">{account.accountName}</TableCell>
                          <TableCell>
                            <Badge className={accountTypeConfig[account.accountType]?.color || "bg-gray-100"}>
                              {accountTypeConfig[account.accountType]?.label || account.accountType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-start font-mono">
                            {account.periodDebit > 0 ? formatAmount(account.periodDebit) : "-"}
                          </TableCell>
                          <TableCell className="text-start font-mono">
                            {account.periodCredit > 0 ? formatAmount(account.periodCredit) : "-"}
                          </TableCell>
                          <TableCell className="text-start font-mono text-blue-600">
                            {account.closingDebit > 0 ? formatAmount(account.closingDebit) : "-"}
                          </TableCell>
                          <TableCell className="text-start font-mono text-red-600">
                            {account.closingCredit > 0 ? formatAmount(account.closingCredit) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {trialBalance && (
                      <TableFooter>
                        <TableRow className="bg-gray-100 font-bold">
                          <TableCell colSpan={3}>الإجمالي</TableCell>
                          <TableCell className="text-start font-mono">
                            {formatAmount(trialBalance?.totals?.periodDebit)}
                          </TableCell>
                          <TableCell className="text-start font-mono">
                            {formatAmount(trialBalance?.totals?.periodCredit)}
                          </TableCell>
                          <TableCell className="text-start font-mono text-blue-600">
                            {formatAmount(trialBalance?.totals?.closingDebit)}
                          </TableCell>
                          <TableCell className="text-start font-mono text-red-600">
                            {formatAmount(trialBalance?.totals?.closingCredit)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              )}
              
              {trialBalance?.accounts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد حسابات بأرصدة في الفترة المحددة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* دفتر الأستاذ */}
        <TabsContent value="general-ledger" className="space-y-4">
          {/* اختيار الحساب */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                اختيار الحساب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>الحساب</Label>
                  <Select
                    value={selectedAccountId?.toString() || ""}
                    onValueChange={(value) => setSelectedAccountId(value && value !== 'all' ? Number(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حساباً لعرض حركاته" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحسابات</SelectItem>
                      {accounts?.map((account: any) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountCode} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => refetchGL()} className="w-full">
                    <RefreshCw className="h-4 w-4 ms-2" />
                    عرض
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ملخص */}
          {generalLedger && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">إجمالي المدين</p>
                      <p className="text-2xl font-bold text-blue-600">{formatAmount(generalLedger?.summary?.totalDebit)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">إجمالي الدائن</p>
                      <p className="text-2xl font-bold text-red-600">{formatAmount(generalLedger?.summary?.totalCredit)}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">صافي الحركة</p>
                      <p className={`text-2xl font-bold ${generalLedger?.summary?.netMovement >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatAmount(generalLedger?.summary?.netMovement)}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-gray-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">الرصيد الختامي</p>
                      <p className="text-2xl font-bold">{formatAmount(generalLedger?.summary?.closingBalance)}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-gray-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* جدول الحركات */}
          <Card>
            <CardHeader>
              <CardTitle>دفتر الأستاذ العام</CardTitle>
              <CardDescription>
                جميع الحركات المحاسبية المرحّلة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGL ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={_.id ?? `Skeleton-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-end">التاريخ</TableHead>
                        <TableHead className="text-end">رقم القيد</TableHead>
                        <TableHead className="text-end">الحساب</TableHead>
                        <TableHead className="text-end">البيان</TableHead>
                        <TableHead className="text-start">مدين</TableHead>
                        <TableHead className="text-start">دائن</TableHead>
                        <TableHead className="text-start">الرصيد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generalLedger?.entries.map((entry, index) => (
                        <TableRow key={`${entry.entryId}-${index}`} className="hover:bg-gray-50">
                          <TableCell>
                            {format(new Date(entry.entryDate), "dd/MM/yyyy", { locale: ar })}
                          </TableCell>
                          <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-500">{entry.accountCode}</span>
                            <br />
                            <span className="text-sm">{entry.accountName}</span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                          <TableCell className="text-start font-mono text-blue-600">
                            {entry.debit > 0 ? formatAmount(entry.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-start font-mono text-red-600">
                            {entry.credit > 0 ? formatAmount(entry.credit) : "-"}
                          </TableCell>
                          <TableCell className="text-start font-mono font-semibold">
                            {formatAmount(entry.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {generalLedger?.entries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد حركات مرحّلة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* كشف حساب */}
        <TabsContent value="account-statement" className="space-y-4">
          {/* اختيار الحساب */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                اختيار الحساب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>الحساب</Label>
                  <Select
                    value={selectedAccountId?.toString() || ""}
                    onValueChange={(value) => setSelectedAccountId(value && value !== 'all' ? Number(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حساباً لعرض كشفه" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account: any) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountCode} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => refetchAS()} disabled={!selectedAccountId} className="w-full">
                    <RefreshCw className="h-4 w-4 ms-2" />
                    عرض الكشف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!selectedAccountId && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>اختر حساباً لعرض كشفه</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedAccountId && accountStatement && (
            <>
              {/* معلومات الحساب */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">الحساب</p>
                      <p className="text-lg font-semibold">
                        {accountStatement?.account?.code} - {accountStatement?.account?.name}
                      </p>
                      <Badge className={accountTypeConfig[accountStatement?.account?.type]?.color || "bg-gray-100"}>
                        {accountTypeConfig[accountStatement?.account?.type]?.label || accountStatement?.account?.type}
                      </Badge>
                    </div>
                    <div className="text-start">
                      <p className="text-sm text-gray-500">الرصيد الختامي</p>
                      <p className={`text-2xl font-bold ${accountStatement.closingBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatAmount(accountStatement.closingBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ملخص */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">الرصيد الافتتاحي</p>
                    <p className="text-xl font-bold">{formatAmount(accountStatement.openingBalance)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">إجمالي المدين</p>
                    <p className="text-xl font-bold text-blue-600">{formatAmount(accountStatement?.summary?.totalDebit)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">إجمالي الدائن</p>
                    <p className="text-xl font-bold text-red-600">{formatAmount(accountStatement?.summary?.totalCredit)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-500">صافي الحركة</p>
                    <p className={`text-xl font-bold ${accountStatement?.summary?.netMovement >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatAmount(accountStatement?.summary?.netMovement)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* جدول الحركات */}
              <Card>
                <CardHeader>
                  <CardTitle>كشف الحساب</CardTitle>
                  <CardDescription>
                    جميع الحركات على الحساب المحدد
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAS ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={_.id ?? `Skeleton-${i}`} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-end">التاريخ</TableHead>
                            <TableHead className="text-end">رقم القيد</TableHead>
                            <TableHead className="text-end">البيان</TableHead>
                            <TableHead className="text-end">المرجع</TableHead>
                            <TableHead className="text-start">مدين</TableHead>
                            <TableHead className="text-start">دائن</TableHead>
                            <TableHead className="text-start">الرصيد</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* سطر الرصيد الافتتاحي */}
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={4} className="font-semibold">الرصيد الافتتاحي</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-start font-mono font-semibold">
                              {formatAmount(accountStatement.openingBalance)}
                            </TableCell>
                          </TableRow>
                          {accountStatement?.transactions?.map((tx, index) => (
                            <TableRow key={tx.id ?? `TableRow-${index}`} className="hover:bg-gray-50">
                              <TableCell>
                                {format(new Date(tx.date), "dd/MM/yyyy", { locale: ar })}
                              </TableCell>
                              <TableCell className="font-mono">{tx.entryNumber}</TableCell>
                              <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                              <TableCell className="text-gray-500">{tx.reference || "-"}</TableCell>
                              <TableCell className="text-start font-mono text-blue-600">
                                {tx.debit > 0 ? formatAmount(tx.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-start font-mono text-red-600">
                                {tx.credit > 0 ? formatAmount(tx.credit) : "-"}
                              </TableCell>
                              <TableCell className="text-start font-mono font-semibold">
                                {formatAmount(tx.balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow className="bg-gray-100 font-bold">
                            <TableCell colSpan={4}>الرصيد الختامي</TableCell>
                            <TableCell className="text-start font-mono text-blue-600">
                              {formatAmount(accountStatement?.summary?.totalDebit)}
                            </TableCell>
                            <TableCell className="text-start font-mono text-red-600">
                              {formatAmount(accountStatement?.summary?.totalCredit)}
                            </TableCell>
                            <TableCell className="text-start font-mono">
                              {formatAmount(accountStatement.closingBalance)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  )}
                  
                  {accountStatement?.transactions?.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد حركات على هذا الحساب</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
