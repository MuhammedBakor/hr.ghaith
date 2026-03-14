import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type ComparisonCategory =
  | 'employees' | 'attendance' | 'leaves' | 'allowances' | 'accounts'
  | 'outgoing'  | 'incoming'  | 'invoices' | 'subscriptions' | 'governance' | 'tax';

interface MetricRow {
  label: string;
  v1: number;
  v2: number;
  unit?: string;
  higherIsBetter?: boolean;
  format?: 'number' | 'percent' | 'currency';
}

// ─── Category tabs config ─────────────────────────────────────────────────────
const CATEGORIES: { id: ComparisonCategory; label: string; icon: string }[] = [
  { id: 'employees',     label: 'الموظفين',         icon: '👥' },
  { id: 'attendance',    label: 'الحضور',            icon: '🕐' },
  { id: 'leaves',        label: 'الإجازات',          icon: '📅' },
  { id: 'allowances',    label: 'العلاوات',          icon: '💰' },
  { id: 'accounts',      label: 'الحسابات',          icon: '📊' },
  { id: 'outgoing',      label: 'الصادرات',          icon: '📤' },
  { id: 'incoming',      label: 'الواردات',          icon: '📥' },
  { id: 'invoices',      label: 'فواتير الخدمات',    icon: '🧾' },
  { id: 'subscriptions', label: 'الاشتراكات',        icon: '💳' },
  { id: 'governance',    label: 'الحوكمة',           icon: '🛡️' },
  { id: 'tax',           label: 'الضريبة والدخل',    icon: '📋' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtVal(n: number, format?: 'number' | 'percent' | 'currency'): string {
  if (format === 'currency') return n.toLocaleString('ar-SA') + ' ر.س';
  if (format === 'percent')  return n.toFixed(1) + '%';
  return n.toLocaleString('ar-SA');
}

function DeltaPill({ v1, v2, higherIsBetter }: { v1: number; v2: number; higherIsBetter?: boolean }) {
  if (v1 === v2) return <span className="text-xs text-gray-400 font-bold">متساوٍ</span>;
  const diff = v1 - v2;
  const pct = v2 !== 0 ? Math.abs((diff / v2) * 100).toFixed(1) : null;
  const entity1Wins = higherIsBetter === undefined ? null : (higherIsBetter ? diff > 0 : diff < 0);
  const green = entity1Wins === true ? true : entity1Wins === false ? false : diff > 0;
  return (
    <span className={cn(
      'inline-block text-xs font-black px-2 py-0.5 rounded-full',
      green ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    )}>
      {diff > 0 ? '↑' : '↓'} {pct !== null ? `${pct}%` : Math.abs(diff).toLocaleString()}
    </span>
  );
}

// ─── Metric table row ─────────────────────────────────────────────────────────
function MetricTable({ rows, lbl1, lbl2 }: { rows: MetricRow[]; lbl1: string; lbl2: string }) {
  if (!rows.length) return (
    <p className="text-center text-gray-400 py-10 text-sm">لا توجد بيانات كافية للمقارنة</p>
  );
  const max1 = Math.max(...rows.map(r => r.v1), 1);
  const max2 = Math.max(...rows.map(r => r.v2), 1);
  const absMax = Math.max(max1, max2);
  return (
    <div className="space-y-4">
      {rows.map((r, i) => {
        const pct1 = (r.v1 / absMax) * 100;
        const pct2 = (r.v2 / absMax) * 100;
        const entity1Wins = r.higherIsBetter === undefined ? null : (r.higherIsBetter ? r.v1 > r.v2 : r.v1 < r.v2);
        return (
          <div key={i} className="rounded-xl border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black text-gray-800">{r.label}</span>
              {r.v1 !== r.v2 && (
                <span className={cn(
                  'text-xs font-black px-2.5 py-1 rounded-full',
                  entity1Wins === true  ? 'bg-blue-100 text-blue-700' :
                  entity1Wins === false ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-500'
                )}>
                  {entity1Wins === true ? `الأفضل: ${lbl1}` : entity1Wins === false ? `الأفضل: ${lbl2}` : '—'}
                </span>
              )}
            </div>
            {/* Entity 1 bar */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-blue-600 font-bold truncate max-w-[180px]">{lbl1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-blue-700">{fmtVal(r.v1, r.format)}</span>
                  {r.v1 !== r.v2 && <DeltaPill v1={r.v1} v2={r.v2} higherIsBetter={r.higherIsBetter} />}
                </div>
              </div>
              <div className="h-2.5 bg-blue-50 rounded-full overflow-hidden">
                <div
                  className="h-2.5 bg-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct1}%` }}
                />
              </div>
            </div>
            {/* Entity 2 bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-amber-600 font-bold truncate max-w-[180px]">{lbl2}</span>
                <span className="text-sm font-black text-amber-600">{fmtVal(r.v2, r.format)}</span>
              </div>
              <div className="h-2.5 bg-amber-50 rounded-full overflow-hidden">
                <div
                  className="h-2.5 bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct2}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ALL_DEPTS = '__all__';

export default function BranchComparison() {
  const [branch1, setBranch1] = useState('');
  const [dept1,   setDept1]   = useState(ALL_DEPTS);
  const [branch2, setBranch2] = useState('');
  const [dept2,   setDept2]   = useState(ALL_DEPTS);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year,  setYear]  = useState(String(new Date().getFullYear()));
  const [activeCategory, setActiveCategory] = useState<ComparisonCategory>('employees');
  const [isComparing, setIsComparing] = useState(false);

  // ── Branches & departments ────────────────────────────────────────────────
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/hr/branches').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });
  const { data: depts1 = [] } = useQuery<any[]>({
    queryKey: ['departments', branch1],
    queryFn: () => api.get('/hr/departments', { params: { branchId: branch1 } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    enabled: !!branch1,
    staleTime: 5 * 60 * 1000,
  });
  const { data: depts2 = [] } = useQuery<any[]>({
    queryKey: ['departments', branch2],
    queryFn: () => api.get('/hr/departments', { params: { branchId: branch2 } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []),
    enabled: !!branch2,
    staleTime: 5 * 60 * 1000,
  });

  // ── Query params ──────────────────────────────────────────────────────────
  const p1 = useMemo(() => ({
    branchId:     branch1 || undefined,
    departmentId: dept1 !== ALL_DEPTS ? dept1 : undefined,
    month: parseInt(month), year: parseInt(year),
  }), [branch1, dept1, month, year]);
  const p2 = useMemo(() => ({
    branchId:     branch2 || undefined,
    departmentId: dept2 !== ALL_DEPTS ? dept2 : undefined,
    month: parseInt(month), year: parseInt(year),
  }), [branch2, dept2, month, year]);

  const Q = { enabled: isComparing, staleTime: 2 * 60 * 1000 };

  // ── Helper: leaves query uses department path when dept selected ──────────
  const fetchLeaves = (params: typeof p1) => {
    if (params.departmentId) {
      return api.get(`/hr/leaves/department/${params.departmentId}`, { params: { branchId: params.branchId } })
        .then(r => Array.isArray(r.data) ? r.data : []).catch(() => []);
    }
    return api.get('/hr/leaves', { params: { branchId: params.branchId } })
      .then(r => Array.isArray(r.data) ? r.data : []).catch(() => []);
  };

  const { data: emp1 = [],  isFetching: ldEmp1 } = useQuery<any[]>({ queryKey: ['cmp','emp', p1], queryFn: () => api.get('/hr/employees',  { params: { branchId: p1.branchId, departmentId: p1.departmentId } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  const { data: emp2 = [],  isFetching: ldEmp2 } = useQuery<any[]>({ queryKey: ['cmp','emp', p2], queryFn: () => api.get('/hr/employees',  { params: { branchId: p2.branchId, departmentId: p2.departmentId } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  const { data: att1 = [],  isFetching: ldAtt1 } = useQuery<any[]>({ queryKey: ['cmp','att', p1], queryFn: () => api.get('/hr/attendance', { params: { branchId: p1.branchId, departmentId: p1.departmentId } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  const { data: att2 = [],  isFetching: ldAtt2 } = useQuery<any[]>({ queryKey: ['cmp','att', p2], queryFn: () => api.get('/hr/attendance', { params: { branchId: p2.branchId, departmentId: p2.departmentId } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  const { data: lv1  = [],  isFetching: ldLv1  } = useQuery<any[]>({ queryKey: ['cmp','lv',  p1], queryFn: () => fetchLeaves(p1), ...Q });
  const { data: lv2  = [],  isFetching: ldLv2  } = useQuery<any[]>({ queryKey: ['cmp','lv',  p2], queryFn: () => fetchLeaves(p2), ...Q });
  const { data: pay1 = [],  isFetching: ldPay1 } = useQuery<any[]>({ queryKey: ['cmp','pay', branch1], queryFn: () => api.get('/hr/payroll', { params: { branchId: branch1 } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  const { data: pay2 = [],  isFetching: ldPay2 } = useQuery<any[]>({ queryKey: ['cmp','pay', branch2], queryFn: () => api.get('/hr/payroll', { params: { branchId: branch2 } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  const { data: inv1 = [],  isFetching: ldInv1 } = useQuery<any[]>({ queryKey: ['cmp','inv', branch1], queryFn: () => api.get('/finance/invoices', { params: { branchId: branch1 } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  const { data: inv2 = [],  isFetching: ldInv2 } = useQuery<any[]>({ queryKey: ['cmp','inv', branch2], queryFn: () => api.get('/finance/invoices', { params: { branchId: branch2 } }).then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });
  // Correspondences are stored in-memory (no branchId filter available)
  const { data: corr = [] }                       = useQuery<any[]>({ queryKey: ['cmp','cor'], queryFn: () => api.get('/comms/correspondences').then(r => Array.isArray(r.data) ? r.data : []).catch(() => []), ...Q });

  const isLoading = ldEmp1 || ldEmp2 || ldAtt1 || ldAtt2 || ldLv1 || ldLv2 || ldPay1 || ldPay2 || ldInv1 || ldInv2;

  // Filter correspondences by branchId if available, otherwise show all in both
  const hasBranchTagged = corr.some((c: any) => c.branchId);
  const corr1 = hasBranchTagged ? corr.filter((c: any) => String(c.branchId) === branch1) : corr;
  const corr2 = hasBranchTagged ? corr.filter((c: any) => String(c.branchId) === branch2) : corr;

  // ── Labels ────────────────────────────────────────────────────────────────
  const lbl1 = useMemo(() => {
    const b = branches.find(x => String(x.id) === branch1);
    const d = dept1 !== ALL_DEPTS ? depts1.find(x => String(x.id) === dept1) : null;
    return [b?.nameAr || b?.name || 'المؤسسة الأولى', d?.nameAr || d?.name].filter(Boolean).join(' / ');
  }, [branches, depts1, branch1, dept1]);

  const lbl2 = useMemo(() => {
    const b = branches.find(x => String(x.id) === branch2);
    const d = dept2 !== ALL_DEPTS ? depts2.find(x => String(x.id) === dept2) : null;
    return [b?.nameAr || b?.name || 'المؤسسة الثانية', d?.nameAr || d?.name].filter(Boolean).join(' / ');
  }, [branches, depts2, branch2, dept2]);

  // ── Computed metrics per category ─────────────────────────────────────────
  const metricsMap = useMemo((): Record<ComparisonCategory, MetricRow[]> => {
    // Employees
    const active1 = emp1.filter((e: any) => e.status === 'ACTIVE' || e.status === 'active').length;
    const active2 = emp2.filter((e: any) => e.status === 'ACTIVE' || e.status === 'active').length;
    const onLeave1 = emp1.filter((e: any) => e.status === 'on_leave').length;
    const onLeave2 = emp2.filter((e: any) => e.status === 'on_leave').length;
    // Salary from employee records (employee.salary field)
    const empSalSum1 = emp1.reduce((s: number, e: any) => s + (parseFloat(e.salary) || 0), 0);
    const empSalSum2 = emp2.reduce((s: number, e: any) => s + (parseFloat(e.salary) || 0), 0);

    // Attendance
    const present1 = att1.filter((a: any) => a.checkIn || a.status === 'PRESENT').length;
    const present2 = att2.filter((a: any) => a.checkIn || a.status === 'PRESENT').length;
    const late1 = att1.filter((a: any) => a.isLate || a.status === 'LATE').length;
    const late2 = att2.filter((a: any) => a.isLate || a.status === 'LATE').length;
    const absent1 = att1.filter((a: any) => a.status === 'ABSENT').length;
    const absent2 = att2.filter((a: any) => a.status === 'ABSENT').length;

    // Leaves
    const lvApproved1 = lv1.filter((l: any) => l.status === 'APPROVED' || l.overallStatus === 'APPROVED').length;
    const lvApproved2 = lv2.filter((l: any) => l.status === 'APPROVED' || l.overallStatus === 'APPROVED').length;
    const lvPending1 = lv1.filter((l: any) => l.status === 'PENDING' || l.overallStatus === 'PENDING' ||
      l.status === 'PENDING_DEPT_MANAGER' || l.status === 'PENDING_HR_MANAGER' || l.status === 'PENDING_GM').length;
    const lvPending2 = lv2.filter((l: any) => l.status === 'PENDING' || l.overallStatus === 'PENDING' ||
      l.status === 'PENDING_DEPT_MANAGER' || l.status === 'PENDING_HR_MANAGER' || l.status === 'PENDING_GM').length;
    const lvRejected1 = lv1.filter((l: any) => l.status === 'REJECTED' || l.overallStatus === 'REJECTED').length;
    const lvRejected2 = lv2.filter((l: any) => l.status === 'REJECTED' || l.overallStatus === 'REJECTED').length;

    // Payroll
    const totalSal1 = pay1.reduce((s: number, p: any) => s + (parseFloat(p.basicSalary) || parseFloat(p.netSalary) || 0), 0);
    const totalSal2 = pay2.reduce((s: number, p: any) => s + (parseFloat(p.basicSalary) || parseFloat(p.netSalary) || 0), 0);
    const allow1 = pay1.reduce((s: number, p: any) =>
      s + (parseFloat(p.housingAllowance) || 0) + (parseFloat(p.transportAllowance) || 0) + (parseFloat(p.otherAllowances) || 0), 0);
    const allow2 = pay2.reduce((s: number, p: any) =>
      s + (parseFloat(p.housingAllowance) || 0) + (parseFloat(p.transportAllowance) || 0) + (parseFloat(p.otherAllowances) || 0), 0);

    // Invoices
    const paid1 = inv1.filter((i: any) => i.status === 'PAID').length;
    const paid2 = inv2.filter((i: any) => i.status === 'PAID').length;
    const totalInv1 = inv1.reduce((s: number, i: any) => s + (parseFloat(i.amount) || parseFloat(i.total) || 0), 0);
    const totalInv2 = inv2.reduce((s: number, i: any) => s + (parseFloat(i.amount) || parseFloat(i.total) || 0), 0);

    // Correspondences (filtered in component scope, in-memory data)
    const out1 = corr1.filter((c: any) => c.type === 'OUTGOING' || c.direction === 'outgoing');
    const out2 = corr2.filter((c: any) => c.type === 'OUTGOING' || c.direction === 'outgoing');
    const in1  = corr1.filter((c: any) => c.type === 'INCOMING' || c.direction === 'incoming');
    const in2  = corr2.filter((c: any) => c.type === 'INCOMING' || c.direction === 'incoming');

    return {
      employees: [
        { label: 'إجمالي الموظفين',    v1: emp1.length, v2: emp2.length, higherIsBetter: true,  format: 'number' },
        { label: 'موظفون نشطون',        v1: active1,     v2: active2,     higherIsBetter: true,  format: 'number' },
        { label: 'موظفون غير نشطين',    v1: emp1.length - active1, v2: emp2.length - active2, higherIsBetter: false, format: 'number' },
        { label: 'في إجازة',            v1: onLeave1,    v2: onLeave2,    format: 'number' },
        { label: 'نسبة النشاط',         v1: emp1.length ? (active1/emp1.length)*100 : 0, v2: emp2.length ? (active2/emp2.length)*100 : 0, higherIsBetter: true, format: 'percent' },
        { label: 'إجمالي الرواتب (من سجل الموظفين)', v1: empSalSum1, v2: empSalSum2, format: 'currency' },
      ],
      attendance: [
        { label: 'سجلات الحضور',        v1: att1.length, v2: att2.length, format: 'number' },
        { label: 'حاضر',                 v1: present1,    v2: present2,    higherIsBetter: true,  format: 'number' },
        { label: 'غائب',                 v1: absent1,     v2: absent2,     higherIsBetter: false, format: 'number' },
        { label: 'متأخر',                v1: late1,       v2: late2,       higherIsBetter: false, format: 'number' },
        { label: 'معدل الحضور',          v1: att1.length ? (present1/att1.length)*100 : 0, v2: att2.length ? (present2/att2.length)*100 : 0, higherIsBetter: true, format: 'percent' },
      ],
      leaves: [
        { label: 'إجمالي طلبات الإجازة', v1: lv1.length,    v2: lv2.length,    format: 'number' },
        { label: 'موافق عليها',           v1: lvApproved1,   v2: lvApproved2,   higherIsBetter: true, format: 'number' },
        { label: 'قيد الانتظار',          v1: lvPending1,    v2: lvPending2,    higherIsBetter: false, format: 'number' },
        { label: 'مرفوضة',               v1: lvRejected1,   v2: lvRejected2,   higherIsBetter: false, format: 'number' },
        { label: 'معدل الموافقة',         v1: lv1.length ? (lvApproved1/lv1.length)*100 : 0, v2: lv2.length ? (lvApproved2/lv2.length)*100 : 0, higherIsBetter: true, format: 'percent' },
      ],
      allowances: [
        { label: 'إجمالي كتلة الرواتب',  v1: totalSal1,   v2: totalSal2,   format: 'currency' },
        { label: 'متوسط الراتب',          v1: pay1.length ? totalSal1/pay1.length : 0, v2: pay2.length ? totalSal2/pay2.length : 0, format: 'currency' },
        { label: 'إجمالي العلاوات',       v1: allow1,      v2: allow2,      format: 'currency' },
        { label: 'عدد مسيرات الرواتب',   v1: pay1.length, v2: pay2.length, format: 'number' },
      ],
      accounts: [
        { label: 'إجمالي الرواتب (المسيرة)', v1: totalSal1, v2: totalSal2, format: 'currency' },
        { label: 'إجمالي الفواتير',           v1: totalInv1, v2: totalInv2, format: 'currency' },
        { label: 'فواتير مدفوعة',             v1: paid1,     v2: paid2,     higherIsBetter: true, format: 'number' },
        { label: 'فواتير غير مدفوعة',         v1: inv1.length - paid1, v2: inv2.length - paid2, higherIsBetter: false, format: 'number' },
        { label: 'عدد الموظفين',              v1: emp1.length, v2: emp2.length, higherIsBetter: true, format: 'number' },
      ],
      outgoing: [
        { label: 'إجمالي الصادرات',       v1: out1.length, v2: out2.length, format: 'number' },
        { label: 'صادرات مرسلة',          v1: out1.filter((c:any)=>c.status==='sent'||c.status==='SENT').length, v2: out2.filter((c:any)=>c.status==='sent'||c.status==='SENT').length, higherIsBetter: true, format: 'number' },
        { label: 'صادرات مسودة',          v1: out1.filter((c:any)=>c.status==='draft').length, v2: out2.filter((c:any)=>c.status==='draft').length, format: 'number' },
      ],
      incoming: [
        { label: 'إجمالي الواردات',       v1: in1.length,  v2: in2.length,  format: 'number' },
        { label: 'واردات معالجة',          v1: in1.filter((c:any)=>c.status==='PROCESSED'||c.status==='processed').length, v2: in2.filter((c:any)=>c.status==='PROCESSED'||c.status==='processed').length, higherIsBetter: true, format: 'number' },
        { label: 'واردات قيد المعالجة',   v1: in1.filter((c:any)=>c.status==='PENDING'||c.status==='pending').length, v2: in2.filter((c:any)=>c.status==='PENDING'||c.status==='pending').length, higherIsBetter: false, format: 'number' },
      ],
      invoices: [
        { label: 'إجمالي الفواتير',       v1: inv1.length, v2: inv2.length, format: 'number' },
        { label: 'فواتير مدفوعة',         v1: paid1,       v2: paid2,       higherIsBetter: true, format: 'number' },
        { label: 'فواتير غير مدفوعة',     v1: inv1.length - paid1, v2: inv2.length - paid2, higherIsBetter: false, format: 'number' },
        { label: 'قيمة الفواتير الكلية',  v1: totalInv1,   v2: totalInv2,   format: 'currency' },
        { label: 'معدل السداد',           v1: inv1.length ? (paid1/inv1.length)*100 : 0, v2: inv2.length ? (paid2/inv2.length)*100 : 0, higherIsBetter: true, format: 'percent' },
      ],
      subscriptions: [
        // Derived from payroll records (recurring salary payments represent active subscriptions per employee)
        { label: 'موظفون لديهم مسيرة راتب', v1: pay1.length, v2: pay2.length, higherIsBetter: true, format: 'number' },
        { label: 'إجمالي فواتير الخدمات',   v1: inv1.length, v2: inv2.length, format: 'number' },
        { label: 'فواتير نشطة (غير مدفوعة)',v1: inv1.length - paid1, v2: inv2.length - paid2, format: 'number' },
      ],
      governance: [
        // Derived from leave approval workflow compliance + attendance anomalies
        { label: 'طلبات الإجازة المعلقة',  v1: lvPending1,  v2: lvPending2,  higherIsBetter: false, format: 'number' },
        { label: 'موظفون غير نشطين/موقوفون', v1: emp1.filter((e:any)=>e.status==='suspended'||e.status==='terminated').length, v2: emp2.filter((e:any)=>e.status==='suspended'||e.status==='terminated').length, higherIsBetter: false, format: 'number' },
        { label: 'حالات تأخر',             v1: late1,       v2: late2,       higherIsBetter: false, format: 'number' },
        { label: 'حالات غياب',             v1: absent1,     v2: absent2,     higherIsBetter: false, format: 'number' },
        { label: 'معدل الامتثال (الحضور)', v1: att1.length ? ((att1.length - absent1 - late1)/att1.length)*100 : 0, v2: att2.length ? ((att2.length - absent2 - late2)/att2.length)*100 : 0, higherIsBetter: true, format: 'percent' },
      ],
      tax: [
        // Global tax rates (no per-branch filter available — showing totals from invoices as income proxy)
        { label: 'الدخل من الفواتير',      v1: totalInv1,   v2: totalInv2,   format: 'currency' },
        { label: 'فواتير مدفوعة (الدخل المحصّل)', v1: inv1.filter((i:any)=>i.status==='PAID').reduce((s:number,i:any)=>s+(parseFloat(i.amount)||0),0), v2: inv2.filter((i:any)=>i.status==='PAID').reduce((s:number,i:any)=>s+(parseFloat(i.amount)||0),0), higherIsBetter: true, format: 'currency' },
        { label: 'تكلفة الرواتب (الالتزامات)', v1: totalSal1, v2: totalSal2, format: 'currency' },
        { label: 'صافي تقديري (دخل - رواتب)', v1: totalInv1 - totalSal1, v2: totalInv2 - totalSal2, higherIsBetter: true, format: 'currency' },
      ],
    };
  }, [emp1, emp2, att1, att2, lv1, lv2, pay1, pay2, inv1, inv2, corr1, corr2]);

  // ── Date helpers ──────────────────────────────────────────────────────────
  const MONTHS = [
    { v:'01',l:'يناير'},{ v:'02',l:'فبراير'},{ v:'03',l:'مارس'},
    { v:'04',l:'أبريل'},{ v:'05',l:'مايو'},  { v:'06',l:'يونيو'},
    { v:'07',l:'يوليو'},{ v:'08',l:'أغسطس'},{ v:'09',l:'سبتمبر'},
    { v:'10',l:'أكتوبر'},{ v:'11',l:'نوفمبر'},{ v:'12',l:'ديسمبر'},
  ];
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // ── Quick summary numbers for top bar ─────────────────────────────────────
  const quickStats = isComparing ? [
    { label: 'الموظفون',   v1: emp1.length,  v2: emp2.length,  icon: '👥', color: 'blue' },
    { label: 'الحضور',    v1: att1.filter((a:any)=>a.checkIn||a.status==='PRESENT').length, v2: att2.filter((a:any)=>a.checkIn||a.status==='PRESENT').length, icon: '🕐', color: 'green' },
    { label: 'الإجازات',  v1: lv1.length,   v2: lv2.length,   icon: '📅', color: 'amber' },
    { label: 'الفواتير',  v1: inv1.length,  v2: inv2.length,  icon: '🧾', color: 'purple' },
  ] : [];

  const selectClass = "w-full border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition appearance-none";

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F5F7FA' }} dir="rtl">

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-3xl font-black" style={{ color: '#2F3440' }}>مقارنة أداء المؤسسات</h2>
        <p className="text-gray-500 mt-1 text-sm">قارن بين فرعين وأقسامهما عبر 11 محوراً تشغيلياً ومالياً</p>
      </div>

      {/* ── Selector panel — matches HTML style ──────────────────────────── */}
      <div
        className="bg-white rounded-2xl p-6 mb-6 shadow-sm border-t-4 flex flex-col gap-5"
        style={{
          border: '1px solid rgba(228,231,236,0.8)',
          borderTop: '4px solid #3B82F6',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        {/* Two entity selectors + VS + button */}
        <div className="flex flex-col lg:flex-row gap-4 items-end">

          {/* Entity 1 */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">الجهة الأولى</span>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#2F3440' }}>المؤسسة (الفرع)</label>
              <div className="relative">
                <select
                  value={branch1}
                  onChange={e => { setBranch1(e.target.value); setDept1(ALL_DEPTS); setIsComparing(false); }}
                  className={selectClass}
                  style={{ borderColor: branch1 ? '#3B82F6' : '#e5e7eb' }}
                >
                  <option value="">— اختر الفرع —</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={String(b.id)}>{b.nameAr || b.name}</option>
                  ))}
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#2F3440' }}>القسم</label>
              <div className="relative">
                <select
                  value={dept1}
                  onChange={e => { setDept1(e.target.value); setIsComparing(false); }}
                  disabled={!branch1}
                  className={selectClass}
                  style={{ borderColor: dept1 !== ALL_DEPTS ? '#3B82F6' : '#e5e7eb', opacity: !branch1 ? 0.5 : 1 }}
                >
                  <option value={ALL_DEPTS}>جميع الأقسام</option>
                  {depts1.map((d: any) => (
                    <option key={d.id} value={String(d.id)}>{d.nameAr || d.name}</option>
                  ))}
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
          </div>

          {/* VS circle */}
          <div className="hidden lg:flex items-center justify-center pb-2 flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-gray-500 text-sm"
              style={{ backgroundColor: '#F3F4F6', border: '2px solid #E5E7EB' }}>
              VS
            </div>
          </div>

          {/* Entity 2 */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider">الجهة الثانية</span>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#2F3440' }}>المؤسسة (الفرع)</label>
              <div className="relative">
                <select
                  value={branch2}
                  onChange={e => { setBranch2(e.target.value); setDept2(ALL_DEPTS); setIsComparing(false); }}
                  className={selectClass}
                  style={{ borderColor: branch2 ? '#F59E0B' : '#e5e7eb' }}
                >
                  <option value="">— اختر الفرع —</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={String(b.id)}>{b.nameAr || b.name}</option>
                  ))}
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: '#2F3440' }}>القسم</label>
              <div className="relative">
                <select
                  value={dept2}
                  onChange={e => { setDept2(e.target.value); setIsComparing(false); }}
                  disabled={!branch2}
                  className={selectClass}
                  style={{ borderColor: dept2 !== ALL_DEPTS ? '#F59E0B' : '#e5e7eb', opacity: !branch2 ? 0.5 : 1 }}
                >
                  <option value={ALL_DEPTS}>جميع الأقسام</option>
                  {depts2.map((d: any) => (
                    <option key={d.id} value={String(d.id)}>{d.nameAr || d.name}</option>
                  ))}
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date + button row */}
        <div className="flex flex-col sm:flex-row gap-3 items-end pt-2 border-t border-gray-100">
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1.5 text-gray-600">الشهر</label>
              <div className="relative">
                <select value={month} onChange={e => setMonth(e.target.value)} className={selectClass}>
                  {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1.5 text-gray-600">السنة</label>
              <div className="relative">
                <select value={year} onChange={e => setYear(e.target.value)} className={selectClass}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsComparing(true)}
            disabled={!branch1 || !branch2}
            className="px-8 py-3 rounded-xl font-bold text-white transition w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: !branch1 || !branch2 ? '#93C5FD' : '#3B82F6' }}
            onMouseEnter={e => { if (branch1 && branch2) (e.currentTarget as HTMLElement).style.backgroundColor = '#2563EB'; }}
            onMouseLeave={e => { if (branch1 && branch2) (e.currentTarget as HTMLElement).style.backgroundColor = '#3B82F6'; }}
          >
            {isLoading ? (
              <><span className="animate-spin">⟳</span> جارٍ التحليل...</>
            ) : (
              <>📊 عرض المقارنة</>
            )}
          </button>
        </div>
      </div>

      {/* ── Placeholder before comparing ─────────────────────────────────── */}
      {!isComparing && (
        <div
          className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid rgba(228,231,236,0.8)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
        >
          <p className="text-center text-gray-400 py-8 text-base">
            اختر مؤسستين وانقر "عرض المقارنة" لرؤية النتائج.
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {isComparing && (
        <>
          {/* Quick stat row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {quickStats.map((s, i) => (
              <div key={i}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                style={{ border: '1px solid rgba(228,231,236,0.8)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-bold text-gray-500">{s.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xl font-black text-blue-600">{s.v1.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{lbl1}</div>
                  </div>
                  <div className="text-center">
                    {s.v1 !== s.v2 && (
                      <span className={cn('text-xs font-black px-2 py-0.5 rounded-full',
                        s.v1 > s.v2 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      )}>
                        {s.v1 > s.v2 ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-black text-amber-500">{s.v2.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{lbl2}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-bold text-gray-700">{lbl1}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-sm font-bold text-gray-700">{lbl2}</span>
            </div>
            <span className="mr-auto text-xs text-gray-400 font-bold">
              {MONTHS.find(m => m.v === month)?.l} {year}
            </span>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition flex-shrink-0"
                style={activeCategory === cat.id ? {
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
                } : {
                  backgroundColor: '#fff',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                }}
                onMouseEnter={e => { if (activeCategory !== cat.id) (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6'; }}
                onMouseLeave={e => { if (activeCategory !== cat.id) (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; }}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results panel */}
          <div
            className="bg-white rounded-2xl shadow-sm"
            style={{ border: '1px solid rgba(228,231,236,0.8)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">{CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
                <h3 className="font-black text-lg" style={{ color: '#2F3440' }}>
                  {CATEGORIES.find(c => c.id === activeCategory)?.label}
                </h3>
              </div>
              {isLoading && (
                <span className="text-xs text-blue-500 font-bold animate-pulse">جارٍ التحميل...</span>
              )}
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="text-3xl animate-spin">⟳</span>
                  <p className="text-gray-400 text-sm font-bold">جارٍ تحليل البيانات...</p>
                </div>
              ) : (
                <MetricTable
                  rows={metricsMap[activeCategory]}
                  lbl1={lbl1}
                  lbl2={lbl2}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
