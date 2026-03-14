import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Shield, Settings, Loader2, Edit, ChevronDown, ChevronUp, X, Save } from 'lucide-react';
import { modulePermissions, hrSubPermissions, roleLevels, roleLabels, UserRoleType } from '@/contexts/AppContext';

// ─── Constants ────────────────────────────────────────────────────────────────

interface RolePermissions { modules: string[]; hrSubPages: string[]; }

const AVAILABLE_MODULES = [
  { key: 'hr',         label: 'الموارد البشرية' },
  { key: 'finance',    label: 'المالية' },
  { key: 'fleet',      label: 'إدارة الأسطول' },
  { key: 'property',   label: 'إدارة الأملاك' },
  { key: 'operations', label: 'العمليات' },
  { key: 'governance', label: 'الحوكمة' },
  { key: 'bi',         label: 'ذكاء الأعمال' },
  { key: 'legal',      label: 'القانوني' },
  { key: 'documents',  label: 'الوثائق' },
  { key: 'reports',    label: 'التقارير' },
  { key: 'comms',      label: 'المراسلات' },
  { key: 'marketing',  label: 'التسويق' },
  { key: 'store',      label: 'المخازن' },
  { key: 'workflow',   label: 'سير العمل' },
  { key: 'requests',   label: 'الطلبات' },
  { key: 'support',    label: 'الدعم الفني' },
  { key: 'settings',   label: 'الإعدادات' },
  { key: 'admin',      label: 'إدارة النظام' },
];

const AVAILABLE_HR_SUBPAGES = [
  { key: 'employees',             label: 'الموظفين' },
  { key: 'employees-list',        label: 'قائمة الموظفين' },
  { key: 'add-employee',          label: 'إضافة موظف' },
  { key: 'attendance',            label: 'الحضور' },
  { key: 'attendance-monitoring', label: 'مراقبة الحضور' },
  { key: 'leaves',                label: 'إدارة الإجازات' },
  { key: 'leaves-list',           label: 'قائمة الإجازات' },
  { key: 'leave-balances',        label: 'أرصدة الإجازات' },
  { key: 'payroll',               label: 'الرواتب' },
  { key: 'performance',           label: 'تقييم الأداء' },
  { key: 'training',              label: 'التدريب' },
  { key: 'organization',          label: 'الهيكل التنظيمي' },
  { key: 'recruitment',           label: 'التوظيف' },
  { key: 'violations',            label: 'المخالفات والجزاءات' },
  { key: 'my_violations',         label: 'مخالفاتي' },
  { key: 'shifts',                label: 'الورديات والسياسات' },
  { key: 'tracking',              label: 'التتبع الميداني' },
  { key: 'qr',                    label: 'ماسح QR' },
  { key: 'approvals',             label: 'سلاسل الموافقات' },
  { key: 'letters',               label: 'الخطابات الرسمية' },
  { key: 'reports',               label: 'تقارير الحضور' },
  { key: 'onboarding',            label: 'مراجعة الانضمام' },
  { key: 'escalation',            label: 'تصعيد الجزاءات' },
  { key: 'automation',            label: 'أتمتة HR' },
  { key: 'salary',                label: 'بنود الراتب' },
];

// System roles built into the app (from AppContext)
const SYSTEM_ROLE_KEYS: UserRoleType[] = [
  'admin', 'general_manager', 'hr_manager', 'finance_manager',
  'fleet_manager', 'legal_manager', 'projects_manager', 'store_manager',
  'department_manager', 'supervisor', 'employee', 'agent',
];

