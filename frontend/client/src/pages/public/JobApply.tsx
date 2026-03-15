import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import publicApi from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, MapPin, Clock, Users, Calendar, CheckCircle2, Loader2, AlertCircle, Upload, FileText, X } from 'lucide-react';

const employmentTypeLabel: Record<string, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد',
  internship: 'تدريب',
};

const experienceLevelLabel: Record<string, string> = {
  entry: 'مبتدئ',
  mid: 'متوسط',
  senior: 'خبير',
  executive: 'تنفيذي',
};

export default function JobApply() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState('');
  const [cvOriginalName, setCvOriginalName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    applicantName: '',
    email: '',
    phone: '',
    yearsOfExperience: '',
    coverLetter: '',
  });

  useEffect(() => {
    if (!jobId) return;
    publicApi.get(`/public/recruitment/jobs/${jobId}`)
      .then(res => setJob(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setError('يرجى رفع ملف PDF أو Word فقط');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الملف يجب أن يكون أقل من 10 ميغابايت');
      return;
    }

    setCvFile(file);
    setError('');
    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await publicApi.post('/public/recruitment/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCvUrl(res.data.url);
      setCvOriginalName(res.data.filename || file.name);
    } catch {
      setError('فشل رفع الملف، يرجى المحاولة مرة أخرى');
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicantName || !form.email) {
      setError('يرجى ملء الحقول المطلوبة (الاسم والبريد الإلكتروني)');
      return;
    }
    if (cvFile && !cvUrl) {
      setError('الملف لا يزال يُرفع، يرجى الانتظار');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await publicApi.post(`/public/recruitment/jobs/${jobId}/apply`, {
        applicantName: form.applicantName,
        email: form.email,
        phone: form.phone || null,
        yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : null,
        coverLetter: form.coverLetter || null,
        position: job.titleAr || job.title,
        resumeUrl: cvUrl || null,
        status: 'pending',
      });
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('لقد تقدمت لهذه الوظيفة من قبل');
      } else {
        setError(err.response?.data?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">الوظيفة غير متاحة</h2>
          <p className="text-gray-500">هذه الوظيفة غير موجودة أو أُغلق باب التقديم عليها.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">تم إرسال طلبك بنجاح!</h2>
          <p className="text-gray-500 mb-2">شكراً لتقديمك على وظيفة</p>
          <p className="text-lg font-semibold text-primary mb-6">{job.titleAr || job.title}</p>
          <p className="text-gray-400 text-sm">سيتواصل معك فريق الموارد البشرية قريباً على بريدك الإلكتروني.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Job Info Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">{job.titleAr || job.title}</CardTitle>
                {job.titleAr && job.title && (
                  <p className="text-sm text-gray-500 mb-2">{job.title}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {job.location}
                    </span>
                  )}
                  {job.employmentType && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {employmentTypeLabel[job.employmentType] || job.employmentType}
                    </span>
                  )}
                  {job.openings && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {job.openings} شاغر
                    </span>
                  )}
                  {job.applicationDeadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      آخر موعد: {new Date(job.applicationDeadline).toLocaleDateString('ar-SA')}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  {job.experienceLevel && (
                    <Badge variant="outline">{experienceLevelLabel[job.experienceLevel] || job.experienceLevel}</Badge>
                  )}
                  <Badge className="bg-green-100 text-green-700">مفتوح للتقديم</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Job Details */}
        {(job.description || job.requirements || job.benefits) && (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6 space-y-5">
              {job.description && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">وصف الوظيفة</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
                </div>
              )}
              {job.requirements && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">المتطلبات والمؤهلات</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.requirements}</p>
                </div>
              )}
              {job.benefits && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">المزايا والحوافز</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{job.benefits}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Form */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">تقديم الطلب</CardTitle>
            <p className="text-sm text-gray-500">أدخل بياناتك للتقديم على هذه الوظيفة</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.applicantName}
                    onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
                    placeholder="مثال: أحمد محمد العمري"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>سنوات الخبرة</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={form.yearsOfExperience}
                    onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                    placeholder="مثال: 3"
                  />
                </div>
              </div>

              {/* CV Upload */}
              <div className="space-y-2">
                <Label>السيرة الذاتية (CV) <span className="text-red-500">*</span></Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                {!cvFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">انقر لرفع ملف CV</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — حتى 10 ميغابايت</p>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                    <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cvFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {cvUploading
                          ? 'جاري الرفع...'
                          : cvUrl
                            ? 'تم الرفع بنجاح'
                            : 'جاهز'}
                      </p>
                    </div>
                    {cvUploading
                      ? <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                      : cvUrl
                        ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        : null
                    }
                    <button
                      type="button"
                      onClick={() => { setCvFile(null); setCvUrl(''); setCvOriginalName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>خطاب التقديم</Label>
                <Textarea
                  value={form.coverLetter}
                  onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                  placeholder="اكتب رسالة تعريفية تشرح سبب تقديمك لهذه الوظيفة وما يميزك عن غيرك..."
                  rows={4}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting || cvUploading}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 ms-2 animate-spin" /> جاري الإرسال...</>
                  : 'إرسال الطلب'
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
