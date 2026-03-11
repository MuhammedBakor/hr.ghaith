import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Settings, Shield, Zap, Clock, Users, Plus, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Lock, Unlock, ArrowRight, Trash2, Edit, Eye } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

type ViewMode = "list" | "add-company" | "add-setting" | "add-rule" | "add-role-pack";

// Available departments that can be assigned to a company
const AVAILABLE_DEPARTMENTS = [
  { id: 'hr', label: 'الموارد البشرية' },
  { id: 'finance', label: 'المالية' },
  { id: 'fleet', label: 'الأسطول' },
  { id: 'property', label: 'إدارة الأملاك' },
  { id: 'operations', label: 'العمليات' },
  { id: 'governance', label: 'الحوكمة' },
  { id: 'legal', label: 'القانونية' },
  { id: 'bi', label: 'ذكاء الأعمال' },
  { id: 'support', label: 'الدعم الفني' },
  { id: 'marketing', label: 'التسويق' },
  { id: 'store', label: 'المخازن' },
  { id: 'requests', label: 'الطلبات' },
  { id: 'documents', label: 'المستندات' },
  { id: 'reports', label: 'التقارير' },
  { id: 'comms', label: 'التواصل' },
  { id: 'workflow', label: 'سير العمل' },
  { id: 'inbox', label: 'صندوق الوارد' },
  { id: 'public-site', label: 'الموقع العام' },
  { id: 'integrations', label: 'التكاملات' },
];

