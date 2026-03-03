import { formatDate, formatDateTime } from '@/lib/formatDate';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Plus, FileText, Clock, CheckCircle2, Inbox, UserPlus, Loader2, Eye } from 'lucide-react';
import { PrintButton } from "@/components/PrintButton";

export default function ApplicationList() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewApplication, setShowNewApplication] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [newApplication, setNewApplication] = useState({
    jobId: '',
    applicantName: '',
    email: '',
    phone: '',
    yearsOfExperience: '',
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: '',
    coverLetter: '',
    source: 'website' as const
  });

  const utils = trpc.useUtils();

  // جلب البيانات من API
  const { data: applications = [], isLoading, isError, error} = trpc.recruitment.applications.list.useQuery();
  const { data: jobs = [] } = trpc.recruitment.jobs.list.useQuery();

  // Mutations
  const createApplicationMutation = trpc.recruitment.applications.create.useMutation({
    onSuccess: () => {
      toast.success('تم إضافة الطلب بنجاح');
      utils.recruitment.applications.list.invalidate();
      setShowNewApplication(false);
      resetNewApplication();
    },
    onError: (error) => {
      toast.error('فشل في إضافة الطلب: ' + error.message);
    }
  });

  const updateStatusMutation = trpc.recruitment.applications.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث الحالة بنجاح');
      utils.recruitment.applications.list.invalidate();
      setShowDetails(false);
    },
    onError: (error) => {
      toast.error('فشل في تحديث الحالة: ' + error.message);
    }
  });

  const resetNewApplication = () => {
    setNewApplication({
      jobId: '',
      applicantName: '',
      email: '',
      phone: '',
      yearsOfExperience: '',
      currentSalary: '',
      expectedSalary: '',
      noticePeriod: '',
      coverLetter: '',
      source: 'website'
    });
  };

  const filteredApplications = applications.filter((app: any) => {
    const matchesSearch = app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a: any) => a.status === 'new').length,
    reviewing: applications.filter((a: any) => a.status === 'screening' || a.status === 'interview').length,
    accepted: applications.filter((a: any) => a.status === 'hired').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-yellow-100 text-yellow-800">جديد</Badge>;
      case 'screening': return <Badge className="bg-blue-100 text-blue-800">فرز</Badge>;
      case 'interview': return <Badge className="bg-purple-100 text-purple-800">مقابلة</Badge>;
      case 'assessment': return <Badge className="bg-indigo-100 text-indigo-800">تقييم</Badge>;
      case 'offer': return <Badge className="bg-green-100 text-green-800">عرض</Badge>;
      case 'hired': return <Badge className="bg-emerald-100 text-emerald-800">تم التوظيف</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      case 'withdrawn': return <Badge className="bg-gray-100 text-gray-800">منسحب</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateApplication = () => {
    if (!newApplication.jobId || !newApplication.applicantName || !newApplication.email) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    createApplicationMutation.mutate({
      jobId: parseInt(newApplication.jobId),
      applicantName: newApplication.applicantName,
      email: newApplication.email,
      phone: newApplication.phone || undefined,
      yearsOfExperience: newApplication.yearsOfExperience ? parseInt(newApplication.yearsOfExperience) : undefined,
      currentSalary: newApplication.currentSalary ? parseInt(newApplication.currentSalary) : undefined,
      expectedSalary: newApplication.expectedSalary ? parseInt(newApplication.expectedSalary) : undefined,
      noticePeriod: newApplication.noticePeriod || undefined,
      coverLetter: newApplication.coverLetter || undefined,
      source: newApplication.source
    });
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">طلبات التوظيف</h2>
          <p className="text-gray-500">إدارة ومتابعة طلبات التوظيف</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewApplication(true)}>
          <Plus className="h-4 w-4" />
          طلب جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الطلبات</p>
              <p className="text-2xl font-bold">{stats.total?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-50">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">جديد</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">قيد المراجعة</p>
              <p className="text-2xl font-bold">{stats.reviewing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">تم التوظيف</p>
              <p className="text-2xl font-bold">{stats.accepted}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
              <PrintButton title="قائمة الطلبات" />
          <CardDescription>جميع طلبات التوظيف المقدمة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم أو البريد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="screening">فرز</SelectItem>
                <SelectItem value="interview">مقابلة</SelectItem>
                <SelectItem value="assessment">تقييم</SelectItem>
                <SelectItem value="offer">عرض</SelectItem>
                <SelectItem value="hired">تم التوظيف</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">لا توجد طلبات</p>
              <p className="text-sm">انقر على "طلب جديد" لإضافة طلب توظيف</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المتقدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>سنوات الخبرة</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications?.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.applicantName}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.phone || '-'}</TableCell>
                    <TableCell>{app.yearsOfExperience || '-'}</TableCell>
                    <TableCell>{formatDate(app.appliedAt)}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedApplication(app);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Application*/}
      {showNewApplication && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إضافة طلب توظيف جديد</h3>
            <p className="text-sm text-gray-500">أدخل بيانات المتقدم للوظيفة</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>الوظيفة *</Label>
              <Select 
                value={newApplication.jobId} 
                onValueChange={(value) => setNewApplication({ ...newApplication, jobId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوظيفة" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.filter((j: any) => j.status === 'open').map((job: any) => (
                    <SelectItem key={job.id} value={String(job.id)}>
                      {job.titleAr || job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المتقدم *</Label>
                <Input
                  value={newApplication.applicantName}
                  onChange={(e) => setNewApplication({ ...newApplication, applicantName: e.target.value })}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني *</Label>
                <Input
                  type="email"
                  value={newApplication.email}
                  onChange={(e) => setNewApplication({ ...newApplication, email: e.target.value })}
                  placeholder="مثال"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={newApplication.phone}
                  onChange={(e) => setNewApplication({ ...newApplication, phone: e.target.value })}
                  placeholder="أدخل..."
                />
              </div>
              <div className="space-y-2">
                <Label>سنوات الخبرة</Label>
                <Input
                  type="number"
                  min="0"
                  value={newApplication.yearsOfExperience}
                  onChange={(e) => setNewApplication({ ...newApplication, yearsOfExperience: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الراتب الحالي</Label>
                <Input
                  type="number"
                  value={newApplication.currentSalary}
                  onChange={(e) => setNewApplication({ ...newApplication, currentSalary: e.target.value })}
                  placeholder="بالريال"
                />
              </div>
              <div className="space-y-2">
                <Label>الراتب المتوقع</Label>
                <Input
                  type="number"
                  value={newApplication.expectedSalary}
                  onChange={(e) => setNewApplication({ ...newApplication, expectedSalary: e.target.value })}
                  placeholder="بالريال"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>فترة الإشعار</Label>
                <Input
                  value={newApplication.noticePeriod}
                  onChange={(e) => setNewApplication({ ...newApplication, noticePeriod: e.target.value })}
                  placeholder="مثال: شهر واحد"
                />
              </div>
              <div className="space-y-2">
                <Label>مصدر الطلب</Label>
                <Select 
                  value={newApplication.source} 
                  onValueChange={(value: any) => setNewApplication({ ...newApplication, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">الموقع</SelectItem>
                    <SelectItem value="linkedin">لينكد إن</SelectItem>
                    <SelectItem value="referral">ترشيح</SelectItem>
                    <SelectItem value="agency">وكالة توظيف</SelectItem>
                    <SelectItem value="job_board">منصة توظيف</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>خطاب التقديم</Label>
              <Textarea
                value={newApplication.coverLetter}
                onChange={(e) => setNewApplication({ ...newApplication, coverLetter: e.target.value })}
                placeholder="نبذة عن المتقدم وأسباب التقديم..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewApplication(false)}>إلغاء</Button>
            <Button onClick={handleCreateApplication} disabled={createApplicationMutation.isPending}>
              {createApplicationMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إضافة الطلب
            </Button>
          </div>
        
      </div>)}


      {/* Application Details*/}
      {showDetails && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
          </div>
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplication.applicantName}</h3>
                  <p className="text-sm text-gray-500">{getStatusBadge(selectedApplication.status)}</p>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">البريد الإلكتروني:</span>
                  <span>{selectedApplication.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الهاتف:</span>
                  <span>{selectedApplication.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">سنوات الخبرة:</span>
                  <span>{selectedApplication.yearsOfExperience || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الراتب المتوقع:</span>
                  <span>{selectedApplication.expectedSalary ? `${selectedApplication.expectedSalary} ريال` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ التقديم:</span>
                  <span>{formatDate(selectedApplication.appliedAt)}</span>
                </div>
              </div>
              {selectedApplication.coverLetter && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">خطاب التقديم</h4>
                  <p className="text-sm text-gray-600">{selectedApplication.coverLetter}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">تحديث الحالة</h4>
                <div className="flex flex-wrap gap-2">
                  {['screening', 'interview', 'assessment', 'offer', 'hired', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({
                          id: selectedApplication.id,
                          status: status as any
                        });
                      }}
                      disabled={selectedApplication.status === status || updateStatusMutation.isPending}
                    >
                      {status === 'screening' && 'فرز'}
                      {status === 'interview' && 'مقابلة'}
                      {status === 'assessment' && 'تقييم'}
                      {status === 'offer' && 'عرض'}
                      {status === 'hired' && 'توظيف'}
                      {status === 'rejected' && 'رفض'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowDetails(false)}>إغلاق</Button>
          </div>
        
      </div>)}

    </div>
  );
}
