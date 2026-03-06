import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplate {
  id: number;
  name: string;
  nameAr: string | null;
  type: 'email' | 'whatsapp' | 'sms';
  eventType: string;
  subject: string | null;
  subjectAr: string | null;
  body: string;
  bodyAr: string | null;
  variables: string[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventTypes = [
  { value: 'employee_created', label: 'إنشاء موظف جديد' },
  { value: 'leave_requested', label: 'طلب إجازة' },
  { value: 'leave_approved', label: 'الموافقة على إجازة' },
  { value: 'leave_rejected', label: 'رفض إجازة' },
  { value: 'task_assigned', label: 'تعيين مهمة' },
  { value: 'task_completed', label: 'إكمال مهمة' },
  { value: 'verification_code', label: 'رمز التحقق' },
  { value: 'leave_reminder', label: 'تذكير بالإجازة' },
  { value: 'salary_issued', label: 'صرف الراتب' },
  { value: 'contract_expiring', label: 'انتهاء العقد' },
  { value: 'meeting_reminder', label: 'تذكير بالاجتماع' },
  { value: 'document_shared', label: 'مشاركة مستند' },
  { value: 'request_approved', label: 'الموافقة على طلب' },
  { value: 'request_rejected', label: 'رفض طلب' },
  { value: 'custom', label: 'مخصص' },
];

const typeIcons = {
  email: Mail,
  whatsapp: MessageSquare,
  sms: Smartphone,
};

const typeLabels = {
  email: 'بريد إلكتروني',
  whatsapp: 'واتساب',
  sms: 'رسالة نصية',
};

const typeColors = {
  email: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
  sms: 'bg-purple-100 text-purple-700',
};

// متغيرات المعاينة الافتراضية
const defaultPreviewVariables: Record<string, Record<string, string>> = {
  employee_created: {
    employee_name: 'أحمد محمد',
    employee_code: 'EMP-0001',
    department: 'تقنية المعلومات',
    position: 'مطور برمجيات',
    start_date: '2024-01-15',
    company_name: 'منصة غيث',
  },
  leave_approved: {
    employee_name: 'أحمد محمد',
    leave_type: 'إجازة سنوية',
    start_date: '2024-02-01',
    end_date: '2024-02-05',
    days: '5',
    approved_by: 'محمد علي',
  },
  leave_rejected: {
    employee_name: 'أحمد محمد',
    leave_type: 'إجازة سنوية',
    start_date: '2024-02-01',
    end_date: '2024-02-05',
    rejected_by: 'محمد علي',
    reason: 'ضغط العمل',
  },
  request_approved: {
    requester_name: 'أحمد محمد',
    request_type: 'طلب شراء',
    request_number: 'REQ-0001',
    approved_by: 'محمد علي',
  },
  request_rejected: {
    requester_name: 'أحمد محمد',
    request_type: 'طلب شراء',
    request_number: 'REQ-0001',
    rejected_by: 'محمد علي',
    reason: 'الميزانية غير كافية',
  },
  verification_code: {
    code: '123456',
    expiry_minutes: '10',
  },
  custom: {
    name: 'الاسم',
    value: 'القيمة',
  },
};

// دالة استبدال المتغيرات
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value);
  }
  return result;
}

