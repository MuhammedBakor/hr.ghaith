import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Folders() {
  const confirmDelete = (fn: () => void) => { if (window.confirm("هل أنت متأكد من الحذف؟")) fn(); };

  const { data: currentUser, isError, error} = useUser();
  const userRole = currentUser?.role || 'user';

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then(r => r.data),
  });

  // إنشاء مستند جديد (كمجلد)
  const createDocumentMutation = useMutation({
    mutationFn: (data: any) => api.post('/documents', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء المجلد بنجاح');
      setShowNewFolder(false);
      setNewFolderName('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`فشل في إنشاء المجلد: ${error.message}`);
    },
  });
  
  const folders = (documents || []).reduce((acc: any, doc: any) => {
    const category = doc.category || 'عام';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('يرجى إدخال اسم المجلد');
      return;
    }
    // إنشاء مستند وهمي لتمثيل المجلد
    createDocumentMutation.mutate({
      title: `مجلد: ${newFolderName}`,
      category: newFolderName,
      documentType: 'other',
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">المجلدات</h2>
          <p className="text-gray-500">تنظيم المستندات في مجلدات</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewFolder(true)}>
          <Plus className="h-4 w-4" />مجلد جديد
        </Button>
      </div>
      
      <div className="relative max-w-sm">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="بحث في المجلدات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pe-10"
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Object.entries(folders)
          .filter(([name]) => !searchTerm || name.includes(searchTerm))
          .map(([name, docs]: [string, any]) => (
          <Card key={name} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FolderOpen className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-gray-500">{docs.length} مستند</p>
            </CardContent>
          </Card>
        ))}
        {Object.keys(folders).length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد مجلدات</p>
          </div>
        )}
      </div>

      {/* نافذة إنشاء مجلد جديد */}
      {showNewFolder && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
        
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold">إنشاء مجلد جديد</h3>
            <p className="text-sm text-gray-500">
              أدخل اسم المجلد الجديد لتنظيم المستندات
            </p>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المجلد *</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="مثال: العقود، الفواتير، التقارير"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateFolder} disabled={createDocumentMutation.isPending}>
              {createDocumentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 ms-2" />
                  إنشاء المجلد
                </>
              )}
            </Button>
          </div>
        
      </div>)}

    </div>
  );
}
