/**
 * ══════════════════════════════════════════════════════════════════
 * DASHBOARD LAYOUT — الهيكل الرئيسي للوحة التحكم
 * شريط جانبي ذكي مع تنقل كامل + بحث + إشعارات + تبديل الصفة
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAppContext, roleLabels, roleColors, type UserRoleType } from "@/contexts/AppContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, LogOut, PanelLeft, Users, Loader2, FileText,
  Car, DollarSign, Shield, Building2, Scale, FolderKanban,
  MessageSquare, Settings, Bell, Search, ChevronDown,
  Workflow, Globe, ShoppingCart, Megaphone, BookOpen,
  Inbox, ClipboardList, X, Check, AlertTriangle, Info,
  CheckCircle2, XCircle, User, Zap, Activity, Link as LinkIcon,
} from "lucide-react";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

// Navigation structure
const NAV_GROUPS = [
  {
    label: "الرئيسية",
    items: [
      { icon: LayoutDashboard, label: "لوحة التحكم", path: "/", module: "home" },
      { icon: Inbox, label: "صندوق الوارد", path: "/inbox", module: "home" },
    ],
  },
  {
    label: "الموارد البشرية",
    module: "hr",
    items: [
      { icon: Users, label: "الموظفون", path: "/hr/employees", module: "hr" },
      { icon: ClipboardList, label: "الحضور والغياب", path: "/hr/attendance-monitoring", module: "hr" },
      { icon: FileText, label: "الإجازات", path: "/hr/leaves", module: "hr" },
      { icon: DollarSign, label: "الرواتب", path: "/hr/payroll", module: "hr" },
      { icon: BookOpen, label: "الأداء والتدريب", path: "/hr/performance", module: "hr" },
      { icon: FileText, label: "التوظيف", path: "/hr/recruitment", module: "hr" },
      { icon: FileText, label: "الخطابات الرسمية", path: "/hr/official-letters", module: "hr" },
    ],
  },
  {
    label: "المالية",
    module: "finance",
    items: [
      { icon: FileText, label: "الفواتير", path: "/finance/invoices", module: "finance" },
      { icon: DollarSign, label: "الحسابات", path: "/finance/accounts", module: "finance" },
      { icon: ClipboardList, label: "الميزانية", path: "/finance/budgets", module: "finance" },
      { icon: ShoppingCart, label: "طلبات الشراء", path: "/finance/purchase-orders", module: "finance" },
      { icon: FileText, label: "الطلبات المالية", path: "/finance/financial-requests", module: "finance" },
      { icon: DollarSign, label: "الموردون", path: "/finance/vendors", module: "finance" },
    ],
  },
  {
    label: "الأسطول",
    module: "fleet",
    items: [
      { icon: Car, label: "المركبات", path: "/fleet/vehicles", module: "fleet" },
      { icon: Users, label: "السائقون", path: "/fleet/drivers", module: "fleet" },
      { icon: Activity, label: "الرحلات", path: "/fleet/trips", module: "fleet" },
      { icon: Settings, label: "الصيانة", path: "/fleet/maintenance", module: "fleet" },
    ],
  },
  {
    label: "العقارات",
    module: "property",
    items: [
      { icon: Building2, label: "العقارات", path: "/property/properties", module: "property" },
      { icon: FileText, label: "عقود الإيجار", path: "/property/leases", module: "property" },
    ],
  },
  {
    label: "المشاريع والعمليات",
    module: "operations",
    items: [
      { icon: FolderKanban, label: "المشاريع", path: "/projects", module: "operations" },
      { icon: Workflow, label: "سير العمل", path: "/workflow", module: "operations" },
      { icon: ClipboardList, label: "الطلبات", path: "/requests", module: "operations" },
      { icon: MessageSquare, label: "تذاكر الدعم", path: "/support/tickets", module: "operations" },
    ],
  },
  {
    label: "القانوني",
    module: "legal",
    items: [
      { icon: Scale, label: "القضايا", path: "/legal", module: "legal" },
    ],
  },
  {
    label: "التسويق",
    module: "marketing",
    items: [
      { icon: Megaphone, label: "الحملات", path: "/marketing/campaigns", module: "marketing" },
      { icon: Users, label: "العملاء والفرص", path: "/marketing/leads", module: "marketing" },
    ],
  },
  {
    label: "التقارير والبيانات",
    module: "bi",
    items: [
      { icon: ClipboardList, label: "التقارير", path: "/reports", module: "bi" },
    ],
  },
  {
    label: "الحوكمة",
    module: "governance",
    items: [
      { icon: Shield, label: "الحوكمة", path: "/governance", module: "governance" },
      { icon: FileText, label: "سجل التدقيق", path: "/logs", module: "governance" },
    ],
  },
  {
    label: "الإدارة",
    module: "admin",
    items: [
      { icon: Settings, label: "الإعدادات", path: "/settings", module: "admin" },
      { icon: Shield, label: "مراقبة الأمان", path: "/admin/security", module: "admin" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width-v3";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

// Notifications panel
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: notifications } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications', { params: { limit: 12 } }).then(res => res.data).catch(() => []),
  });
  const markRead = useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-unread'] }),
  });

  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    error: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50" },
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
  };

  return (
    <div className="absolute start-2 bottom-16 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50" dir="rtl">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-semibold">الإشعارات</span>
        </div>
        <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {!notifications?.length ? (
          <div className="py-8 text-center text-gray-400 text-sm">لا توجد إشعارات</div>
        ) : (
          notifications.map((n: any) => {
            const cfg = typeConfig[n.type] ?? typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div key={n.id} className={`flex gap-3 p-3 border-b hover:bg-gray-50 ${!n.read ? "bg-blue-50/30" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 line-clamp-1">{n.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("ar-SA")}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
              </div>
            );
          })
        )}
      </div>
      <div className="p-2 border-t text-center">
        <Link href="/profile?tab=notifications">
          <button className="text-xs text-blue-600 hover:underline" onClick={onClose}>
            عرض كل الإشعارات
          </button>
        </Link>
      </div>
    </div>
  );
}

// Quick Search
function QuickSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { data: results, isLoading } = useQuery<any[]>({
    queryKey: ['quick-search', query],
    queryFn: () => api.get('/dashboard/search', { params: { query } }).then(res => res.data).catch(() => []),
    enabled: query.length >= 2,
  });

  const moduleColors: Record<string, string> = {
    hr: "bg-blue-100 text-blue-700", finance: "bg-green-100 text-green-700",
    fleet: "bg-cyan-100 text-cyan-700", support: "bg-orange-100 text-orange-700",
    legal: "bg-purple-100 text-purple-700", projects: "bg-indigo-100 text-indigo-700",
  };
  const moduleIcons: Record<string, any> = {
    hr: Users, finance: DollarSign, fleet: Car,
    support: MessageSquare, legal: Scale, projects: FolderKanban,
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-20" onClick={onClose} dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-3 border-b">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <Input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="ابحث... موظف، فاتورة، مركبة، تذكرة..."
            className="border-0 shadow-none focus-visible:ring-0 text-sm" />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />}
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {query.length < 2
            ? <p className="text-xs text-gray-400 text-center py-6">اكتب للبحث في جميع الوحدات</p>
            : !results?.length && !isLoading
              ? <p className="text-xs text-gray-400 text-center py-6">لا نتائج لـ "{query}"</p>
              : results?.map((r: any, i: number) => {
                const Icon = moduleIcons[r.module] ?? Globe;
                const color = moduleColors[r.module] ?? "bg-gray-100 text-gray-600";
                return (
                  <button key={i} className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-gray-50 text-end"
                    onClick={() => { setLocation(r.link); onClose(); }}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                      {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                    </div>
                    {r.badge && <span className="text-xs text-gray-400 shrink-0">{r.badge}</span>}
                  </button>
                );
              })
          }
        </div>
        <div className="px-3 py-2 border-t text-xs text-gray-400 flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">Esc</kbd><span>للإغلاق</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">⌘K</kbd><span>للفتح</span>
        </div>
      </div>
    </div>
  );
}

// Main Layout
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const s = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return s ? parseInt(s, 10) : DEFAULT_WIDTH;
  });
  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <LayoutInner setSidebarWidth={setSidebarWidth}>{children}</LayoutInner>
    </SidebarProvider>
  );
}

function LayoutInner({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const { selectedRole, setSelectedRole, canAccessModule } = useAppContext();
  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get('/notifications/unread-count').then(res => res.data).catch(() => ({ count: 0 })),
    refetchInterval: 30_000,
  });

  const displayUser = user || { username: "زائر", email: "", role: "guest" };

  // Keyboard shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const w = e.clientX - left;
      const DEFAULT_WIDTH = 256;
      const MIN_WIDTH = 200;
      const MAX_WIDTH = 400;
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Auto-open active group
  useEffect(() => {
    const toOpen: Record<string, boolean> = {};
    NAV_GROUPS.forEach(g => {
      if (g.items.some(i => i.path !== "/" && location.startsWith(i.path))) {
        toOpen[g.label] = true;
      }
    });
    setOpenGroups(prev => ({ ...prev, ...toOpen }));
  }, [location]);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  const allRoles: UserRoleType[] = ["admin", "general_manager", "hr_manager", "department_manager", "supervisor", "employee"];

  return (
    <>
      {showSearch && <QuickSearch onClose={() => setShowSearch(false)} />}

      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-gray-100 bg-white" disableTransition={isResizing}>

          {/* Header */}
          <SidebarHeader className="h-14 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2.5 px-3 h-full w-full">
              <button onClick={toggleSidebar}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                <PanelLeft className="h-4 w-4 text-gray-500" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate leading-none">منصة غيث</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5 leading-none">نظام إدارة متكامل</p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Search */}
          {!isCollapsed && (
            <div className="px-2.5 py-2 border-b border-gray-100">
              <button onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-400 flex-1 text-end">بحث شامل... (⌘K)</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <SidebarContent className="overflow-y-auto py-1 gap-0">
            {NAV_GROUPS.map(group => {
              const items = group.items.filter(item =>
                item.module === "home" || canAccessModule(item.module as any)
              );
              if (!items.length) return null;

              const isOpen = openGroups[group.label] ?? false;
              const hasActive = items.some(i => i.path !== "/" && location.startsWith(i.path));

              if (items.length === 1) {
                const item = items[0];
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                return (
                  <SidebarMenu key={group.label} className="px-2 my-0.5">
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label}
                        className="h-9 text-sm font-normal">
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                        <span className={isActive ? "text-blue-700 font-medium" : "text-gray-700"}>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                );
              }

              return (
                <div key={group.label} className="mb-0.5">
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={`flex items-center justify-between w-full px-4 py-1.5 text-xs font-semibold transition-colors ${hasActive ? "text-blue-700" : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                      <span>{group.label}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  {(isOpen || isCollapsed) && (
                    <SidebarMenu className="px-2">
                      {items.map(item => {
                        const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label}
                              className="h-8 text-sm font-normal">
                              <item.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                              <span className={`text-sm ${isActive ? "text-blue-700 font-medium" : "text-gray-600"}`}>
                                {item.label}
                              </span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  )}
                </div>
              );
            })}
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-2 border-t border-gray-100 shrink-0">
            {/* Notifications */}
            {!isCollapsed && (
              <div className="relative mb-1">
                <button onClick={() => setShowNotifications(!showNotifications)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="relative shrink-0">
                    <Bell className="w-4 h-4 text-gray-500" />
                    {unread?.count ? (
                      <span className="absolute -top-1 -end-1 w-3.5 h-3.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-mono leading-none">
                        {unread.count > 9 ? "9" : unread.count}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm text-gray-600 flex-1 text-end">الإشعارات</span>
                  {unread?.count ? (
                    <Badge className="bg-red-100 text-red-700 border-0 text-xs h-5 px-1.5">{unread.count}</Badge>
                  ) : null}
                </button>
                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
              </div>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 w-full px-2 py-2 hover:bg-gray-100 rounded-lg transition-colors text-end">
                  <Avatar className="h-8 w-8 border border-gray-200 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-blue-100 text-blue-700">
                      {(displayUser as any).username?.charAt(0)?.toUpperCase() || "؟"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate leading-none">{(displayUser as any).username || "زائر"}</p>
                      <p className="text-xs truncate mt-0.5 leading-none" style={{ color: roleColors[selectedRole] }}>
                        {roleLabels[selectedRole]}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" side="top" className="w-60 mb-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-semibold">{(displayUser as any).username}</p>
                  <p className="text-xs text-gray-500">{displayUser.email}</p>
                </div>

                <DropdownMenuLabel className="text-xs text-gray-400 font-normal pt-2 pb-1">
                  تبديل الصفة
                </DropdownMenuLabel>
                {allRoles.map(role => (
                  <DropdownMenuItem key={role} className="cursor-pointer" onClick={() => setSelectedRole(role)}>
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: roleColors[role] }} />
                      <span className="text-sm flex-1">{roleLabels[role]}</span>
                      {selectedRole === role && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/profile")}>
                  <User className="ms-2 h-4 w-4" /><span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/settings")}>
                  <Settings className="ms-2 h-4 w-4" /><span>الإعدادات</span>
                </DropdownMenuItem>
                {(selectedRole === "admin" || selectedRole === "general_manager") && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/admin/security")}>
                    <Shield className="ms-2 h-4 w-4" /><span>لوحة الأمان</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => logout()}>
                  <LogOut className="ms-2 h-4 w-4" /><span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 end-0 w-1 h-full cursor-col-resize hover:bg-blue-400/50 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => !isCollapsed && setIsResizing(true)}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* Main content */}
      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-white/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="text-sm font-medium text-gray-700">
                {NAV_GROUPS.flatMap(g => g.items)
                  .find(i => i.path === location || (i.path !== "/" && location.startsWith(i.path)))?.label ?? "القائمة"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowSearch(true)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg">
                <Search className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg">
                <Bell className="w-4 h-4 text-gray-500" />
                {unread?.count ? <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full" /> : null}
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 min-h-screen bg-gray-50">{children}</main>
      </SidebarInset>
    </>
  );
}
