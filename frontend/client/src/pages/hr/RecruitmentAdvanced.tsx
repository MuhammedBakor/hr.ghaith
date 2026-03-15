import React from 'react';
import { formatDate } from '@/lib/formatDate';
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
import { Briefcase, Users, Plus, Eye, Edit, UserPlus, FileText, Calendar, CheckCircle2, XCircle, Mail, Phone, Inbox, Trash2, Loader2, Link2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PrintButton } from "@/components/PrintButton";
import {
  useRecruitmentJobs,
  useCreateRecruitmentJob,
  useUpdateRecruitmentJob,
  useDeleteRecruitmentJob,
  useRecruitmentApplications,
  useUpdateApplicationStatus,
  useDeleteApplication,
  useRecruitmentInterviews,
  useCreateInterview,
  useUpdateInterview,
  useCancelInterview
} from "@/services/recruitmentService";

function ApplicantsTable({
  title, description, rows, loading, emptyText, getStatusBadge, onView, onInterview, onEditInterview, onDelete, interviews
}: {
  title: string;
  description: string;
  rows: any[];
  loading: boolean;
  emptyText: string;
  getStatusBadge: (s: string) => React.ReactNode;
  onView: (a: any) => void;
  onInterview: (a: any) => void;
  onEditInterview: (interview: any, applicant: any) => void;
  onDelete: (a: any) => void;
  interviews: any[];
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">{emptyText}</p>
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
              {rows.map((applicant: any) => {
                const existingInterview = interviews.find(
                  (i: any) => Number(i.application?.id) === Number(applicant.id)
                );
                return (
                <TableRow key={applicant.id}>
                  <TableCell className="font-medium">{applicant.applicantName}</TableCell>
                  <TableCell>{applicant.email}</TableCell>
                  <TableCell>{applicant.phone || '-'}</TableCell>
                  <TableCell>{applicant.yearsOfExperience != null ? `${applicant.yearsOfExperience} سنوات` : '-'}</TableCell>
                  <TableCell>{formatDate(applicant.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center">
                      <Button variant="ghost" size="icon" onClick={() => onView(applicant)} title="عرض التفاصيل">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => existingInterview ? onEditInterview(existingInterview, applicant) : onInterview(applicant)}
                          title={existingInterview ? 'عرض/تعديل المقابلة' : 'جدولة مقابلة'}
                        >
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </Button>
                        {existingInterview && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" title="تم جدولة مقابلة" />
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(applicant)} title="حذف المتقدم">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function RecruitmentAdvanced() {
  const [searchTerm, setSearchTerm] = useState('');
  const { selectedRole: userRole } = useAppContext();

  const [activeTab, setActiveTab] = useState('jobs');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteApplicantDialogOpen, setDeleteApplicantDialogOpen] = useState(false);
  const [applicantToDelete, setApplicantToDelete] = useState<any>(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [showApplicantDetails, setShowApplicantDetails] = useState(false);
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [showEditInterview, setShowEditInterview] = useState(false);
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [showCancelInterviewDialog, setShowCancelInterviewDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [shareJob, setShareJob] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const emptyJob = {
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
  };
  const [newJob, setNewJob] = useState(emptyJob);

  const [interviewData, setInterviewData] = useState({
    interviewType: 'phone' as const,
    scheduledAt: '',
    duration: 60,
    location: '',
    meetingLink: ''
  });

  // Data
  const { data: jobs = [], isLoading: jobsLoading, isError } = useRecruitmentJobs();
  const { data: applications = [], isLoading: applicationsLoading } = useRecruitmentApplications();
  const { data: interviews = [] } = useRecruitmentInterviews();

  // Mutations
  const createJobMutation = useCreateRecruitmentJob();
  const updateJobMutation = useUpdateRecruitmentJob();
  const deleteJobMutation = useDeleteRecruitmentJob();
  const updateApplicationStatusMutation = useUpdateApplicationStatus();
  const deleteApplicationMutation = useDeleteApplication();
  const createInterviewMutation = useCreateInterview();
  const updateInterviewMutation = useUpdateInterview();
  const cancelInterviewMutation = useCancelInterview();

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

  const recruitmentStats = {
    openPositions: (jobs as any[]).filter((j: any) => j.status === 'open').length,
    totalApplicants: (applications as any[]).length,
    interviewsScheduled: (applications as any[]).filter((a: any) => a.status === 'interview').length,
    offersExtended: (applications as any[]).filter((a: any) => a.status === 'offer').length
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

  const confirmDeleteApplicant = () => {
    if (applicantToDelete) {
      deleteApplicationMutation.mutate(applicantToDelete.id, {
        onSuccess: () => {
          toast.success('تم حذف المتقدم بنجاح');
          setDeleteApplicantDialogOpen(false);
          setApplicantToDelete(null);
        },
        onError: () => toast.error('فشل حذف المتقدم')
      });
    }
  };

  const handleDeleteApplicant = (applicant: any) => {
    setApplicantToDelete(applicant);
    setDeleteApplicantDialogOpen(true);
  };

  const handleCreateJob = () => {
    if (!newJob.title) {
      toast.error('يرجى إدخال عنوان الوظيفة');
      return;
    }
    createJobMutation.mutate({
      ...newJob,
      status: 'open',
      applicationDeadline: newJob.applicationDeadline ? new Date(newJob.applicationDeadline).toISOString() : undefined
    }, {
      onSuccess: () => {
        toast.success('تم إنشاء الوظيفة بنجاح');
        setShowNewJob(false);
        setNewJob(emptyJob);
      },
      onError: (err: any) => toast.error(`فشل الإنشاء: ${err.message}`)
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
      benefits: selectedJob.benefits,
      status: selectedJob.status,
      employmentType: selectedJob.employmentType,
      experienceLevel: selectedJob.experienceLevel,
      openings: selectedJob.openings,
      applicationDeadline: selectedJob.applicationDeadline,
    }, {
      onSuccess: () => {
        toast.success('تم تحديث الوظيفة بنجاح');
        setShowEditJob(false);
        setSelectedJob(null);
      },
      onError: (err: any) => toast.error(`فشل التحديث: ${err.message}`)
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
    }, {
      onSuccess: () => {
        toast.success('تم جدولة المقابلة وإرسال بريد إلكتروني للمتقدم');
        setShowScheduleInterview(false);
        setInterviewData({ interviewType: 'phone', scheduledAt: '', duration: 60, location: '', meetingLink: '' });
      },
      onError: (err: any) => toast.error(`فشل الجدولة: ${err.message}`)
    });
  };

  const handleEditInterview = (interview: any, applicant: any) => {
    setSelectedApplicant(applicant);
    setEditingInterview(interview);
    // Pre-fill interviewData from existing interview
    const scheduledStr = interview.scheduledAt
      ? new Date(interview.scheduledAt).toISOString().slice(0, 16)
      : interview.interviewDate
        ? new Date(interview.interviewDate).toISOString().slice(0, 16)
        : '';
    setInterviewData({
      interviewType: interview.interviewType || 'phone',
      scheduledAt: scheduledStr,
      duration: interview.duration || 60,
      location: interview.location || '',
      meetingLink: interview.meetingLink || ''
    });
    setShowEditInterview(true);
  };

  const handleUpdateInterview = () => {
    if (!editingInterview || !interviewData.scheduledAt) {
      toast.error('يرجى تحديد موعد المقابلة');
      return;
    }
    updateInterviewMutation.mutate({
      id: editingInterview.id,
      interviewType: interviewData.interviewType,
      scheduledAt: new Date(interviewData.scheduledAt).toISOString(),
      duration: interviewData.duration,
      location: interviewData.location,
      meetingLink: interviewData.meetingLink
    }, {
      onSuccess: () => {
        toast.success('تم تحديث المقابلة وإرسال بريد إلكتروني للمتقدم');
        setShowEditInterview(false);
        setEditingInterview(null);
        setInterviewData({ interviewType: 'phone', scheduledAt: '', duration: 60, location: '', meetingLink: '' });
      },
      onError: (err: any) => toast.error(`فشل التحديث: ${err.message}`)
    });
  };

  const handleConfirmCancelInterview = () => {
    if (!editingInterview) return;
    cancelInterviewMutation.mutate(editingInterview.id, {
      onSuccess: () => {
        toast.success('تم إلغاء المقابلة وإرسال بريد إلكتروني للمتقدم');
        setShowCancelInterviewDialog(false);
        setShowEditInterview(false);
        setEditingInterview(null);
        setInterviewData({ interviewType: 'phone', scheduledAt: '', duration: 60, location: '', meetingLink: '' });
      },
      onError: (err: any) => toast.error(`فشل الإلغاء: ${err.message}`)
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-green-100 text-green-700">مفتوح</Badge>;
      case 'closed': return <Badge className="bg-gray-100 text-gray-700">مغلق</Badge>;
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-700">مسودة</Badge>;
      case 'filled': return <Badge className="bg-blue-100 text-blue-700">مكتمل</Badge>;
      case 'new': return <Badge className="bg-blue-100 text-blue-700">جديد</Badge>;
      case 'screening': return <Badge className="bg-amber-100 text-amber-700">فرز</Badge>;
      case 'interview': return <Badge className="bg-purple-100 text-purple-700">مقابلة</Badge>;
      case 'assessment': return <Badge className="bg-indigo-100 text-indigo-700">تقييم</Badge>;
      case 'offer': return <Badge className="bg-green-100 text-green-700">عرض</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700">مرفوض</Badge>;
      case 'hired': return <Badge className="bg-emerald-100 text-emerald-700">تم التوظيف</Badge>;
      case 'withdrawn': return <Badge className="bg-gray-100 text-gray-700">منسحب</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
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

  const filteredJobs = (jobs as any[]).filter((j: any) =>
    !searchTerm || (j.titleAr || j.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredApps = (applications as any[]).filter((a: any) =>
    !searchTerm || (a.applicantName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const appsByStatus = (status: string) =>
    filteredApps.filter((a: any) => a.status === status);

  const pendingApps = filteredApps.filter((a: any) =>
    !['interview', 'assessment', 'hired', 'rejected'].includes(a.status)
  );

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
        <TabsList className="flex-wrap">
          <TabsTrigger value="jobs">الوظائف الشاغرة</TabsTrigger>
          <TabsTrigger value="applicants">
            المتقدمين
            {pendingApps.length > 0 && (
              <span className="ms-1.5 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingApps.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="interview">
            المقابلات
            {appsByStatus('interview').length > 0 && (
              <span className="ms-1.5 bg-purple-500 text-white text-xs rounded-full px-1.5 py-0.5">{appsByStatus('interview').length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="assessment">
            التقييم
            {appsByStatus('assessment').length > 0 && (
              <span className="ms-1.5 bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5">{appsByStatus('assessment').length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="hired">
            التوظيف
            {appsByStatus('hired').length > 0 && (
              <span className="ms-1.5 bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5">{appsByStatus('hired').length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            المرفوضون
            {appsByStatus('rejected').length > 0 && (
              <span className="ms-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{appsByStatus('rejected').length}</span>
            )}
          </TabsTrigger>
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
              ) : filteredJobs.length === 0 ? (
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
                    {filteredJobs.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.titleAr || job.title}</TableCell>
                        <TableCell>{job.location || '-'}</TableCell>
                        <TableCell>{getEmploymentTypeLabel(job.employmentType)}</TableCell>
                        <TableCell>{job.openings}</TableCell>
                        <TableCell>{job.applicationDeadline ? formatDate(job.applicationDeadline) : '-'}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)} title="تعديل">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {job.status === 'draft' && (
                              <Button variant="ghost" size="icon" onClick={() => handlePublishJob(job.id)} title="نشر الوظيفة">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {job.status === 'open' && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => { setShareJob(job); setCopied(false); }} title="مشاركة رابط التقديم">
                                  <Link2 className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleCloseJob(job.id)} title="إغلاق الوظيفة">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => { setItemToDelete(job.id); setDeleteDialogOpen(true); }}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
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

        {/* Applicants Tab — pending/new */}
        <TabsContent value="applicants" className="space-y-4">
          <ApplicantsTable
            title="المتقدمين الجدد"
            description="المتقدمون في انتظار المراجعة"
            rows={pendingApps}
            loading={applicationsLoading}
            emptyText="لا يوجد متقدمون جدد"
            getStatusBadge={getStatusBadge}
            interviews={interviews as any[]}
            onView={(a) => { setSelectedApplicant(a); setShowApplicantDetails(true); }}
            onInterview={(a) => { setSelectedApplicant(a); setShowScheduleInterview(true); }}
            onEditInterview={handleEditInterview}
            onDelete={handleDeleteApplicant}
          />
        </TabsContent>

        {/* Interview Tab */}
        <TabsContent value="interview" className="space-y-4">
          <ApplicantsTable
            title="المقابلات"
            description="المتقدمون في مرحلة المقابلة"
            rows={appsByStatus('interview')}
            loading={applicationsLoading}
            emptyText="لا يوجد متقدمون في مرحلة المقابلة"
            getStatusBadge={getStatusBadge}
            interviews={interviews as any[]}
            onView={(a) => { setSelectedApplicant(a); setShowApplicantDetails(true); }}
            onInterview={(a) => { setSelectedApplicant(a); setShowScheduleInterview(true); }}
            onEditInterview={handleEditInterview}
            onDelete={handleDeleteApplicant}
          />
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-4">
          <ApplicantsTable
            title="التقييم"
            description="المتقدمون في مرحلة التقييم"
            rows={appsByStatus('assessment')}
            loading={applicationsLoading}
            emptyText="لا يوجد متقدمون في مرحلة التقييم"
            getStatusBadge={getStatusBadge}
            interviews={interviews as any[]}
            onView={(a) => { setSelectedApplicant(a); setShowApplicantDetails(true); }}
            onInterview={(a) => { setSelectedApplicant(a); setShowScheduleInterview(true); }}
            onEditInterview={handleEditInterview}
            onDelete={handleDeleteApplicant}
          />
        </TabsContent>

        {/* Hired Tab */}
        <TabsContent value="hired" className="space-y-4">
          <ApplicantsTable
            title="التوظيف"
            description="المتقدمون الذين تم توظيفهم"
            rows={appsByStatus('hired')}
            loading={applicationsLoading}
            emptyText="لا يوجد موظفون جدد بعد"
            getStatusBadge={getStatusBadge}
            interviews={interviews as any[]}
            onView={(a) => { setSelectedApplicant(a); setShowApplicantDetails(true); }}
            onInterview={(a) => { setSelectedApplicant(a); setShowScheduleInterview(true); }}
            onEditInterview={handleEditInterview}
            onDelete={handleDeleteApplicant}
          />
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-4">
          <ApplicantsTable
            title="المرفوضون"
            description="المتقدمون الذين تم رفضهم"
            rows={appsByStatus('rejected')}
            loading={applicationsLoading}
            emptyText="لا يوجد متقدمون مرفوضون"
            getStatusBadge={getStatusBadge}
            interviews={interviews as any[]}
            onView={(a) => { setSelectedApplicant(a); setShowApplicantDetails(true); }}
            onInterview={(a) => { setSelectedApplicant(a); setShowScheduleInterview(true); }}
            onEditInterview={handleEditInterview}
            onDelete={handleDeleteApplicant}
          />
        </TabsContent>
      </Tabs>

      {/* New Job Dialog */}
      <Dialog open={showNewJob} onOpenChange={(open) => { if (!open) { setShowNewJob(false); setNewJob(emptyJob); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              إضافة وظيفة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عنوان الوظيفة (إنجليزي) <span className="text-red-500">*</span></Label>
                <Input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="مثال: Software Engineer" />
              </div>
              <div className="space-y-2">
                <Label>عنوان الوظيفة (عربي)</Label>
                <Input value={newJob.titleAr} onChange={(e) => setNewJob({ ...newJob, titleAr: e.target.value })} placeholder="مثال: مهندس برمجيات" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الموقع</Label>
                <Input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="مثال: الرياض" />
              </div>
              <div className="space-y-2">
                <Label>نوع الدوام</Label>
                <Select value={newJob.employmentType} onValueChange={(v: any) => setNewJob({ ...newJob, employmentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={newJob.experienceLevel} onValueChange={(v: any) => setNewJob({ ...newJob, experienceLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="number" min="1" value={newJob.openings} onChange={(e) => setNewJob({ ...newJob, openings: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>تاريخ إغلاق التقديم</Label>
              <Input type="date" value={newJob.applicationDeadline} onChange={(e) => setNewJob({ ...newJob, applicationDeadline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>وصف الوظيفة</Label>
              <Textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} placeholder="وصف تفصيلي للوظيفة..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>المتطلبات</Label>
              <Textarea value={newJob.requirements} onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })} placeholder="المتطلبات والمؤهلات المطلوبة..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>المزايا</Label>
              <Textarea value={newJob.benefits} onChange={(e) => setNewJob({ ...newJob, benefits: e.target.value })} placeholder="المزايا والحوافز..." rows={2} />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setShowNewJob(false); setNewJob(emptyJob); }}>إلغاء</Button>
            <Button onClick={handleCreateJob} disabled={createJobMutation.isPending}>
              {createJobMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إنشاء الوظيفة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={showEditJob} onOpenChange={(open) => { if (!open) { setShowEditJob(false); setSelectedJob(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              تعديل الوظيفة
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان الوظيفة (إنجليزي)</Label>
                  <Input value={selectedJob.title} onChange={(e) => setSelectedJob({ ...selectedJob, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>عنوان الوظيفة (عربي)</Label>
                  <Input value={selectedJob.titleAr || ''} onChange={(e) => setSelectedJob({ ...selectedJob, titleAr: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الموقع</Label>
                  <Input value={selectedJob.location || ''} onChange={(e) => setSelectedJob({ ...selectedJob, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={selectedJob.status} onValueChange={(v) => setSelectedJob({ ...selectedJob, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الدوام</Label>
                  <Select value={selectedJob.employmentType || 'full_time'} onValueChange={(v) => setSelectedJob({ ...selectedJob, employmentType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">دوام كامل</SelectItem>
                      <SelectItem value="part_time">دوام جزئي</SelectItem>
                      <SelectItem value="contract">عقد</SelectItem>
                      <SelectItem value="remote">عن بُعد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>مستوى الخبرة</Label>
                  <Select value={selectedJob.experienceLevel || 'mid'} onValueChange={(v) => setSelectedJob({ ...selectedJob, experienceLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">مبتدئ</SelectItem>
                      <SelectItem value="mid">متوسط</SelectItem>
                      <SelectItem value="senior">متقدم</SelectItem>
                      <SelectItem value="lead">قيادي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عدد الشواغر</Label>
                  <Input type="number" min={1} value={selectedJob.openings || 1} onChange={(e) => setSelectedJob({ ...selectedJob, openings: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="space-y-2">
                  <Label>آخر موعد للتقديم</Label>
                  <Input type="date" value={selectedJob.applicationDeadline ? selectedJob.applicationDeadline.split('T')[0] : ''} onChange={(e) => setSelectedJob({ ...selectedJob, applicationDeadline: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>وصف الوظيفة</Label>
                <Textarea value={selectedJob.description || ''} onChange={(e) => setSelectedJob({ ...selectedJob, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>المتطلبات</Label>
                <Textarea value={selectedJob.requirements || ''} onChange={(e) => setSelectedJob({ ...selectedJob, requirements: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>المزايا</Label>
                <Textarea value={selectedJob.benefits || ''} onChange={(e) => setSelectedJob({ ...selectedJob, benefits: e.target.value })} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setShowEditJob(false); setSelectedJob(null); }}>إلغاء</Button>
            <Button onClick={handleUpdateJob} disabled={updateJobMutation.isPending}>
              {updateJobMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Applicant Details Dialog */}
      <Dialog open={showApplicantDetails} onOpenChange={(open) => { if (!open) setShowApplicantDetails(false); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              تفاصيل المتقدم
            </DialogTitle>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplicant.applicantName}</h3>
                  <div className="mt-1">{getStatusBadge(selectedApplicant.status)}</div>
                </div>
              </div>
              <div className="space-y-2">
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
                  <span>{selectedApplicant.yearsOfExperience != null ? `${selectedApplicant.yearsOfExperience} سنوات خبرة` : 'لم تُحدد سنوات الخبرة'}</span>
                </div>
                {selectedApplicant.position && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>الوظيفة المتقدم لها: {selectedApplicant.position}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>تقدم في: {formatDate(selectedApplicant.createdAt)}</span>
                </div>
                {selectedApplicant.resumeUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <a
                      href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || (import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin)}${selectedApplicant.resumeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      تحميل السيرة الذاتية (CV)
                    </a>
                  </div>
                )}
              </div>
              {selectedApplicant.coverLetter && (
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2 text-sm">خطاب التقديم</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedApplicant.coverLetter}</p>
                </div>
              )}
              <div className="border-t pt-3">
                <h4 className="font-medium mb-2 text-sm">تحديث الحالة</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'interview', label: 'مقابلة', className: 'border-purple-300 text-purple-700 hover:bg-purple-50' },
                    { value: 'assessment', label: 'تقييم', className: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50' },
                    { value: 'hired', label: 'توظيف', className: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
                    { value: 'rejected', label: 'رفض', className: 'border-red-300 text-red-700 hover:bg-red-50' },
                  ].map(({ value, label, className }) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      className={selectedApplicant.status !== value ? className : ''}
                      onClick={() => {
                        updateApplicationStatusMutation.mutate({ id: selectedApplicant.id, status: value as any }, {
                          onSuccess: () => {
                            toast.success(`تم تحديث الحالة إلى: ${label}`);
                            setShowApplicantDetails(false);
                            setActiveTab(value);
                          }
                        });
                      }}
                      disabled={selectedApplicant.status === value || updateApplicationStatusMutation.isPending}
                    >
                      {updateApplicationStatusMutation.isPending && selectedApplicant.status !== value
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setShowApplicantDetails(false)}>إغلاق</Button>
            <Button onClick={() => { setShowApplicantDetails(false); setShowScheduleInterview(true); }}>
              جدولة مقابلة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleInterview} onOpenChange={(open) => { if (!open) setShowScheduleInterview(false); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              جدولة مقابلة
              {selectedApplicant && <span className="text-sm font-normal text-gray-500">— {selectedApplicant.applicantName}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نوع المقابلة</Label>
              <Select value={interviewData.interviewType} onValueChange={(v: any) => setInterviewData({ ...interviewData, interviewType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label>الموعد <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" value={interviewData.scheduledAt} onChange={(e) => setInterviewData({ ...interviewData, scheduledAt: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المدة (بالدقائق)</Label>
              <Input type="number" min="15" step="15" value={interviewData.duration} onChange={(e) => setInterviewData({ ...interviewData, duration: parseInt(e.target.value) || 60 })} />
            </div>
            <div className="space-y-2">
              <Label>المكان (للمقابلات الحضورية)</Label>
              <Input value={interviewData.location} onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })} placeholder="مثال: غرفة الاجتماعات 1" />
            </div>
            <div className="space-y-2">
              <Label>رابط الاجتماع (للمقابلات عن بعد)</Label>
              <Input value={interviewData.meetingLink} onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })} placeholder="مثال: https://meet.google.com/..." />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setShowScheduleInterview(false)}>إلغاء</Button>
            <Button onClick={handleScheduleInterview} disabled={createInterviewMutation.isPending}>
              {createInterviewMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              جدولة المقابلة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Interview Dialog */}
      <Dialog open={showEditInterview} onOpenChange={(open) => { if (!open) { setShowEditInterview(false); setEditingInterview(null); } }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-purple-500" />
              تعديل المقابلة
              {selectedApplicant && <span className="text-sm font-normal text-gray-500">— {selectedApplicant.applicantName}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>نوع المقابلة</Label>
              <Select value={interviewData.interviewType} onValueChange={(v: any) => setInterviewData({ ...interviewData, interviewType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label>الموعد <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" value={interviewData.scheduledAt} onChange={(e) => setInterviewData({ ...interviewData, scheduledAt: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المدة (بالدقائق)</Label>
              <Input type="number" min="15" step="15" value={interviewData.duration} onChange={(e) => setInterviewData({ ...interviewData, duration: parseInt(e.target.value) || 60 })} />
            </div>
            <div className="space-y-2">
              <Label>المكان (للمقابلات الحضورية)</Label>
              <Input value={interviewData.location} onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })} placeholder="مثال: غرفة الاجتماعات 1" />
            </div>
            <div className="space-y-2">
              <Label>رابط الاجتماع (للمقابلات عن بعد)</Label>
              <Input value={interviewData.meetingLink} onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })} placeholder="مثال: https://meet.google.com/..." />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => { setShowEditInterview(false); setEditingInterview(null); }}>إغلاق</Button>
            <Button
              variant="destructive"
              onClick={() => setShowCancelInterviewDialog(true)}
              disabled={cancelInterviewMutation.isPending}
            >
              {cancelInterviewMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              إلغاء الاجتماع وإشعار المتقدم
            </Button>
            <Button onClick={handleUpdateInterview} disabled={updateInterviewMutation.isPending}>
              {updateInterviewMutation.isPending && <Loader2 className="h-4 w-4 ms-2 animate-spin" />}
              حفظ وإرسال بريد تحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Job Link Dialog */}
      <Dialog open={!!shareJob} onOpenChange={(open) => { if (!open) setShareJob(null); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600" />
              مشاركة رابط التقديم
            </DialogTitle>
          </DialogHeader>
          {shareJob && (() => {
            const link = `${window.location.origin}/jobs/${shareJob.id}`;
            return (
              <div className="space-y-4 py-2">
                <p className="text-sm text-gray-500">
                  أرسل هذا الرابط للمتقدمين ليتمكنوا من الاطلاع على تفاصيل الوظيفة وتقديم طلباتهم:
                </p>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">{shareJob.titleAr || shareJob.title}</p>
                  <p className="text-xs text-gray-400 break-all" dir="ltr">{link}</p>
                </div>
                <Button
                  className="w-full"
                  variant={copied ? 'outline' : 'default'}
                  onClick={() => {
                    navigator.clipboard.writeText(link).then(() => {
                      setCopied(true);
                      toast.success('تم نسخ الرابط');
                      setTimeout(() => setCopied(false), 3000);
                    });
                  }}
                >
                  {copied
                    ? <><Check className="h-4 w-4 ms-2 text-green-600" /> تم النسخ</>
                    : <><Copy className="h-4 w-4 ms-2" /> نسخ الرابط</>
                  }
                </Button>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareJob(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Interview Confirmation */}
      <AlertDialog open={showCancelInterviewDialog} onOpenChange={setShowCancelInterviewDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد إلغاء المقابلة</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من إلغاء هذه المقابلة؟ سيتم إرسال بريد إلكتروني تلقائي للمتقدم يُعلمه بالإلغاء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelInterview}
              className="bg-red-600 hover:bg-red-700"
            >
              تأكيد الإلغاء وإرسال الإشعار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Applicant Confirmation */}
      <AlertDialog open={deleteApplicantDialogOpen} onOpenChange={setDeleteApplicantDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المتقدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المتقدم "{applicantToDelete?.applicantName}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteApplicant} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Job Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه الوظيفة؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
