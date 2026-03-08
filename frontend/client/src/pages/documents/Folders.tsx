import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen, Plus, Search, Loader2, Edit, Trash2, ArrowRight, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Folders() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Edit state
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [editName, setEditName] = useState('');

  // Open folder state
  const [openFolder, setOpenFolder] = useState<any>(null);

  const { data: folders = [], isLoading, isError } = useQuery({
    queryKey: ['document-folders'],
    queryFn: () => api.get('/documents/folders').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/documents/folders', data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم إنشاء المجلد بنجاح');
      setShowNewFolder(false);
      setNewFolderName('');
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
    },
    onError: () => {
      toast.error('فشل في إنشاء المجلد');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/documents/folders/${id}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('تم تحديث المجلد بنجاح');
      setEditingFolder(null);
      setEditName('');
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
    },
    onError: () => {
      toast.error('فشل في تحديث المجلد');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/folders/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('تم حذف المجلد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
    },
    onError: () => {
      toast.error('فشل في حذف المجلد');
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('يرجى إدخال اسم المجلد');
      return;
    }
    createMutation.mutate({ name: newFolderName.trim() });
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setEditName(folder.name || '');
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast.error('يرجى إدخال اسم المجلد');
      return;
    }
    updateMutation.mutate({ id: editingFolder.id, name: editName.trim() });
  };

  const handleDeleteFolder = (folder: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف المجلد "${folder.name}"؟`)) return;
    deleteMutation.mutate(folder.id);
  };

  const filteredFolders = (folders as any[]).filter((f: any) =>
    !searchTerm || (f.name || '').includes(searchTerm)
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

  // If a folder is open, show its details
  if (openFolder) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setOpenFolder(null)}>
            <ArrowRight className="h-4 w-4 ms-1" />
            رجوع
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-amber-500" />
              {openFolder.name}
            </h2>
            <p className="text-gray-500 text-sm">
              تم الإنشاء: {openFolder.createdAt ? new Date(openFolder.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">هذا المجلد فارغ</p>
            <p className="text-sm mt-1">لا توجد مستندات في هذا المجلد حالياً</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        {filteredFolders.map((folder: any) => (
          <Card key={folder.id} className="hover:shadow-md transition-shadow group relative">
            <CardContent className="p-6 text-center">
              {/* Action buttons */}
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                  title="تعديل"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Clickable folder */}
              <div className="cursor-pointer" onClick={() => setOpenFolder(folder)}>
                <FolderOpen className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold">{folder.name || 'بدون اسم'}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString('ar-SA') : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredFolders.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد مجلدات</p>
          </div>
        )}
      </div>

      {/* Create folder form */}
      {showNewFolder && (
        <div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
          <div className="mb-4 border-b pb-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              إنشاء مجلد جديد
            </h3>
            <p className="text-sm text-gray-500">أدخل اسم المجلد الجديد لتنظيم المستندات</p>
          </div>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المجلد *</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="مثال: العقود، الفواتير، التقارير"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t justify-end">
            <Button variant="outline" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>
              إلغاء
            </Button>
            <Button onClick={handleCreateFolder} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
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
        </div>
      )}

      {/* Edit folder modal */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingFolder(null)}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 border-b pb-3">تعديل المجلد</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المجلد *</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="اسم المجلد"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
              </div>
              <div className="flex gap-2 pt-3 border-t justify-end">
                <Button variant="outline" onClick={() => setEditingFolder(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