// مكون نافذة المعاينة
function PreviewDialog({
  template,
  isOpen,
  onClose,
  onEdit,
  eventTypes,
  typeColors,
  typeLabels,
}: {
  template: MessageTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (t: MessageTemplate) => void;
  eventTypes: { value: string; label: string }[];
  typeColors: Record<string, string>;
  typeLabels: Record<string, string>;
}) {
  const [previewMode, setPreviewMode] = useState<'raw' | 'preview'>('preview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  // تحديث المتغيرات عند تغيير القالب
  useEffect(() => {
    if (template) {
      const defaultVars = defaultPreviewVariables[template.eventType] || {};
      const templateVars: Record<string, string> = {};
      template.variables?.forEach(v => {
        templateVars[v] = defaultVars[v] || `[قيمة ${v}]`;
      });
      setCustomVariables(templateVars);
    }
  }, [template]);

  if (!template) return null;

  const getPreviewContent = (text: string) => {
    if (previewMode === 'raw') return text;
    return replaceVariables(text, customVariables);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            معاينة القالب
          </DialogTitle>
          <DialogDescription>
            {template.nameAr || template.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* معلومات القالب */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeColors[template.type]}>
              {typeLabels[template.type]}
            </Badge>
            <Badge variant="outline">
              {eventTypes.find(e => e.value === template.eventType)?.label || template.eventType}
            </Badge>
            {template.isActive ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 ms-1" />
                مفعل
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700">
                <XCircle className="h-3 w-3 ms-1" />
                معطل
              </Badge>
            )}
          </div>

          {/* أزرار التبديل */}
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={previewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('preview')}
            >
              <Eye className="h-4 w-4 ms-1" />
              معاينة حية
            </Button>
            <Button
              variant={previewMode === 'raw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('raw')}
            >
              <FileText className="h-4 w-4 ms-1" />
              النص الأصلي
            </Button>
          </div>

          {/* محرر المتغيرات */}
          {previewMode === 'preview' && template.variables && template.variables.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-blue-800 mb-3">تخصيص قيم المتغيرات:</p>
                <div className="grid grid-cols-2 gap-3">
                  {template?.variables?.map((variable) => (
                    <div key={variable} className="flex items-center gap-2">
                      <Label className="text-xs w-24 text-blue-700">{`{{${variable}}}`}</Label>
                      <Input
                        value={customVariables[variable] || ''}
                        onChange={(e) => setCustomVariables(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                        className="h-8 text-sm bg-white"
                        placeholder={`قيمة ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* عنوان البريد */}
          {template.type === 'email' && template.subject && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-500 mb-1">العنوان:</p>
              <p className="font-medium">{getPreviewContent(template.subjectAr || template.subject)}</p>
            </div>
          )}

          {/* محتوى الرسالة */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-500 mb-2">المحتوى:</p>
            <div className="bg-white p-4 rounded border">
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {getPreviewContent(template.bodyAr || template.body)}
              </pre>
            </div>
          </div>

          {/* قائمة المتغيرات */}
          {template.variables && template.variables.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-800 mb-2">المتغيرات المتاحة:</p>
              <div className="flex flex-wrap gap-2">
                {template?.variables?.map((variable, index) => (
                  <Badge key={variable.id ?? `Badge-${index}`} variant="outline" className="bg-white">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button onClick={() => onEdit(template)}>
            <Edit className="ms-2 h-4 w-4" />
            تعديل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MessageTemplates() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [showInlineForm, setShowInlineForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    type: 'email' as 'email' | 'whatsapp' | 'sms',
    eventType: '',
    subject: '',
    subjectAr: '',
    body: '',
    bodyAr: '',
    variables: '',
    isActive: true,
  });

  const { data: templates, isLoading, refetch } = useQuery({ queryKey: ['message-templates', filterType], queryFn: () => api.get('/settings/message-templates', { params: { type: filterType === 'all' ? undefined : filterType } }).then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/settings/message-templates', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء القالب بنجاح');
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء القالب: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/settings/message-templates/${data.id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث القالب بنجاح');
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل تحديث القالب: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/settings/message-templates/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف القالب بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حذف القالب: ${error.message}`);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (data: any) => api.put(`/settings/message-templates/${data.id}/toggle-active`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث حالة القالب');
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل تحديث الحالة: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      type: 'email',
      eventType: '',
      subject: '',
      subjectAr: '',
      body: '',
      bodyAr: '',
      variables: '',
      isActive: true,
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      nameAr: template.nameAr || '',
      type: template.type,
      eventType: template.eventType,
      subject: template.subject || '',
      subjectAr: template.subjectAr || '',
      body: template.body,
      bodyAr: template.bodyAr || '',
      variables: template.variables?.join(', ') || '',
      isActive: template.isActive,
    });
    setIsDialogOpen(true);
  };

  const handlePreview = (template: MessageTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDuplicate = (template: MessageTemplate) => {
    setFormData({
      name: `${template.name} (نسخة)`,
      nameAr: template.nameAr ? `${template.nameAr} (نسخة)` : '',
      type: template.type,
      eventType: `${template.eventType}_copy`,
      subject: template.subject || '',
      subjectAr: template.subjectAr || '',
      body: template.body,
      bodyAr: template.bodyAr || '',
      variables: template.variables?.join(', ') || '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.eventType || !formData.body) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const variables = formData.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v);

    const data = {
      name: formData.name,
      nameAr: formData.nameAr || null,
      type: formData.type,
      eventType: formData.eventType,
      subject: formData.subject || null,
      subjectAr: formData.subjectAr || null,
      body: formData.body,
      bodyAr: formData.bodyAr || null,
      variables: variables.length > 0 ? variables : null,
      isActive: formData.isActive,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      deleteMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const filteredTemplates = templates?.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.eventType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">قوالب الرسائل</h2>
          <p className="text-gray-500">إدارة قوالب الرسائل للبريد الإلكتروني والواتساب والرسائل النصية</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="ms-2 h-4 w-4" />
          إضافة قالب
        </Button>
      </div>

      {/* إحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates?.length || 0}</p>
              <p className="text-sm text-gray-500">إجمالي القوالب</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates?.filter(t => t.type === 'email').length || 0}</p>
              <p className="text-sm text-gray-500">قوالب البريد</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates?.filter(t => t.type === 'whatsapp').length || 0}</p>
              <p className="text-sm text-gray-500">قوالب الواتساب</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Smartphone className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates?.filter(t => t.type === 'sms').length || 0}</p>
              <p className="text-sm text-gray-500">قوالب SMS</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلترة وبحث */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث في القوالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع القالب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="email">بريد إلكتروني</SelectItem>
                <SelectItem value="whatsapp">واتساب</SelectItem>
                <SelectItem value="sms">رسالة نصية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول القوالب */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">القالب</TableHead>
                <TableHead className="text-end">النوع</TableHead>
                <TableHead className="text-end">الحدث</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">آخر تحديث</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates?.map((template) => {
                const TypeIcon = typeIcons[template.type];
                return (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.nameAr || template.name}</p>
                        {template.nameAr && (
                          <p className="text-sm text-gray-500">{template.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[template.type]}>
                        <TypeIcon className="h-3 w-3 ms-1" />
                        {typeLabels[template.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {eventTypes.find(e => e.value === template.eventType)?.label || template.eventType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.isActive}
                        onCheckedChange={() => toggleActiveMutation.mutate({ id: template.id, isActive: !template.isActive })}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(template.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(template)}
                          title="معاينة"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(template)}
                          title="نسخ"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          title="حذف"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!filteredTemplates || filteredTemplates.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد قوالب
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة إضافة/تعديل قالب */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'تعديل القالب' : 'إضافة قالب جديد'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'قم بتعديل بيانات القالب' : 'أدخل بيانات القالب الجديد'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم القالب (إنجليزي) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Employee Welcome"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">اسم القالب (عربي)</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="ترحيب بالموظف"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الرسالة *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'email' | 'whatsapp' | 'sms') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="whatsapp">واتساب</SelectItem>
                    <SelectItem value="sms">رسالة نصية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع الحدث *</Label>
                <Select 
                  value={formData.eventType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الحدث" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(event => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'email' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">عنوان البريد (إنجليزي)</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Welcome to {{company_name}}"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectAr">عنوان البريد (عربي)</Label>
                  <Input
                    id="subjectAr"
                    value={formData.subjectAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectAr: e.target.value }))}
                    placeholder="مرحباً بك في {{company_name}}"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="body">محتوى الرسالة (إنجليزي) *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Dear {{employee_name}},&#10;&#10;Welcome to our team!"
                rows={5}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyAr">محتوى الرسالة (عربي)</Label>
              <Textarea
                id="bodyAr"
                value={formData.bodyAr}
                onChange={(e) => setFormData(prev => ({ ...prev, bodyAr: e.target.value }))}
                placeholder="عزيزي {{employee_name}}،&#10;&#10;مرحباً بك في فريقنا!"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="variables">المتغيرات المتاحة</Label>
              <Input
                id="variables"
                value={formData.variables}
                onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                placeholder="employee_name, employee_id, department, company_name"
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                أدخل أسماء المتغيرات مفصولة بفاصلة. استخدم {'{{variable_name}}'} في النص.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>تفعيل القالب</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                editingTemplate ? 'تحديث' : 'إضافة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة المعاينة الحية */}
      <PreviewDialog 
        template={previewTemplate}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onEdit={(t) => {
          handleEdit(t);
          setIsPreviewOpen(false);
        }}
        eventTypes={eventTypes}
        typeColors={typeColors}
        typeLabels={typeLabels}
      />
    
      {/* AlertDialog لتأكيد الحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}