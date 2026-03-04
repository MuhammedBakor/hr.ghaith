import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Users, Plus, Eye, Edit, UserPlus, FileText, Calendar, CheckCircle2, XCircle, Mail, Phone, Inbox, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";
import {
  useRecruitmentJobs,
  useCreateRecruitmentJob,
  useUpdateRecruitmentJob,
  useDeleteRecruitmentJob,
  useRecruitmentApplications,
  useUpdateApplicationStatus,
  useRecruitmentInterviews,
  useCreateInterview
} from "@/services/recruitmentService";

export default function RecruitmentAdvanced() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || (userRole && String(userRole).includes("manager"));
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [activeTab, setActiveTab] = useState('jobs');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [showApplicantDetails, setShowApplicantDetails] = useState(false);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    titleAr: '',
    location: '',
    employmentType: 'full_time' as const,
    experienceLevel: 'mid' as const,
    description: '',
    requirements: '',
    benefits: '',
    openings: 1,
    applicationDeadline: ''
  });
  const [interviewData, setInterviewData] = useState({
    interviewType: 'phone' as const,
    scheduledAt: '',
    duration: 60,
    location: '',
    meetingLink: ''
  });


  // جلب البيانات من API
  const { data: jobs = [], isLoading: jobsLoading, isError } = useRecruitmentJobs();
  const { data: applications = [], isLoading: applicationsLoading } = useRecruitmentApplications();
  const { data: interviews = [] } = useRecruitmentInterviews();

  // Mutations
  const createJobMutation = useCreateRecruitmentJob();
  const updateJobMutation = useUpdateRecruitmentJob();
  const deleteJobMutation = useDeleteRecruitmentJob();
  const updateApplicationStatusMutation = useUpdateApplicationStatus();
  const createInterviewMutation = useCreateInterview();

  // Note: Local "publish" and "close" logic will be handled via Generic Update Job for now
  // as the backend implementation for specialized /publish and /close endpoints was simplified to generic update.
  const handlePublishJob = (id: number) => {
    updateJobMutation.mutate({ id, status: 'open' }, {
      onSuccess: () => toast.success('تم نشر الوظيفة بنجاح')
    });
  };

  const handleCloseJob = (id: number) => {
    updateJobMutation.mutate({ id, status: 'closed' }, {
      onSuccess: () => toast.success('تم إغلاق الوظيفة بنجاح')
    });
  };

  const resetNewJob = () => {
    setNewJob({
      title: '',
      titleAr: '',
      location: '',
      employmentType: 'full_time',
      experienceLevel: 'mid',
      description: '',
      requirements: '',
      benefits: '',
      openings: 1,
      applicationDeadline: ''
    });
  };

  const recruitmentStats = {
    openPositions: jobs.filter((j: any) => j.status === 'open').length,
    totalApplicants: applications.length,
    interviewsScheduled: applications.filter((a: any) => a.status === 'interview').length,
    offersExtended: applications.filter((a: any) => a.status === 'offer').length
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteJobMutation.mutate(itemToDelete, {
        onSuccess: () => {
          toast.success('تم حذف الوظيفة بنجاح');
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }
      });
    }
  };

  const handleCreateJob = () => {
    if (!newJob.title) {
      toast.error('يرجى إدخال عنوان الوظيفة');
      return;
    }
    createJobMutation.mutate({
      ...newJob,
      applicationDeadline: newJob.applicationDeadline ? new Date(newJob.applicationDeadline).toISOString() : undefined
    });
  };

  const handleEditJob = (job: any) => {
    setSelectedJob(job);
    setShowEditJob(true);
  };

  const handleUpdateJob = () => {
    if (!selectedJob) return;
    updateJobMutation.mutate({
      id: selectedJob.id,
      title: selectedJob.title,
      titleAr: selectedJob.titleAr,
      location: selectedJob.location,
      description: selectedJob.description,
      requirements: selectedJob.requirements,
      status: selectedJob.status
    });
  };

  const handleScheduleInterview = () => {
    if (!selectedApplicant || !interviewData.scheduledAt) {
      toast.error('يرجى تحديد موعد المقابلة');
      return;
    }
    createInterviewMutation.mutate({
      applicationId: selectedApplicant.id,
      interviewType: interviewData.interviewType,
      scheduledAt: new Date(interviewData.scheduledAt).toISOString(),
      duration: interviewData.duration,
      location: interviewData.location,
      meetingLink: interviewData.meetingLink
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-700">مفتوح</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700">مغلق</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700">مسودة</Badge>;
      case 'filled':
        return <Badge className="bg-blue-100 text-blue-700">مكتمل</Badge>;
      case 'new':
        return <Badge className="bg-blue-100 text-blue-700">جديد</Badge>;
      case 'screening':
        return <Badge className="bg-amber-100 text-amber-700">فرز</Badge>;
      case 'interview':
        return <Badge className="bg-purple-100 text-purple-700">مقابلة</Badge>;
      case 'assessment':
        return <Badge className="bg-indigo-100 text-indigo-700">تقييم</Badge>;
      case 'offer':
        return <Badge className="bg-green-100 text-green-700">عرض</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">مرفوض</Badge>;
      case 'hired':
        return <Badge className="bg-emerald-100 text-emerald-700">تم التوظيف</Badge>;
      case 'withdrawn':
        return <Badge className="bg-gray-100 text-gray-700">منسحب</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'دوام كامل';
      case 'part_time': return 'دوام جزئي';
      case 'contract': return 'عقد';
      case 'internship': return 'تدريب';
      default: return type;
    }
  };

  // Remove early return


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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">الاستقطاب والتوظيف</h2>
          <p className="text-gray-500">إدارة الوظائف الشاغرة والمتقدمين</p>
        </div>
        <Button onClick={() => setShowNewJob(true)}>
          <Plus className="h-4 w-4 ms-2" />
          وظيفة جديدة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الوظائف المفتوحة</p>
                <h3 className="text-2xl font-bold">{recruitmentStats.openPositions}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المتقدمين</p>
                <h3 className="text-2xl font-bold">{recruitmentStats.totalApplicants}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مقابلات مجدولة</p>
                <h3 className="text-2xl font-bold">{recruitmentStats.interviewsScheduled}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">عروض مقدمة</p>
                <h3 className="text-2xl font-bold">{recruitmentStats.offersExtended}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">الوظائف الشاغرة</TabsTrigger>
          <TabsTrigger value="applicants">المتقدمين</TabsTrigger>
          <TabsTrigger value="interviews">المقابلات</TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>الوظائف الشاغرة</CardTitle>
              <PrintButton title="الوظائف الشاغرة" />
              <CardDescription>قائمة جميع الوظائف المتاحة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">لا توجد وظائف</p>
                  <p className="text-sm">انقر على "وظيفة جديدة" لإضافة وظيفة شاغرة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>نوع الدوام</TableHead>
                      <TableHead>عدد الشواغر</TableHead>
                      <TableHead>تاريخ الإغلاق</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.titleAr || job.title}</TableCell>
                        <TableCell>{job.location || '-'}</TableCell>
                        <TableCell>{getEmploymentTypeLabel(job.employmentType)}</TableCell>
                        <TableCell>{job.openings}</TableCell>
                        <TableCell>
                          {job.applicationDeadline
                            ? formatDate(job.applicationDeadline)
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditJob(job)}
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {job.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePublishJob(job.id)}
                                title="نشر"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {job.status === 'open' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCloseJob(job.id)}
                                title="إغلاق"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemToDelete(job.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applicants Tab */}
        <TabsContent value="applicants" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>المتقدمين</CardTitle>
              <CardDescription>قائمة جميع المتقدمين للوظائف</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {applicationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">لا يوجد متقدمين</p>
                  <p className="text-sm">سيظهر المتقدمين هنا عند تقديمهم للوظائف</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>سنوات الخبرة</TableHead>
                      <TableHead>تاريخ التقديم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((applicant: any) => (
                      <TableRow key={applicant.id}>
                        <TableCell className="font-medium">{applicant.applicantName}</TableCell>
                        <TableCell>{applicant.email}</TableCell>
                        <TableCell>{applicant.phone || '-'}</TableCell>
                        <TableCell>{applicant.yearsOfExperience || '-'} سنوات</TableCell>
                        <TableCell>
                          {formatDate(applicant.appliedAt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedApplicant(applicant);
                                setShowApplicantDetails(true);
                              }}
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedApplicant(applicant);
                                setShowScheduleInterview(true);
                              }}
                              title="جدولة مقابلة"
                            >
                              <Calendar className="h-4 w-4 text-purple-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interviews Tab */}
        <TabsContent value="interviews" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>المقابلات</CardTitle>
              <CardDescription>جدول المقابلات المجدولة</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {interviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">لا توجد مقابلات</p>
                  <p className="text-sm">قم بجدولة مقابلات من صفحة المتقدمين</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نوع المقابلة</TableHead>
                      <TableHead>الموعد</TableHead>
                      <TableHead>المدة</TableHead>
                      <TableHead>المكان/الرابط</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview: any) => (
                      <TableRow key={interview.id}>
                        <TableCell>
                          {interview.interviewType === 'phone' && 'هاتفية'}
                          {interview.interviewType === 'video' && 'فيديو'}
                          {interview.interviewType === 'in_person' && 'حضورية'}
                          {interview.interviewType === 'technical' && 'تقنية'}
                          {interview.interviewType === 'hr' && 'موارد بشرية'}
                          {interview.interviewType === 'final' && 'نهائية'}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(interview.scheduledAt)}
                        </TableCell>
                        <TableCell>{interview.duration} دقيقة</TableCell>
                        <TableCell>{interview.location || interview.meetingLink || '-'}</TableCell>
                        <TableCell>{getStatusBadge(interview.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Job Dialog */}
      {showNewJob && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إضافة وظيفة جديدة</h3>
            <p className="text-sm text-gray-500">أدخل تفاصيل الوظيفة الشاغرة</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عنوان الوظيفة (إنجليزي) *</Label>
                <Input
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="مثال: Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>عنوان الوظيفة (عربي)</Label>
                <Input
                  value={newJob.titleAr}
                  onChange={(e) => setNewJob({ ...newJob, titleAr: e.target.value })}
                  placeholder="مثال: مهندس برمجيات"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الموقع</Label>
                <Input
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  placeholder="مثال: الرياض"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع الدوام</Label>
                <Select
                  value={newJob.employmentType}
                  onValueChange={(value: any) => setNewJob({ ...newJob, employmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">دوام كامل</SelectItem>
                    <SelectItem value="part_time">دوام جزئي</SelectItem>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="internship">تدريب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>مستوى الخبرة</Label>
                <Select
                  value={newJob.experienceLevel}
                  onValueChange={(value: any) => setNewJob({ ...newJob, experienceLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">مبتدئ</SelectItem>
                    <SelectItem value="mid">متوسط</SelectItem>
                    <SelectItem value="senior">خبير</SelectItem>
                    <SelectItem value="executive">تنفيذي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>عدد الشواغر</Label>
                <Input
                  type="number"
                  min="1"
                  value={newJob.openings}
                  onChange={(e) => setNewJob({ ...newJob, openings: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>تاريخ إغلاق التقديم</Label>
              <Input
                type="date"
                value={newJob.applicationDeadline}
                onChange={(e) => setNewJob({ ...newJob, applicationDeadline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>وصف الوظيفة</Label>
              <Textarea
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="وصف تفصيلي للوظيفة..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>المتطلبات</Label>
              <Textarea
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                placeholder="المتطلبات والمؤهلات المطلوبة..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>المزايا</Label>
              <Textarea
                value={newJob.benefits}
                onChange={(e) => setNewJob({ ...newJob, benefits: e.target.value })}
                placeholder="المزايا والحوافز..."
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewJob(false)}>إلغاء</Button>
            <Button onClick={handleCreateJob} disabled={createJobMutation.isPending}>
              {createJobMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إنشاء الوظيفة
            </Button>
          </div>
        </div>
      </div>)}

      {/* Edit Job Dialog */}
      {showEditJob && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تعديل الوظيفة</h3>
            <p className="text-sm text-gray-500">تعديل تفاصيل الوظيفة</p>
          </div>
          {selectedJob && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان الوظيفة (إنجليزي)</Label>
                  <Input
                    value={selectedJob.title}
                    onChange={(e) => setSelectedJob({ ...selectedJob, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>عنوان الوظيفة (عربي)</Label>
                  <Input
                    value={selectedJob.titleAr || ''}
                    onChange={(e) => setSelectedJob({ ...selectedJob, titleAr: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الموقع</Label>
                  <Input
                    value={selectedJob.location || ''}
                    onChange={(e) => setSelectedJob({ ...selectedJob, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select
                    value={selectedJob.status}
                    onValueChange={(value) => setSelectedJob({ ...selectedJob, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="open">مفتوح</SelectItem>
                      <SelectItem value="closed">مغلق</SelectItem>
                      <SelectItem value="on_hold">معلق</SelectItem>
                      <SelectItem value="filled">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>وصف الوظيفة</Label>
                <Textarea
                  value={selectedJob.description || ''}
                  onChange={(e) => setSelectedJob({ ...selectedJob, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>المتطلبات</Label>
                <Textarea
                  value={selectedJob.requirements || ''}
                  onChange={(e) => setSelectedJob({ ...selectedJob, requirements: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowEditJob(false)}>إلغاء</Button>
            <Button onClick={handleUpdateJob} disabled={updateJobMutation.isPending}>
              {updateJobMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </div>)}

      {/* Applicant Details Dialog */}
      {showApplicantDetails && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">تفاصيل المتقدم</h3>
          </div>
          {selectedApplicant && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplicant.applicantName}</h3>
                  <p className="text-sm text-gray-500">{getStatusBadge(selectedApplicant.status)}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{selectedApplicant.email}</span>
                </div>
                {selectedApplicant.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedApplicant.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span>{selectedApplicant.yearsOfExperience || 0} سنوات خبرة</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>تقدم في: {formatDate(selectedApplicant.appliedAt)}</span>
                </div>
              </div>
              {selectedApplicant.coverLetter && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">خطاب التقديم</h4>
                  <p className="text-sm text-gray-600">{selectedApplicant.coverLetter}</p>
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
                        updateApplicationStatusMutation.mutate({
                          id: selectedApplicant.id,
                          status: status as any
                        });
                        setShowApplicantDetails(false);
                      }}
                      disabled={selectedApplicant.status === status}
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
            <Button variant="outline" onClick={() => setShowApplicantDetails(false)}>إغلاق</Button>
            <Button onClick={() => {
              setShowApplicantDetails(false);
              setShowScheduleInterview(true);
            }}>
              جدولة مقابلة
            </Button>
          </div>
        </div>
      </div>)}

      {/* Schedule Interview Dialog */}
      {showScheduleInterview && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
        <div>
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">جدولة مقابلة</h3>
            <p className="text-sm text-gray-500">
              {selectedApplicant && `جدولة مقابلة مع ${selectedApplicant.applicantName}`}
            </p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>نوع المقابلة</Label>
              <Select
                value={interviewData.interviewType}
                onValueChange={(value: any) => setInterviewData({ ...interviewData, interviewType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">هاتفية</SelectItem>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="in_person">حضورية</SelectItem>
                  <SelectItem value="technical">تقنية</SelectItem>
                  <SelectItem value="hr">موارد بشرية</SelectItem>
                  <SelectItem value="final">نهائية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الموعد *</Label>
              <Input
                type="datetime-local"
                value={interviewData.scheduledAt}
                onChange={(e) => setInterviewData({ ...interviewData, scheduledAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>المدة (بالدقائق)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={interviewData.duration}
                onChange={(e) => setInterviewData({ ...interviewData, duration: parseInt(e.target.value) || 60 })}
              />
            </div>
            <div className="space-y-2">
              <Label>المكان (للمقابلات الحضورية)</Label>
              <Input
                value={interviewData.location}
                onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                placeholder="مثال: غرفة الاجتماعات 1"
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الاجتماع (للمقابلات عن بعد)</Label>
              <Input
                value={interviewData.meetingLink}
                onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })}
                placeholder="مثال: https://meet.google.com/..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowScheduleInterview(false)}>إلغاء</Button>
            <Button onClick={handleScheduleInterview} disabled={createInterviewMutation.isPending}>
              {createInterviewMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              جدولة المقابلة
            </Button>
          </div>
        </div>
      </div>)}

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