interface DisplayRole {
  id: number | string;
  code: string;
  nameAr: string;
  level: number;
  permissions: RolePermissions;
  isSystem: boolean;
  isActive: boolean;
  description?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePermissions(raw: string | null | undefined): RolePermissions {
  if (!raw) return { modules: [], hrSubPages: [] };
  try {
    const p = JSON.parse(raw);
    return { modules: Array.isArray(p.modules) ? p.modules : [], hrSubPages: Array.isArray(p.hrSubPages) ? p.hrSubPages : [] };
  } catch { return { modules: [], hrSubPages: [] }; }
}

function getLevelBadge(level: number) {
  if (level >= 90) return <Badge className="bg-red-100 text-red-800 border-0">مدير النظام ({level})</Badge>;
  if (level >= 70) return <Badge className="bg-orange-100 text-orange-800 border-0">مدير ({level})</Badge>;
  if (level >= 50) return <Badge className="bg-blue-100 text-blue-800 border-0">مشرف ({level})</Badge>;
  if (level >= 20) return <Badge className="bg-green-100 text-green-800 border-0">موظف ({level})</Badge>;
  return <Badge variant="outline">أساسي ({level})</Badge>;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface RoleFormState {
  name: string;
  nameAr: string;
  description: string;
  level: number;
  permissions: RolePermissions;
}

const emptyForm = (): RoleFormState => ({
  name: '', nameAr: '', description: '', level: 50,
  permissions: { modules: [], hrSubPages: [] },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoleSettings() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingIsSystem, setEditingIsSystem] = useState(false);
  const [form, setForm] = useState<RoleFormState>(emptyForm());
  const [showHrSub, setShowHrSub] = useState(false);

  // DB custom roles
  const { data: dbRoles = [], isLoading } = useQuery<any[]>({
    queryKey: ['custom-roles'],
    queryFn: () => api.get('/roles').then(r => r.data),
  });

  // Build system roles list, merging DB overrides if any
  const systemRoles: DisplayRole[] = SYSTEM_ROLE_KEYS.map(key => {
    const dbOverride = dbRoles.find((r: any) => r.name === key || r.code === key);
    const defaultPerms: RolePermissions = {
      modules: (modulePermissions[key] || []).filter(m => m !== 'home' && m !== 'inbox' && m !== 'platform' && m !== 'system' && m !== 'comm'),
      hrSubPages: hrSubPermissions[key] || [],
    };
    return {
      id: dbOverride ? dbOverride.id : key,
      code: key,
      nameAr: roleLabels[key],
      level: roleLevels[key],
      permissions: dbOverride ? parsePermissions(dbOverride.permissions) : defaultPerms,
      isSystem: true,
      isActive: true,
      description: dbOverride?.description || undefined,
    };
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/roles/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success('تم حفظ التعديلات'); qc.invalidateQueries({ queryKey: ['custom-roles'] }); closeForm(); },
    onError: (e: any) => toast.error('خطأ: ' + e.message),
  });

  const openEdit = (role: DisplayRole) => {
    setEditingId(role.id);
    setEditingIsSystem(role.isSystem);
    setForm({
      name: role.code,
      nameAr: role.nameAr,
      description: role.description || '',
      level: role.level,
      permissions: role.permissions,
    });
    setShowHrSub(role.permissions.modules.includes('hr'));
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setEditingIsSystem(false); setForm(emptyForm()); setShowHrSub(false); };

  const toggleModule = (key: string) => {
    const mods = form.permissions.modules;
    const isRemoving = mods.includes(key);
    const next = isRemoving ? mods.filter(m => m !== key) : [...mods, key];
    if (key === 'hr' && isRemoving) {
      setShowHrSub(false);
      setForm(f => ({ ...f, permissions: { modules: next, hrSubPages: [] } }));
    } else {
      if (key === 'hr') setShowHrSub(true);
      setForm(f => ({ ...f, permissions: { ...f.permissions, modules: next } }));
    }
  };

  const toggleHrSub = (key: string) => {
    const subs = form.permissions.hrSubPages;
    const next = subs.includes(key) ? subs.filter(s => s !== key) : [...subs, key];
    setForm(f => ({ ...f, permissions: { ...f.permissions, hrSubPages: next } }));
  };

  const handleSave = () => {
    if (!form.nameAr) { toast.error('يرجى إدخال اسم الدور بالعربية'); return; }
    if (!editingId) { toast.error('لا يمكن الحفظ بدون تحديد دور'); return; }
    const payload = {
      name: form.name,
      nameAr: form.nameAr,
      description: form.description || null,
      level: form.level,
      permissions: JSON.stringify(form.permissions),
    };
    if (typeof editingId === 'number') {
      updateMutation.mutate({ id: editingId as number, data: payload });
    } else {
      // System role without DB entry — create a DB override
      const createOverride = api.post('/roles', payload).then(r => r.data);
      createOverride.then(() => { toast.success('تم حفظ التعديلات'); qc.invalidateQueries({ queryKey: ['custom-roles'] }); closeForm(); })
        .catch((e: any) => toast.error('خطأ: ' + e.message));
    }
  };

  const isSaving = updateMutation.isPending;

  if (isLoading) return <div className="flex items-center justify-center h-64" dir="rtl"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة الأدوار والصلاحيات</h2>
          <p className="text-gray-500">تعريف الأدوار وتعيين الصلاحيات للمستخدمين</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50"><Shield className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-sm text-gray-500">الأدوار المدمجة</p><p className="text-2xl font-bold">{systemRoles.length}</p></div>
        </CardContent></Card>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingIsSystem ? `تعديل صلاحيات: ${form.nameAr}` : 'تعديل الدور'}
              </CardTitle>
              <Button size="icon" variant="ghost" onClick={closeForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود (بالإنجليزية)</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="HR_MANAGER"
                  readOnly={editingIsSystem}
                  className={editingIsSystem ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربية *</Label>
                <Input
                  value={form.nameAr}
                  onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                  placeholder="مدير الموارد البشرية"
                  readOnly={editingIsSystem}
                  className={editingIsSystem ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف الدور" />
              </div>
              <div className="space-y-2">
                <Label>المستوى (1-100)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number" min={1} max={100}
                    value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) }))}
                    readOnly={editingIsSystem}
                    className={editingIsSystem ? 'bg-muted w-24' : 'w-24'}
                  />
                  {/* Live preview */}
                  <div>{getLevelBadge(form.level)}</div>
                </div>
                <p className="text-xs text-gray-400">90-100 = مدير النظام · 70-89 = مدير · 50-69 = مشرف · 20-49 = موظف · 1-19 = أساسي</p>
              </div>
            </div>

            {/* Module permissions */}
            <div className="space-y-3">
              <div className="font-semibold text-sm border-b pb-2">الوحدات المسموح بها (ما يظهر في الشريط الجانبي)</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {AVAILABLE_MODULES.map(mod => (
                  <label key={mod.key} className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox checked={form.permissions.modules.includes(mod.key)} onCheckedChange={() => toggleModule(mod.key)} />
                    <span className="text-sm">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* HR sub-pages — only when hr is selected */}
            {form.permissions.modules.includes('hr') && (
              <div className="space-y-3">
                <button
                  type="button"
                  className="flex items-center gap-2 font-semibold text-sm text-blue-700 border-b pb-2 w-full text-right"
                  onClick={() => setShowHrSub(v => !v)}
                >
                  {showHrSub ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  صلاحيات HR الفرعية ({form.permissions.hrSubPages.length} مختارة)
                </button>
                {showHrSub && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {AVAILABLE_HR_SUBPAGES.map(sub => (
                      <label key={sub.key} className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox checked={form.permissions.hrSubPages.includes(sub.key)} onCheckedChange={() => toggleHrSub(sub.key)} />
                        <span className="text-sm">{sub.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ التعديلات
              </Button>
              <Button variant="outline" onClick={closeForm}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-amber-600" />الأدوار المدمجة في النظام</CardTitle>
          <CardDescription>أدوار ثابتة مدمجة في النظام — يمكن تعديل صلاحياتها المعروضة هنا</CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable roles={systemRoles} onEdit={openEdit} />
        </CardContent>
      </Card>


      {/* Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-50"><Settings className="h-6 w-6 text-blue-600" /></div>
            <div>
              <h3 className="font-semibold mb-2">حول نظام الأدوار</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• المستوى يحدد التسلسل الهرمي: 90-100 مدير النظام · 70-89 مدير · 50-69 مشرف · 20-49 موظف</li>
                <li>• الوحدات المسموحة تتحكم في ما يظهر في الشريط الجانبي</li>
                <li>• صلاحيات HR تتحكم في الصفحات الفرعية داخل قسم الموارد البشرية</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Roles Table sub-component ────────────────────────────────────────────────

function RolesTable({ roles, onEdit }: {
  roles: DisplayRole[];
  onEdit: (r: DisplayRole) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-end w-36">الكود</TableHead>
          <TableHead className="text-end">الاسم بالعربية</TableHead>
          <TableHead className="text-end w-44">المستوى</TableHead>
          <TableHead className="text-end">الوحدات المسموح بها</TableHead>
          <TableHead className="text-end w-28">الحالة</TableHead>
          <TableHead className="text-end w-36">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map(role => {
          const moduleLabels = AVAILABLE_MODULES
            .filter(m => role.permissions.modules.includes(m.key))
            .map(m => m.label);
          return (
            <TableRow key={String(role.id)}>
              {/* Code */}
              <TableCell className="font-mono text-xs text-gray-600">{role.code}</TableCell>
              {/* Name */}
              <TableCell>
                <div>
                  <p className="font-medium">{role.nameAr}</p>
                  {role.description && <p className="text-xs text-gray-500">{role.description}</p>}
                </div>
              </TableCell>
              {/* Level */}
              <TableCell>{getLevelBadge(role.level)}</TableCell>
              {/* Modules */}
              <TableCell>
                {moduleLabels.length === 0 ? (
                  <span className="text-xs text-gray-400">لا توجد وحدات محددة</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {moduleLabels.slice(0, 3).map(l => (
                      <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                    ))}
                    {moduleLabels.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{moduleLabels.length - 3} أخرى</Badge>
                    )}
                  </div>
                )}
              </TableCell>
              {/* Status */}
              <TableCell>
                {role.isSystem
                  ? <Badge className="bg-amber-100 text-amber-800 border-0">مدمج</Badge>
                  : role.isActive
                    ? <Badge className="bg-green-100 text-green-800 border-0">نشط</Badge>
                    : <Badge variant="outline">معطل</Badge>}
              </TableCell>
              {/* Actions */}
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => onEdit(role)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
