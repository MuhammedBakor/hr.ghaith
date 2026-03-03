import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useAppContext } from '@/contexts/AppContext';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, RefreshCw, Database, Server, Cloud, FileSpreadsheet, CheckCircle, XCircle, Settings, Trash2, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BIDataSources() {
  const { selectedRole: userRole } = useAppContext();
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    type: "database" as "database" | "api" | "file" | "cloud",
    connectionString: "",
    refreshInterval: 60,
  });

  // جلب مصادر البيانات من API
  const { data: dataSources, isLoading, refetch, isError, error } = trpc.bi.dataSources?.list?.useQuery();


  const sourcesList = dataSources || [];

  const filteredSources = sourcesList.filter((source: any) =>
    source.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "database": return <Database className="h-5 w-5" />;
      case "api": return <Server className="h-5 w-5" />;
      case "file": return <FileSpreadsheet className="h-5 w-5" />;
      case "cloud": return <Cloud className="h-5 w-5" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "database": return <Badge className="bg-blue-500">قاعدة بيانات</Badge>;
      case "api": return <Badge className="bg-purple-500">API</Badge>;
      case "file": return <Badge className="bg-amber-500">ملف</Badge>;
      case "cloud": return <Badge className="bg-green-500">سحابي</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  const handleAddSource = () => {
    toast.info("ميزة إضافة مصادر البيانات متاح");
    setIsAddOpen(false);
    setNewSource({ name: "", type: "database", connectionString: "", refreshInterval: 60 });
  };

  const stats = {
    total: sourcesList.length,
    active: sourcesList.filter((s: any) => s.status === "active").length,
    inactive: sourcesList.filter((s: any) => s.status === "inactive" || s.status !== "active").length,
    totalRecords: sourcesList.reduce((sum: number, s: any) => sum + (s.recordCount || 0), 0),
  };

  if (isLoading) {
    if (isError) return <div className="p-8 text-center text-red-500">حدث خطأ في تحميل البيانات</div>;

    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="me-2">جارٍ تحميل مصادر البيانات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مصادر البيانات</h2>
          <p className="text-muted-foreground">إدارة مصادر البيانات المتصلة بنظام ذكاء الأعمال</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ms-2" />
            تحديث
          </Button>
          {isAddOpen && (<div className="mt-4 p-6 bg-white border rounded-xl shadow-sm animate-in fade-in">
            
            
              <div className="mb-4 border-b pb-3">
                <h3 className="text-lg font-bold">إضافة مصدر بيانات جديد</h3>
              </div>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>اسم المصدر</Label>
                  <Input
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    placeholder="مثال: قاعدة بيانات المبيعات"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع المصدر</Label>
                  <Select
                    value={newSource.type}
                    onValueChange={(value: "database" | "api" | "file" | "cloud") => 
                      setNewSource({ ...newSource, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">قاعدة بيانات</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="file">ملف</SelectItem>
                      <SelectItem value="cloud">سحابي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>سلسلة الاتصال</Label>
                  <Input
                    value={newSource.connectionString}
                    onChange={(e) => setNewSource({ ...newSource, connectionString: e.target.value })}
                    placeholder="أدخل..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>فترة التحديث (دقائق)</Label>
                  <Input
                    type="number"
                    value={newSource.refreshInterval}
                    onChange={(e) => setNewSource({ ...newSource, refreshInterval: parseInt(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAddSource} className="w-full">
                  إضافة المصدر
                </Button>
              </div>
            
          </div>)}

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المصادر</p>
              <h3 className="text-2xl font-bold">{stats.total?.toLocaleString()}</h3>
            </div>
            <Database className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">نشط</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">غير نشط</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.inactive}</h3>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي السجلات</p>
              <h3 className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</h3>
            </div>
            <FileSpreadsheet className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في مصادر البيانات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>مصادر البيانات المتصلة</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مصادر بيانات</p>
              <p className="text-sm mt-1">قم بإضافة مصادر بيانات جديدة للبدء في تحليل البيانات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المصدر</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>آخر مزامنة</TableHead>
                  <TableHead>عدد السجلات</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources?.map((source: any) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(source.type)}
                        <span className="font-medium">{source.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(source.type)}</TableCell>
                    <TableCell>
                      {source.status === "active" ? (
                        <Badge className="bg-green-500">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {source.lastSync 
                        ? formatDateTime(source.lastSync)
                        : "لم تتم المزامنة"
                      }
                    </TableCell>
                    <TableCell>{(source.recordCount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => refetch()}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.info("ميزة التفعيل/الإيقاف متاح")}>
                          {source.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.info("ميزة الإعدادات متاح")}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => toast.info("ميزة الحذف متاح")}>
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
    </div>
  );
}
