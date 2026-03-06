import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useUser } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, FileText, Users, Car } from 'lucide-react';

export default function Search() {
  const { data: currentUser, isError, error, isLoading} = useUser();
  const userRole = currentUser?.role || 'user';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: () => api.get('/hr/employees').then(r => r.data) });
  const { data: vehicles } = useQuery({ queryKey: ['vehicles'], queryFn: () => api.get('/fleet/vehicles').then(r => r.data) });
  const { data: documents } = useQuery({ queryKey: ['documents'], queryFn: () => api.get('/documents').then(r => r.data) });

  const handleSearch = () => {
    const allResults: any[] = [];
    if (employees) {
      employees.filter((e: any) => 
        e.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        e.lastName?.toLowerCase().includes(query.toLowerCase())
      ).forEach((e: any) => allResults.push({ type: 'employee', ...e }));
    }
    if (vehicles) {
      vehicles.filter((v: any) => 
        v.plateNumber?.toLowerCase().includes(query.toLowerCase()) ||
        v.model?.toLowerCase().includes(query.toLowerCase())
      ).forEach((v: any) => allResults.push({ type: 'vehicle', ...v }));
    }
    if (documents) {
      documents.filter((d: any) => 
        d.title?.toLowerCase().includes(query.toLowerCase())
      ).forEach((d: any) => allResults.push({ type: 'document', ...d }));
    }
    setResults(allResults);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'employee': return <Users className="h-4 w-4 text-blue-600" />;
      case 'vehicle': return <Car className="h-4 w-4 text-green-600" />;
      case 'document': return <FileText className="h-4 w-4 text-amber-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ</div>;

  
  return (
    <div className="space-y-6" dir="rtl">
      {isLoading && <div className="text-center py-8 text-gray-500">جاري التحميل...</div>}
      <div>
        <h2 className="text-2xl font-bold">البحث الشامل</h2>
        <p className="text-gray-500">البحث في جميع أقسام النظام</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 px-2 md:px-0">
            <div className="relative flex-1">
              <SearchIcon className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن موظفين، مركبات، مستندات..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pe-10"
              />
            </div>
            <Button onClick={handleSearch}>بحث</Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>نتائج البحث ({results.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={r.id ?? `div-${i}`} className="p-3 border rounded flex items-center gap-3 hover:bg-gray-50">
                  {getIcon(r.type)}
                  <div>
                    <p className="font-medium">
                      {r.type === 'employee' ? `${r.firstName} ${r.lastName}` : r.type === 'vehicle' ? r.plateNumber : r.title}
                    </p>
                    <p className="text-sm text-gray-500">{r.type === 'employee' ? 'موظف' : r.type === 'vehicle' ? 'مركبة' : 'مستند'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
