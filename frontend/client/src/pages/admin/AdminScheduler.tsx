import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function AdminScheduler() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["automation", "stats"],
    queryFn: () => api.get("/api/automation/stats").then(r => r.data),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.logs || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">جدولة المهام</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 me-2" />
          تحديث
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">حدث خطأ في تحميل البيانات</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              جدولة المهام
              <Badge variant="secondary">{items.length} مهمة</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد بيانات حالياً</p>
            ) : (
              <div className="divide-y">
                {items.slice(0, 50).map((item: any, i: number) => (
                  <div key={item.id || i} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name || item.title || item.action || item.description || `مهمة #${item.id || i+1}`}</p>
                      <p className="text-sm text-muted-foreground">{item.status && <Badge variant="outline">{item.status}</Badge>} {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-SA') : ''}</p>
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