export default function SystemAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("companies");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // View/Edit modal state
  const [viewItem, setViewItem] = useState<any>(null);
  const [viewType, setViewType] = useState<string>("");
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<string>("");

  // Form states
  const [newCompany, setNewCompany] = useState({ code: "", name: "", nameAr: "", email: "", phone: "", city: "", taxNumber: "", selectedDepts: [] as string[] });
  const [newSetting, setNewSetting] = useState({ key: "", value: "", type: "string", category: "", scope: "global", label: "", labelAr: "", description: "" });
  const [newRule, setNewRule] = useState({ code: "", name: "", nameAr: "", triggerType: "event", triggerEvent: "", actionType: "notification", actionConfig: "", description: "" });
  const [newRolePack, setNewRolePack] = useState({ code: "", name: "", nameAr: "", category: "", description: "" });

  // Queries
  const { data: companies = [] } = useQuery({ queryKey: ['admin', 'companies'], queryFn: () => api.get('/admin/companies').then(r => Array.isArray(r.data) ? r.data : []) });
  const { data: settings = [] } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api.get('/admin/settings').then(r => Array.isArray(r.data) ? r.data : []) });
  const { data: rules = [] } = useQuery({ queryKey: ['admin', 'automation-rules'], queryFn: () => api.get('/admin/automation-rules').then(r => Array.isArray(r.data) ? r.data : []) });
  const { data: dueTimers = [] } = useQuery({ queryKey: ['admin', 'timers', 'due'], queryFn: () => api.get('/admin/timers/due').then(r => Array.isArray(r.data) ? r.data : []) });
  const { data: rolePacks = [] } = useQuery({ queryKey: ['admin', 'role-packs'], queryFn: () => api.get('/admin/role-packs').then(r => Array.isArray(r.data) ? r.data : []) });
  const { data: failedChecks = [] } = useQuery({ queryKey: ['admin', 'governance', 'failed-checks'], queryFn: () => api.get('/admin/governance/failed-checks').then(r => Array.isArray(r.data) ? r.data : []) });
  const { data: protectedEndpoints = [] } = useQuery({ queryKey: ['admin', 'governance', 'protected-endpoints'], queryFn: () => api.get('/admin/governance/protected-endpoints').then(r => Array.isArray(r.data) ? r.data : []) });

  // Helper to invalidate
  const inv = (key: string[]) => queryClient.invalidateQueries({ queryKey: key });

  // Mutations - Create
  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/companies', data).then(r => r.data),
    onSuccess: () => { toast.success("تم إنشاء الشركة بنجاح"); setViewMode("list"); inv(['admin', 'companies']); setNewCompany({ code: "", name: "", nameAr: "", email: "", phone: "", city: "", taxNumber: "", selectedDepts: [] }); },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });
  const createSettingMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/settings', data).then(r => r.data),
    onSuccess: () => { toast.success("تم إنشاء الإعداد بنجاح"); setViewMode("list"); inv(['admin', 'settings']); setNewSetting({ key: "", value: "", type: "string", category: "", scope: "global", label: "", labelAr: "", description: "" }); },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });
  const createRuleMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/automation-rules', data).then(r => r.data),
    onSuccess: () => { toast.success("تم إنشاء القاعدة بنجاح"); setViewMode("list"); inv(['admin', 'automation-rules']); setNewRule({ code: "", name: "", nameAr: "", triggerType: "event", triggerEvent: "", actionType: "notification", actionConfig: "", description: "" }); },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });
  const createRolePackMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/role-packs', data).then(r => r.data),
    onSuccess: () => { toast.success("تم إنشاء حزمة الأدوار بنجاح"); setViewMode("list"); inv(['admin', 'role-packs']); setNewRolePack({ code: "", name: "", nameAr: "", category: "", description: "" }); },
    onError: (e: any) => toast.error(`خطأ: ${e.message}`),
  });

  // Mutations - Update
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/admin/companies/${id}`, data).then(r => r.data),
    onSuccess: (_, variables) => {
      toast.success("تم تحديث الشركة");
      setEditItem(null);
      setEditType("");
      inv(['admin', 'companies']);
      inv(['admin', 'company', variables.id]);
    },
  });
  const updateSettingMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/admin/settings/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success("تم تحديث الإعداد"); setEditItem(null); setEditType(""); inv(['admin', 'settings']); },
  });
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/admin/automation-rules/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success("تم تحديث القاعدة"); setEditItem(null); setEditType(""); inv(['admin', 'automation-rules']); },
  });
  const updateRolePackMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/admin/role-packs/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success("تم تحديث الحزمة"); setEditItem(null); setEditType(""); inv(['admin', 'role-packs']); },
  });

  // Mutations - Delete
  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: number }) => api.delete(`/admin/${type}/${id}`).then(r => r.data),
    onSuccess: (_, { type }) => {
      toast.success("تم الحذف بنجاح");
      if (type === 'companies') inv(['admin', 'companies']);
      else if (type === 'settings') inv(['admin', 'settings']);
      else if (type === 'automation-rules') inv(['admin', 'automation-rules']);
      else if (type === 'role-packs') inv(['admin', 'role-packs']);
    },
  });

  const handleDelete = (type: string, id: number, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    deleteMutation.mutate({ type, id });
  };

  const handleEdit = (type: string, item: any) => { setEditItem({ ...item }); setEditType(type); };
  const handleView = (type: string, item: any) => { setViewItem(item); setViewType(type); };

  const handleSaveEdit = () => {
    if (!editItem) return;
    switch (editType) {
      case 'company': updateCompanyMutation.mutate(editItem); break;
      case 'setting': updateSettingMutation.mutate(editItem); break;
      case 'rule': updateRuleMutation.mutate(editItem); break;
      case 'role-pack': updateRolePackMutation.mutate(editItem); break;
    }
  };

  const stats = [
    { label: "الشركات", value: companies?.length || 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "قواعد الأتمتة", value: rules?.length || 0, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "المؤقتات المستحقة", value: dueTimers?.length || 0, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "حزم الأدوار", value: rolePacks?.length || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const handleBackToList = () => setViewMode("list");

  // ===== Reusable helpers =====

  // ===== View Detail Modal =====
  const renderViewModal = () => {
    if (!viewItem) return null;

    const fields: Record<string, { label: string; value: any }[]> = {
      company: [
        { label: "الكود", value: viewItem.code },
        { label: "الاسم (إنجليزي)", value: viewItem.name },
        { label: "الاسم (عربي)", value: viewItem.nameAr },
        { label: "البريد الإلكتروني", value: viewItem.email },
        { label: "رقم الهاتف", value: viewItem.phone },
        { label: "المدينة", value: viewItem.city },
        { label: "الرقم الضريبي", value: viewItem.taxNumber },
        { label: "الحالة", value: viewItem.isActive !== false ? "نشط" : "غير نشط" },
      ],
      setting: [
        { label: "المفتاح", value: viewItem.key },
        { label: "التسمية (إنجليزي)", value: viewItem.label },
        { label: "التسمية (عربي)", value: viewItem.labelAr },
        { label: "القيمة", value: viewItem.value },
        { label: "النوع", value: viewItem.type },
        { label: "النطاق", value: viewItem.scope },
        { label: "التصنيف", value: viewItem.category },
        { label: "الوصف", value: viewItem.description },
      ],
      rule: [
        { label: "الكود", value: viewItem.code },
        { label: "الاسم (إنجليزي)", value: viewItem.name },
        { label: "الاسم (عربي)", value: viewItem.nameAr },
        { label: "نوع المشغل", value: viewItem.triggerType },
        { label: "الحدث المشغل", value: viewItem.triggerEvent },
        { label: "نوع الإجراء", value: viewItem.actionType },
        { label: "الوصف", value: viewItem.description },
        { label: "الحالة", value: viewItem.isActive !== false ? "نشط" : "غير نشط" },
      ],
      'role-pack': [
        { label: "الكود", value: viewItem.code },
        { label: "الاسم (إنجليزي)", value: viewItem.name },
        { label: "الاسم (عربي)", value: viewItem.nameAr },
        { label: "التصنيف", value: viewItem.category },
        { label: "الوصف", value: viewItem.description },
        { label: "افتراضي", value: viewItem.isDefault ? "نعم" : "لا" },
        { label: "الحالة", value: viewItem.isActive !== false ? "نشط" : "غير نشط" },
      ],
    };

    const titles: Record<string, string> = { company: "تفاصيل الشركة", setting: "تفاصيل الإعداد", rule: "تفاصيل القاعدة", 'role-pack': "تفاصيل الحزمة" };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewItem(null)}>
        <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4 border-b pb-3">{titles[viewType] || "التفاصيل"}</h3>
            <div className="space-y-1">
              {(fields[viewType] || []).map((f, i) => (
                <div key={i} className="py-2 border-b last:border-b-0">
                  <p className="text-xs text-gray-500">{f.label}</p>
                  <p className="font-medium mt-0.5">{f.value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
              <Button variant="outline" onClick={() => setViewItem(null)}>إغلاق</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== Edit Modal =====
  const renderEditModal = () => {
    if (!editItem) return null;

    const titles: Record<string, string> = { company: "تعديل الشركة", setting: "تعديل الإعداد", rule: "تعديل القاعدة", 'role-pack': "تعديل الحزمة" };
    const isPending = updateCompanyMutation.isPending || updateSettingMutation.isPending || updateRuleMutation.isPending || updateRolePackMutation.isPending;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setEditItem(null); setEditType(""); }}>
        <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4 border-b pb-3">{titles[editType] || "تعديل"}</h3>
          <div className="space-y-4">
            {editType === 'company' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>الكود</Label><Input value={editItem.code || ''} onChange={e => setEditItem((p: any) => ({ ...p, code: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>المدينة</Label><Input value={editItem.city || ''} onChange={e => setEditItem((p: any) => ({ ...p, city: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>الاسم (إنجليزي)</Label><Input value={editItem.name || ''} onChange={e => setEditItem((p: any) => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>الاسم (عربي)</Label><Input value={editItem.nameAr || ''} onChange={e => setEditItem((p: any) => ({ ...p, nameAr: e.target.value }))} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>البريد الإلكتروني</Label><Input type="email" value={editItem.email || ''} onChange={e => setEditItem((p: any) => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>رقم الهاتف</Label><Input value={editItem.phone || ''} onChange={e => setEditItem((p: any) => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>الرقم الضريبي</Label><Input value={editItem.taxNumber || ''} onChange={e => setEditItem((p: any) => ({ ...p, taxNumber: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>الأقسام المتاحة</Label>
                  <div className="grid grid-cols-2 gap-1.5 border rounded-lg p-3 max-h-56 overflow-y-auto">
                    {AVAILABLE_DEPARTMENTS.map(dept => {
                      const currentCodes: string[] = (() => {
                        try { return JSON.parse(editItem.departmentCodes || '[]'); } catch { return []; }
                      })();
                      return (
                        <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded p-1">
                          <input
                            type="checkbox"
                            checked={currentCodes.includes(dept.id)}
                            onChange={e => {
                              const updated = e.target.checked
                                ? [...currentCodes, dept.id]
                                : currentCodes.filter((d: string) => d !== dept.id);
                              setEditItem((p: any) => ({ ...p, departmentCodes: JSON.stringify(updated) }));
                            }}
                            className="w-4 h-4 accent-amber-600"
                          />
                          <span className="text-sm">{dept.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            {editType === 'setting' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>المفتاح</Label><Input value={editItem.key || ''} onChange={e => setEditItem((p: any) => ({ ...p, key: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>التصنيف</Label><Input value={editItem.category || ''} onChange={e => setEditItem((p: any) => ({ ...p, category: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>النوع</Label>
                    <Select value={editItem.type || 'string'} onValueChange={v => setEditItem((p: any) => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">نص</SelectItem>
                        <SelectItem value="number">رقم</SelectItem>
                        <SelectItem value="boolean">منطقي</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>النطاق</Label>
                    <Select value={editItem.scope || 'global'} onValueChange={v => setEditItem((p: any) => ({ ...p, scope: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">عام</SelectItem>
                        <SelectItem value="company">شركة</SelectItem>
                        <SelectItem value="branch">فرع</SelectItem>
                        <SelectItem value="user">مستخدم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>القيمة</Label><Input value={editItem.value || ''} onChange={e => setEditItem((p: any) => ({ ...p, value: e.target.value }))} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>التسمية (إنجليزي)</Label><Input value={editItem.label || ''} onChange={e => setEditItem((p: any) => ({ ...p, label: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>التسمية (عربي)</Label><Input value={editItem.labelAr || ''} onChange={e => setEditItem((p: any) => ({ ...p, labelAr: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>الوصف</Label><Textarea value={editItem.description || ''} onChange={e => setEditItem((p: any) => ({ ...p, description: e.target.value }))} /></div>
              </>
            )}
            {editType === 'rule' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>الكود</Label><Input value={editItem.code || ''} onChange={e => setEditItem((p: any) => ({ ...p, code: e.target.value }))} /></div>
                  <div className="space-y-1">
                    <Label>نوع المشغل</Label>
                    <Select value={editItem.triggerType || 'event'} onValueChange={v => setEditItem((p: any) => ({ ...p, triggerType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">حدث</SelectItem>
                        <SelectItem value="schedule">جدولة</SelectItem>
                        <SelectItem value="condition">شرط</SelectItem>
                        <SelectItem value="manual">يدوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>الاسم (إنجليزي)</Label><Input value={editItem.name || ''} onChange={e => setEditItem((p: any) => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>الاسم (عربي)</Label><Input value={editItem.nameAr || ''} onChange={e => setEditItem((p: any) => ({ ...p, nameAr: e.target.value }))} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>الحدث المشغل</Label><Input value={editItem.triggerEvent || ''} onChange={e => setEditItem((p: any) => ({ ...p, triggerEvent: e.target.value }))} /></div>
                  <div className="space-y-1">
                    <Label>نوع الإجراء</Label>
                    <Select value={editItem.actionType || 'notification'} onValueChange={v => setEditItem((p: any) => ({ ...p, actionType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">إشعار</SelectItem>
                        <SelectItem value="email">بريد إلكتروني</SelectItem>
                        <SelectItem value="escalation">تصعيد</SelectItem>
                        <SelectItem value="status_change">تغيير حالة</SelectItem>
                        <SelectItem value="create_task">إنشاء مهمة</SelectItem>
                        <SelectItem value="api_call">استدعاء API</SelectItem>
                        <SelectItem value="custom">مخصص</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>الوصف</Label><Textarea value={editItem.description || ''} onChange={e => setEditItem((p: any) => ({ ...p, description: e.target.value }))} /></div>
              </>
            )}
            {editType === 'role-pack' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>الكود</Label><Input value={editItem.code || ''} onChange={e => setEditItem((p: any) => ({ ...p, code: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>التصنيف</Label><Input value={editItem.category || ''} onChange={e => setEditItem((p: any) => ({ ...p, category: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>الاسم (إنجليزي)</Label><Input value={editItem.name || ''} onChange={e => setEditItem((p: any) => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>الاسم (عربي)</Label><Input value={editItem.nameAr || ''} onChange={e => setEditItem((p: any) => ({ ...p, nameAr: e.target.value }))} /></div>
                <div className="space-y-1"><Label>الوصف</Label><Textarea value={editItem.description || ''} onChange={e => setEditItem((p: any) => ({ ...p, description: e.target.value }))} /></div>
              </>
            )}
          </div>
          <div className="flex gap-2 pt-4 mt-4 border-t justify-end">
            <Button variant="outline" onClick={() => { setEditItem(null); setEditType(""); }}>إلغاء</Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>{isPending ? "جاري الحفظ..." : "حفظ التغييرات"}</Button>
          </div>
        </div>
      </div>
      </div>
    );
  };

  // ===== Action Buttons Component =====
  const ActionButtons = ({ type, apiType, item, nameField }: { type: string; apiType: string; item: any; nameField: string }) => (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="عرض" onClick={() => handleView(type, item)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="تعديل" onClick={() => handleEdit(type, item)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0" title="حذف"
        onClick={() => handleDelete(apiType, item.id, item[nameField] || item.nameAr || item.name || item.key || '')}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const StatusBadge = ({ active }: { active: boolean }) => (
    <Badge className={active ? "bg-green-100 text-green-700" : ""} variant={active ? undefined as any : "secondary"}>
      {active ? "نشط" : "غير نشط"}
    </Badge>
  );

  // ===== Add Forms =====
  const renderAddCompanyForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}><ArrowRight className="h-4 w-4 ms-2" />العودة للقائمة</Button>
        <div><h2 className="text-xl sm:text-2xl font-bold">إضافة شركة جديدة</h2><p className="text-muted-foreground text-sm">أدخل بيانات الشركة الجديدة</p></div>
      </div>
      <Card><CardHeader><CardTitle>بيانات الشركة</CardTitle><PrintButton title="بيانات الشركة" /></CardHeader>
        <CardContent><div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الكود</Label><Input value={newCompany.code} onChange={e => setNewCompany({ ...newCompany, code: e.target.value })} placeholder="COMP001" /></div>
            <div className="space-y-2"><Label>المدينة</Label><Input value={newCompany.city} onChange={e => setNewCompany({ ...newCompany, city: e.target.value })} placeholder="الرياض" /></div>
          </div>
          <div className="space-y-2"><Label>اسم الشركة (إنجليزي)</Label><Input value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} placeholder="Company Name" /></div>
          <div className="space-y-2"><Label>اسم الشركة (عربي)</Label><Input value={newCompany.nameAr} onChange={e => setNewCompany({ ...newCompany, nameAr: e.target.value })} placeholder="اسم الشركة" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input type="email" value={newCompany.email} onChange={e => setNewCompany({ ...newCompany, email: e.target.value })} placeholder="info@company.com" /></div>
            <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={newCompany.phone} onChange={e => setNewCompany({ ...newCompany, phone: e.target.value })} placeholder="+966..." /></div>
          </div>
          <div className="space-y-2"><Label>الرقم الضريبي</Label><Input value={newCompany.taxNumber} onChange={e => setNewCompany({ ...newCompany, taxNumber: e.target.value })} placeholder="300..." /></div>
          <div className="space-y-2">
            <Label>الأقسام المتاحة في هذه الشركة</Label>
            <p className="text-xs text-gray-500">اختر الأقسام التي ستكون متاحة للمستخدمين في هذه الشركة</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-lg p-3">
              {AVAILABLE_DEPARTMENTS.map(dept => (
                <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded p-1.5">
                  <input
                    type="checkbox"
                    checked={newCompany.selectedDepts.includes(dept.id)}
                    onChange={e => {
                      const updated = e.target.checked
                        ? [...newCompany.selectedDepts, dept.id]
                        : newCompany.selectedDepts.filter(d => d !== dept.id);
                      setNewCompany({ ...newCompany, selectedDepts: updated });
                    }}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-sm">{dept.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
            <Button disabled={createCompanyMutation.isPending} onClick={() => {
              const { selectedDepts, ...companyData } = newCompany;
              createCompanyMutation.mutate({ ...companyData, departmentCodes: JSON.stringify(selectedDepts) });
            }}>{createCompanyMutation.isPending ? "جاري الإنشاء..." : "إنشاء الشركة"}</Button>
          </div>
        </div></CardContent>
      </Card>
    </div>
  );

  const renderAddSettingForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}><ArrowRight className="h-4 w-4 ms-2" />العودة للقائمة</Button>
        <div><h2 className="text-xl sm:text-2xl font-bold">إضافة إعداد جديد</h2><p className="text-muted-foreground text-sm">أدخل بيانات الإعداد الجديد</p></div>
      </div>
      <Card><CardHeader><CardTitle>بيانات الإعداد</CardTitle></CardHeader>
        <CardContent><div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>المفتاح</Label><Input value={newSetting.key} onChange={e => setNewSetting({ ...newSetting, key: e.target.value })} placeholder="setting.key" /></div>
            <div className="space-y-2"><Label>التصنيف</Label><Input value={newSetting.category} onChange={e => setNewSetting({ ...newSetting, category: e.target.value })} placeholder="system" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>النوع</Label><Select value={newSetting.type} onValueChange={(v: any) => setNewSetting({ ...newSetting, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="string">نص</SelectItem><SelectItem value="number">رقم</SelectItem><SelectItem value="boolean">منطقي</SelectItem><SelectItem value="json">JSON</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>النطاق</Label><Select value={newSetting.scope} onValueChange={(v: any) => setNewSetting({ ...newSetting, scope: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="global">عام</SelectItem><SelectItem value="company">شركة</SelectItem><SelectItem value="branch">فرع</SelectItem><SelectItem value="user">مستخدم</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>القيمة</Label><Input value={newSetting.value} onChange={e => setNewSetting({ ...newSetting, value: e.target.value })} placeholder="القيمة" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>التسمية (إنجليزي)</Label><Input value={newSetting.label} onChange={e => setNewSetting({ ...newSetting, label: e.target.value })} placeholder="Setting Name" /></div>
            <div className="space-y-2"><Label>التسمية (عربي)</Label><Input value={newSetting.labelAr} onChange={e => setNewSetting({ ...newSetting, labelAr: e.target.value })} placeholder="تسمية الإعداد" /></div>
          </div>
          <div className="space-y-2"><Label>الوصف</Label><Textarea value={newSetting.description} onChange={e => setNewSetting({ ...newSetting, description: e.target.value })} placeholder="وصف الإعداد..." /></div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
            <Button onClick={() => createSettingMutation.mutate(newSetting)} disabled={createSettingMutation.isPending}>{createSettingMutation.isPending ? "جاري الإنشاء..." : "إنشاء الإعداد"}</Button>
          </div>
        </div></CardContent>
      </Card>
    </div>
  );

  const renderAddRuleForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}><ArrowRight className="h-4 w-4 ms-2" />العودة للقائمة</Button>
        <div><h2 className="text-xl sm:text-2xl font-bold">إضافة قاعدة أتمتة</h2><p className="text-muted-foreground text-sm">أدخل بيانات القاعدة الجديدة</p></div>
      </div>
      <Card><CardHeader><CardTitle>بيانات القاعدة</CardTitle></CardHeader>
        <CardContent><div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الكود</Label><Input value={newRule.code} onChange={e => setNewRule({ ...newRule, code: e.target.value })} placeholder="RULE001" /></div>
            <div className="space-y-2"><Label>نوع المشغل</Label><Select value={newRule.triggerType} onValueChange={(v: any) => setNewRule({ ...newRule, triggerType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="event">حدث</SelectItem><SelectItem value="schedule">جدولة</SelectItem><SelectItem value="condition">شرط</SelectItem><SelectItem value="manual">يدوي</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>الاسم (إنجليزي)</Label><Input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="Rule Name" /></div>
          <div className="space-y-2"><Label>الاسم (عربي)</Label><Input value={newRule.nameAr} onChange={e => setNewRule({ ...newRule, nameAr: e.target.value })} placeholder="اسم القاعدة" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الحدث المشغل</Label><Input value={newRule.triggerEvent} onChange={e => setNewRule({ ...newRule, triggerEvent: e.target.value })} placeholder="request.created" /></div>
            <div className="space-y-2"><Label>نوع الإجراء</Label><Select value={newRule.actionType} onValueChange={(v: any) => setNewRule({ ...newRule, actionType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="notification">إشعار</SelectItem><SelectItem value="email">بريد إلكتروني</SelectItem><SelectItem value="escalation">تصعيد</SelectItem><SelectItem value="status_change">تغيير حالة</SelectItem><SelectItem value="create_task">إنشاء مهمة</SelectItem><SelectItem value="api_call">استدعاء API</SelectItem><SelectItem value="custom">مخصص</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>الوصف</Label><Textarea value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })} placeholder="وصف القاعدة..." /></div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
            <Button onClick={() => createRuleMutation.mutate(newRule)} disabled={createRuleMutation.isPending}>{createRuleMutation.isPending ? "جاري الإنشاء..." : "إنشاء القاعدة"}</Button>
          </div>
        </div></CardContent>
      </Card>
    </div>
  );

  const renderAddRolePackForm = () => (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={handleBackToList}><ArrowRight className="h-4 w-4 ms-2" />العودة للقائمة</Button>
        <div><h2 className="text-xl sm:text-2xl font-bold">إضافة حزمة أدوار</h2><p className="text-muted-foreground text-sm">أدخل بيانات الحزمة الجديدة</p></div>
      </div>
      <Card><CardHeader><CardTitle>بيانات الحزمة</CardTitle></CardHeader>
        <CardContent><div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الكود</Label><Input value={newRolePack.code} onChange={e => setNewRolePack({ ...newRolePack, code: e.target.value })} placeholder="PACK001" /></div>
            <div className="space-y-2"><Label>التصنيف</Label><Input value={newRolePack.category} onChange={e => setNewRolePack({ ...newRolePack, category: e.target.value })} placeholder="hr" /></div>
          </div>
          <div className="space-y-2"><Label>الاسم (إنجليزي)</Label><Input value={newRolePack.name} onChange={e => setNewRolePack({ ...newRolePack, name: e.target.value })} placeholder="Role Pack Name" /></div>
          <div className="space-y-2"><Label>الاسم (عربي)</Label><Input value={newRolePack.nameAr} onChange={e => setNewRolePack({ ...newRolePack, nameAr: e.target.value })} placeholder="اسم الحزمة" /></div>
          <div className="space-y-2"><Label>الوصف</Label><Textarea value={newRolePack.description} onChange={e => setNewRolePack({ ...newRolePack, description: e.target.value })} placeholder="وصف الحزمة..." /></div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button variant="outline" onClick={handleBackToList}>إلغاء</Button>
            <Button onClick={() => createRolePackMutation.mutate(newRolePack)} disabled={createRolePackMutation.isPending}>{createRolePackMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحزمة"}</Button>
          </div>
        </div></CardContent>
      </Card>
    </div>
  );

  // ===== List View =====
  const renderListView = () => (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 truncate">إدارة النظام</h2>
          <p className="text-gray-500 text-sm">Kernel Fix Sprint - Scope Contract & Governance</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary shrink-0"><Shield className="h-4 w-4 ms-1" />مدير النظام</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={`stat-${i}`} className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-2">
              <div className="min-w-0"><p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{stat.label}</p><h3 className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</h3></div>
              <div className={`p-2 sm:p-3 rounded-xl ${stat.bg} shrink-0`}><stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-2 px-2 pb-1">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 gap-1">
            <TabsTrigger value="companies" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"><Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>الشركات</span></TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"><Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>الإعدادات</span></TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"><Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>الأتمتة</span></TabsTrigger>
            <TabsTrigger value="timers" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"><Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>المؤقتات</span></TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"><Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>الأدوار</span></TabsTrigger>
            <TabsTrigger value="governance" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"><Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span>الحوكمة</span></TabsTrigger>
          </TabsList>
        </div>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div><CardTitle>إدارة الشركات</CardTitle><CardDescription>إدارة الشركات والكيانات في النظام</CardDescription></div>
              <Button onClick={() => setViewMode("add-company")} className="shrink-0"><Plus className="h-4 w-4 ms-2" />إضافة شركة</Button>
            </CardHeader>
            <CardContent><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead className="whitespace-nowrap">الكود</TableHead>
                <TableHead className="whitespace-nowrap">الاسم</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">المدينة</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">البريد</TableHead>
                <TableHead className="whitespace-nowrap">الحالة</TableHead>
                <TableHead className="whitespace-nowrap">الإجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {companies?.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm">{c.code}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{c.nameAr || c.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{c.city}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[150px] truncate">{c.email}</TableCell>
                    <TableCell><StatusBadge active={c.isActive !== false} /></TableCell>
                    <TableCell><ActionButtons type="company" apiType="companies" item={c} nameField="nameAr" /></TableCell>
                  </TableRow>
                ))}
                {(!companies || companies.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">لا توجد شركات</TableCell></TableRow>}
              </TableBody>
            </Table></div></CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div><CardTitle>إعدادات النظام</CardTitle><CardDescription>إدارة إعدادات النظام العامة</CardDescription></div>
              <Button onClick={() => setViewMode("add-setting")} className="shrink-0"><Plus className="h-4 w-4 ms-2" />إضافة إعداد</Button>
            </CardHeader>
            <CardContent><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead className="whitespace-nowrap">المفتاح</TableHead>
                <TableHead className="whitespace-nowrap">التسمية</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">القيمة</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">النوع</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">النطاق</TableHead>
                <TableHead className="whitespace-nowrap">الإجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {settings?.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm max-w-[120px] truncate">{s.key}</TableCell>
                    <TableCell className="max-w-[120px] truncate">{s.labelAr || s.label}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[150px] truncate">{s.value}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{s.type}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="secondary">{s.scope}</Badge></TableCell>
                    <TableCell><ActionButtons type="setting" apiType="settings" item={s} nameField="labelAr" /></TableCell>
                  </TableRow>
                ))}
                {(!settings || settings.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">لا توجد إعدادات</TableCell></TableRow>}
              </TableBody>
            </Table></div></CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div><CardTitle>قواعد الأتمتة</CardTitle><CardDescription>إدارة قواعد الأتمتة والتشغيل التلقائي</CardDescription></div>
              <Button onClick={() => setViewMode("add-rule")} className="shrink-0"><Plus className="h-4 w-4 ms-2" />إضافة قاعدة</Button>
            </CardHeader>
            <CardContent><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead className="whitespace-nowrap">الكود</TableHead>
                <TableHead className="whitespace-nowrap">الاسم</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">المشغل</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">الإجراء</TableHead>
                <TableHead className="whitespace-nowrap">الحالة</TableHead>
                <TableHead className="whitespace-nowrap">الإجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rules?.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.code}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{r.nameAr || r.name}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline">{r.triggerType}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{r.actionType}</Badge></TableCell>
                    <TableCell><StatusBadge active={r.isActive !== false} /></TableCell>
                    <TableCell><ActionButtons type="rule" apiType="automation-rules" item={r} nameField="nameAr" /></TableCell>
                  </TableRow>
                ))}
                {(!rules || rules.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">لا توجد قواعد أتمتة</TableCell></TableRow>}
              </TableBody>
            </Table></div></CardContent>
          </Card>
        </TabsContent>

        {/* Timers Tab */}
        <TabsContent value="timers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div><CardTitle>المؤقتات المستحقة</CardTitle><CardDescription>المؤقتات والتذكيرات التي حان موعدها</CardDescription></div>
              <Button variant="outline" onClick={() => inv(['admin', 'timers', 'due'])} className="shrink-0"><RefreshCw className="h-4 w-4 ms-2" />تحديث</Button>
            </CardHeader>
            <CardContent><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead className="whitespace-nowrap">الكود</TableHead>
                <TableHead className="whitespace-nowrap">الاسم</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">النوع</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">المرجع</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">موعد الاستحقاق</TableHead>
                <TableHead className="whitespace-nowrap">الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {dueTimers?.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.code}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline">{t.timerType}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{t.referenceType} #{t.referenceId}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDateTime(t.dueAt)}</TableCell>
                    <TableCell><Badge variant={t.status === "pending" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {(!dueTimers || dueTimers.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">لا توجد مؤقتات مستحقة</TableCell></TableRow>}
              </TableBody>
            </Table></div></CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div><CardTitle>حزم الأدوار</CardTitle><CardDescription>قوالب الأدوار الجاهزة للتعيين</CardDescription></div>
              <Button onClick={() => setViewMode("add-role-pack")} className="shrink-0"><Plus className="h-4 w-4 ms-2" />إضافة حزمة</Button>
            </CardHeader>
            <CardContent><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead className="whitespace-nowrap">الكود</TableHead>
                <TableHead className="whitespace-nowrap">الاسم</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">التصنيف</TableHead>
                <TableHead className="whitespace-nowrap hidden md:table-cell">افتراضي</TableHead>
                <TableHead className="whitespace-nowrap">الحالة</TableHead>
                <TableHead className="whitespace-nowrap">الإجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rolePacks?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.code}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{p.nameAr || p.name}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{p.isDefault ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}</TableCell>
                    <TableCell><StatusBadge active={p.isActive !== false} /></TableCell>
                    <TableCell><ActionButtons type="role-pack" apiType="role-packs" item={p} nameField="nameAr" /></TableCell>
                  </TableRow>
                ))}
                {(!rolePacks || rolePacks.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">لا توجد حزم أدوار</TableCell></TableRow>}
              </TableBody>
            </Table></div></CardContent>
          </Card>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" /><span className="truncate">فحوصات الحوكمة الفاشلة</span></CardTitle>
                <CardDescription>آخر محاولات الوصول المرفوضة</CardDescription>
              </CardHeader>
              <CardContent><div className="space-y-3">
                {failedChecks?.slice(0, 5).map((ck: any) => (
                  <div key={ck.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{ck.endpoint}</p><p className="text-xs text-gray-500 truncate">{ck.failureReason}</p><p className="text-xs text-gray-400 mt-1">{formatDateTime(ck.createdAt)}</p></div>
                    <Badge variant="outline" className="text-red-600 border-red-200 shrink-0 text-xs">{ck.checkType}</Badge>
                  </div>
                ))}
                {(!failedChecks || failedChecks.length === 0) && <div className="text-center text-gray-500 py-8"><CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" /><p>لا توجد فحوصات فاشلة</p></div>}
              </div></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Lock className="h-5 w-5 text-blue-600 shrink-0" /><span className="truncate">نقاط النهاية المحمية</span></CardTitle>
                <CardDescription>قائمة الـ APIs المحمية</CardDescription>
              </CardHeader>
              <CardContent><div className="space-y-2">
                {protectedEndpoints?.slice(0, 8).map((ep: any) => (
                  <div key={ep.id} className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 min-w-0"><Badge variant="outline" className="font-mono text-xs shrink-0">{ep.method}</Badge><span className="text-sm font-mono truncate">{ep.endpoint}</span></div>
                    <Badge variant={ep.riskLevel === "critical" ? "destructive" : ep.riskLevel === "high" ? "default" : "secondary"} className="shrink-0">{ep.riskLevel}</Badge>
                  </div>
                ))}
                {(!protectedEndpoints || protectedEndpoints.length === 0) && <div className="text-center text-gray-500 py-8"><Unlock className="h-12 w-12 mx-auto text-gray-400 mb-2" /><p>لا توجد نقاط نهاية محمية مسجلة</p></div>}
              </div></CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {renderViewModal()}
      {renderEditModal()}
    </div>
  );

  // Main render
  switch (viewMode) {
    case "add-company": return renderAddCompanyForm();
    case "add-setting": return renderAddSettingForm();
    case "add-rule": return renderAddRuleForm();
    case "add-role-pack": return renderAddRolePackForm();
    default: return renderListView();
  }
}
