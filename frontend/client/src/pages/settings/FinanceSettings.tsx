import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function FinanceSettings() {
  const { data, isLoading, refetch } = trpc.siteSettings.list.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const updateMutation = trpc.siteSettings.update.useMutation({
    onSuccess: () => { toast.success("تم حفظ الإعدادات"); refetch(); },
    onError: (e) => toast.error(e.message || "خطأ في الحفظ"),
  });

  const settings = Array.isArray(data) ? data : [];
  const moduleSettings = settings.filter((s: any) => 
    String(s.key || s.name || '').toLowerCase().includes('finance')
  );

  const [form, setForm] = useState<Record<string, string>>({}); 

  const handleSave = () => {
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined) {
        updateMutation.mutate({ id: parseInt(key) || 1, value: String(value) } as any);
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إعدادات المالية</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 me-2" /> تحديث
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isLoading}>
            <Save className="h-4 w-4 me-2" /> حفظ
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>إعدادات المالية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {moduleSettings.length > 0 ? moduleSettings.map((s: any, i: number) => (
              <div key={s.id || i} className="grid grid-cols-3 gap-4 items-center">
                <Label>{s.key || s.name || `إعداد #${i+1}`}</Label>
                <Input
                  className="col-span-2"
                  defaultValue={s.value || ''}
                  onChange={(e) => setForm(p => ({...p, [s.id || i]: e.target.value}))}
                />
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-6">لا توجد إعدادات مسجلة لهذه الوحدة بعد</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
