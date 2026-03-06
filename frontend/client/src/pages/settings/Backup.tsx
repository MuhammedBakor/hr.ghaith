import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Database, Download, Upload, Clock, HardDrive, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useState } from 'react';
import { PrintButton } from "@/components/PrintButton";

export default function Backup() {
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [inlineData, setInlineData] = useState<any>({});

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';
  const requiredRole = 'admin';
  const hasAccess = userRole === 'admin' || userRole === requiredRole || requiredRole === 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [newBackup, setNewBackup] = useState({
    name: '',
    description: '',
    backupType: 'full' as 'full' | 'incremental' | 'differential' | 'manual',
  });

  const { data: backups, isLoading, refetch } = useQuery({ queryKey: ['backups'], queryFn: () => api.get('/settings/backups').then(r => r.data) });
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['backups-stats'], queryFn: () => api.get('/settings/backups/stats').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/settings/backups', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء النسخة الاحتياطية بنجاح');
      setIsCreateOpen(false);
      setNewBackup({ name: '', description: '', backupType: 'full',
      onError: (e: any) => toast.error(e?.message || 'حدث خطأ')});
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في إنشاء النسخة الاحتياطية: ${error.message}`);
    },
  });


  const deleteMutation = useMutation({
    mutationFn: (data: any) => api.delete(`/settings/backups/${data.id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف النسخة الاحتياطية بنجاح');
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في حذف النسخة الاحتياطية: ${error.message}`);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (data: any) => api.post(`/settings/backups/${data.id}/download`).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`تم تجهيز رابط التحميل: ${data.fileName}`);
      // في بيئة الإنتاج، سيتم فتح رابط التحميل الحقيقي
      if (data.downloadUrl) {
        // محاكاة التحميل
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName;
        link.click();
      }
    },
    onError: (error) => {
      toast.error(`فشل في تحميل النسخة الاحتياطية: ${error.message}`);
    },
  });

  const handleDownload = (id: number) => {
    downloadMutation.mutate({ id });
  };

  const handleCreate = () => {
    if (!newBackup.name.trim()) {
      toast.error('يرجى إدخال اسم النسخة الاحتياطية');
      return;
    }
    createMutation.mutate(newBackup);
  };

  const handleRestore = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      downloadMutation.mutate({ id: id });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">مكتمل</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-500 text-white">جاري</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      case 'pending':
        return <Badge variant="outline">قيد الانتظار</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBackupTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">كامل</Badge>;
      case 'incremental':
        return <Badge variant="outline" className="text-green-600 border-green-600">تزايدي</Badge>;
      case 'differential':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">تفاضلي</Badge>;
      case 'manual':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">يدوي</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading || statsLoading) {
    
  if (isError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 text-lg">حدث خطأ في تحميل البيانات</p>
      <p className="text-gray-500 mt-2">{error?.message}</p>
    </div>
  );

  return (
      <div className="flex items-center justify-center h-64" dir="rtl">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSize = stats?.totalSize || 0;
  const lastBackupDate = stats?.lastBackup?.createdAt 
    ? formatDate(stats?.lastBackup?.createdAt)
    : 'لا يوجد';

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">النسخ الاحتياطي</h2>
          <p className="text-gray-500">إدارة النسخ الاحتياطية للنظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          {isCreateOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm">
            
            <div>
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إنشاء نسخة احتياطية جديدة</h3>
              </div>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم النسخة الاحتياطية</Label>
                  <Input
                    id="name"
                    value={newBackup.name}
                    onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                    placeholder="مثال: نسخة احتياطية شهرية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">نوع النسخة</Label>
                  <Select
                    value={newBackup.backupType}
                    onValueChange={(value: 'full' | 'incremental' | 'differential' | 'manual') => 
                      setNewBackup({ ...newBackup, backupType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع النسخة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">نسخة كاملة</SelectItem>
                      <SelectItem value="incremental">نسخة تزايدية</SelectItem>
                      <SelectItem value="differential">نسخة تفاضلية</SelectItem>
                      <SelectItem value="manual">نسخة يدوية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Textarea
                    id="description"
                    value={newBackup.description}
                    onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
                    placeholder="وصف النسخة الاحتياطية..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ms-2" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 ms-2" />
                      إنشاء النسخة الاحتياطية
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي النسخ</p>
              <p className="text-2xl font-bold">{backups?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <HardDrive className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الحجم الكلي</p>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">آخر نسخة</p>
              <p className="text-2xl font-bold">{lastBackupDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            النسخ الاحتياطية
          </CardTitle>
              <PrintButton title="التقرير" />
        </CardHeader>
        <CardContent>
          {!backups || backups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد نسخ احتياطية</p>
              <p className="text-sm mt-2">قم بإنشاء نسخة احتياطية جديدة للبدء</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">اسم الملف</TableHead>
                  <TableHead className="text-end">النوع</TableHead>
                  <TableHead className="text-end">الحجم</TableHead>
                  <TableHead className="text-end">التاريخ</TableHead>
                  <TableHead className="text-end">الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{backup.fileName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getBackupTypeBadge(backup.backupType)}</TableCell>
                    <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                    <TableCell>
                      {backup.createdAt 
                        ? formatDate(backup.createdAt)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDownload(backup.id)}
                          disabled={downloadMutation.isPending}
                          title="تحميل"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRestore(backup.id)}
                          disabled={restoreMutation.isPending}
                          title="استعادة"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(backup.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
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