import { useAuth } from "@/_core/hooks/useAuth";
import { ReactNode } from "react";

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * مكون بوابة الصلاحيات
 * يستخدم لإخفاء أو إظهار العناصر بناءً على صلاحيات المستخدم
 * 
 * @param permission - صلاحية واحدة مطلوبة
 * @param permissions - قائمة صلاحيات مطلوبة
 * @param requireAll - إذا كان true، يجب توفر جميع الصلاحيات، وإلا يكفي واحدة
 * @param fallback - عنصر بديل يظهر إذا لم تتوفر الصلاحيات
 * @param showFallback - إذا كان true، يظهر العنصر البديل، وإلا يختفي العنصر
 */
export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  showFallback = false,
}: PermissionGateProps) {
  const { user, isAuthenticated } = useAuth();

  // إذا لم يكن المستخدم مسجل الدخول، لا تظهر شيء
  if (!isAuthenticated || !user) {
    return showFallback ? <>{fallback}</> : null;
  }

  // جمع الصلاحيات المطلوبة
  const requiredPermissions = permission ? [permission, ...permissions] : permissions;

  // إذا لم تكن هناك صلاحيات مطلوبة، أظهر المحتوى
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // التحقق من صلاحيات المستخدم
  const userPermissions = (user as any).permissions || [];
  const userRole = (user as any).role || "user";

  // المدير لديه جميع الصلاحيات
  if (userRole === "admin") {
    return <>{children}</>;
  }

  // التحقق من الصلاحيات
  const hasPermission = requireAll
    ? requiredPermissions.every((p) => userPermissions.includes(p))
    : requiredPermissions.some((p) => userPermissions.includes(p));

  if (hasPermission) {
    return <>{children}</>;
  }

  return showFallback ? <>{fallback}</> : null;
}

/**
 * مكون للتحقق من دور المستخدم
 */
interface RoleGateProps {
  children: ReactNode;
  role: "admin" | "user";
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function RoleGate({
  children,
  role,
  fallback = null,
  showFallback = false,
}: RoleGateProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return showFallback ? <>{fallback}</> : null;
  }

  const userRole = (user as any).role || "user";

  if (userRole === role || userRole === "admin") {
    return <>{children}</>;
  }

  return showFallback ? <>{fallback}</> : null;
}

/**
 * Hook للتحقق من الصلاحيات
 */
export function usePermission(permission: string): boolean {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return false;
  }

  const userPermissions = (user as any).permissions || [];
  const userRole = (user as any).role || "user";

  if (userRole === "admin") {
    return true;
  }

  return userPermissions.includes(permission);
}

/**
 * Hook للتحقق من الدور
 */
export function useRole(): "admin" | "user" | null {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (user as any).role || "user";
}

export default PermissionGate;
