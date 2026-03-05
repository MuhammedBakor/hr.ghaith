import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, CheckCircle2, XCircle, Clock, User, FileText, Eye, Edit, Printer, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';

interface OnboardingRequest {
  id: number;
  requestNumber: string;
  employeeId: number;
  employeeName: string;
  email: string;
  phone: string;
  status: 'pending_activation' | 'pending_profile' | 'pending_review' | 'needs_update' | 'approved' | 'rejected';
  submittedAt: string;
  branchId?: number;
  branchName?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending_activation':
      return <Badge className="bg-gray-100 text-gray-800">في انتظار التفعيل</Badge>;
    case 'pending_profile':
      return <Badge className="bg-blue-100 text-blue-800">في انتظار البيانات</Badge>;
    case 'pending_review':
      return <Badge className="bg-amber-100 text-amber-800">في انتظار المراجعة</Badge>;
    case 'needs_update':
      return <Badge className="bg-orange-100 text-orange-800">يحتاج تعديل</Badge>;
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">معتمد</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function OnboardingReview() {
  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'needs_update'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selectedBranchId } = useAppContext();

  // جلب طلبات التسجيل
  const { data: requestsData, isLoading, refetch } = useQuery({
    queryKey: ['onboardingRequests', selectedBranchId, activeTab],
    queryFn: () => api.get('/hr/employee-onboarding/pending-requests', {
      params: {
        branchId: selectedBranchId || undefined,
        status: activeTab === 'all' ? undefined : activeTab,
      }
    }).then(res => res.data),
  });

  // Mutation للمراجعة
  const reviewMutation = useMutation({
    mutationFn: (data: any) => api.post('/hr/employee-onboarding/review', data).then(res => res.data),
    onSuccess: () => {
      toast.success(
        reviewAction === 'approve' ? 'تم اعتماد الطلب بنجاح' :
        reviewAction === 'reject' ? 'تم رفض الطلب' :
        'تم إرسال الطلب للتعديل'
      );
      setReviewOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      setRejectionReason('');
      refetch();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const handleReview = async () => {
    if (!selectedRequest) return;
    
    if (reviewAction === 'reject' && !rejectionReason) {
      toast.error('يرجى إدخال سبب الرفض');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewMutation.mutateAsync({
        requestId: selectedRequest.id,
        action: reviewAction,
        reviewNotes,
        rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReview= (request: OnboardingRequest, action: 'approve' | 'reject' | 'needs_update') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewOpen(true);
  };

  // بيانات تجريبية
  const requests: OnboardingRequest[] = (requestsData || []).map((req: any) => ({
    id: req.id,
    requestNumber: req.requestNumber,
    employeeId: req.employeeId,
    employeeName: `${req.firstName} ${req.lastName}`,
    email: req.email,
    phone: req.phone,
    status: req.status,
    submittedAt: req.submittedAt,
    branchId: req.branchId,
    branchName: req.branchName,
  }));

  const filteredRequests = activeTab === 'all' 
    ? requests 
    : requests.filter(r => r.status === activeTab);

  const pendingCount = requests.filter(r => r.status === 'pending_review').length;
  const needsUpdateCount = requests.filter(r => r.status === 'needs_update').length;

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr">
            <Button variant="ghost" size="icon" aria-label="تعديل">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">مراجعة طلبات التسجيل</h2>
            <p className="text-gray-500">مراجعة واعتماد طلبات تسجيل الموظفين الجدد</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ms-2" />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">في انتظار المراجعة</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">يحتاج تعديل</p>
              <p className="text-2xl font-bold text-orange-600">{needsUpdateCount}</p>
            </div>
            <Edit className="h-8 w-8 text-orange-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">معتمد</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">مرفوض</p>
              <p className="text-2xl font-bold text-red-600">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-200" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending_review" className="gap-2">
            <Clock className="h-4 w-4" />
            في انتظار المراجعة
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white me-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="needs_update" className="gap-2">
            <Edit className="h-4 w-4" />
            يحتاج تعديل
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            معتمد
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            مرفوض
          </TabsTrigger>
          <TabsTrigger value="all">الكل</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>طلبات التسجيل</CardTitle>
              <CardDescription>
                {isLoading ? 'جاري التحميل...' : `${filteredRequests.length} طلب`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>لا توجد طلبات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{request.employeeName}</h4>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-gray-500">{request.email}</p>
                            <p className="text-sm text-gray-500">{request.phone}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span>رقم الطلب: {request.requestNumber}</span>
                              <span>تاريخ التقديم: {formatDate(request.submittedAt)}</span>
                              {request.branchName && <span>الفرع: {request.branchName}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toast.info(`عرض طلب ${request.employeeName}`)}>
                            <Eye className="h-4 w-4 ms-1" />
                            عرض
                          </Button>
                          {request.status === 'pending_review' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openReview(request, 'approve')}
                              >
                                <CheckCircle2 className="h-4 w-4 ms-1" />
                                اعتماد
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                onClick={() => openReview(request, 'needs_update')}
                              >
                                <Edit className="h-4 w-4 ms-1" />
                                تعديل
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => openReview(request, 'reject')}
                              >
                                <XCircle className="h-4 w-4 ms-1" />
                                رفض
                              </Button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <Button variant="outline" size="sm">
                              <Printer className="h-4 w-4 ms-1" />
                              طباعة
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة المراجعة */}
      {reviewOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">
              {reviewAction === 'approve' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {reviewAction === 'reject' && <XCircle className="h-5 w-5 text-red-600" />}
              {reviewAction === 'needs_update' && <Edit className="h-5 w-5 text-orange-600" />}
              {reviewAction === 'approve' ? 'اعتماد الطلب' : 
               reviewAction === 'reject' ? 'رفض الطلب' : 'طلب تعديل'}
            </h3>
            <p className="text-sm text-gray-500">
              {reviewAction === 'approve' && 'سيتم اعتماد طلب التسجيل وتفعيل حساب الموظف.'}
              {reviewAction === 'reject' && 'سيتم رفض طلب التسجيل وإشعار الموظف.'}
              {reviewAction === 'needs_update' && 'سيتم إرجاع الطلب للموظف لإجراء التعديلات المطلوبة.'}
            </p>
          </div>

          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium">{selectedRequest.employeeName}</p>
                <p className="text-sm text-gray-500">رقم الطلب: {selectedRequest.requestNumber}</p>
              </div>
            )}

            {reviewAction === 'reject' && (
              <div className="space-y-2">
                <Label>سبب الرفض <span className="text-red-500">*</span></Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="أدخل سبب رفض الطلب..."
                  rows={3}
                />
              </div>
            )}

            {reviewAction === 'needs_update' && (
              <div className="space-y-2">
                <Label>التعديلات المطلوبة</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="أدخل التعديلات المطلوبة من الموظف..."
                  rows={3}
                />
              </div>
            )}

            {reviewAction === 'approve' && (
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية..."
                  rows={2}
                />
              </div>
            )}

            {reviewAction === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>ملاحظة:</strong> سيتم إصدار خطاب تعيين رسمي وإشعار الموظف.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleReview}
              disabled={isSubmitting}
              className={
                reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-orange-600 hover:bg-orange-700'
              }
            >
              {isSubmitting ? 'جاري الإرسال...' : 
               reviewAction === 'approve' ? 'اعتماد' :
               reviewAction === 'reject' ? 'رفض' : 'إرسال للتعديل'}
            </Button>
          </div>
        
      </div>)}

    </div>
  );
}
