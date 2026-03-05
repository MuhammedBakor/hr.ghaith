import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BusinessRulesBuilder() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['anomaly-rules-list'],
    queryFn: () => api.get('/anomaly-rules').then(r => r.data),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const items = Array.isArray(data) ? data : (data as any)?.items || [];
  const filtered = search
    ? items.filter((item: any) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">منشئ قواعد العمل</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 me-2" /> تحديث
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
      </div>
      {isLoading && <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}
      {isError && <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-center text-red-600">خطأ في التحميل <Button variant="outline" size="sm" className="mt-2 block mx-auto" onClick={() => refetch()}>إعادة</Button></CardContent></Card>}
      {!isLoading && !isError && (
        <Card>
          <CardHeader><CardTitle className="flex gap-2">منشئ قواعد العمل <Badge variant="secondary">{filtered.length}</Badge></CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p> : (
              <div className="divide-y">
                {filtered.slice(0, 100).map((item: any, i: number) => (
                  <div key={item.id || i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name || item.title || item.ruleName || `#${item.id || i+1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.status && <Badge variant="outline" className="me-2">{item.status}</Badge>}
                        {item.priority && <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="me-2">{item.priority}</Badge>}
                        {item.description && String(item.description).slice(0, 80)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
