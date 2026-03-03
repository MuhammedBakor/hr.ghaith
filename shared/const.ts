export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
// SESSION_EXPIRY: 8 ساعات عمل — توصية التقرير الأمني
// بعد 8 ساعات يُطلب من المستخدم إعادة تسجيل الدخول
export const SESSION_EXPIRY_MS = 1000 * 60 * 60 * 8; // 8 hours
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// SECURITY FIX v82: ثابت مركزي لـ bcrypt salt rounds
// 12 rounds = ~250ms per hash — موصى به للإنتاج
export const BCRYPT_SALT_ROUNDS = 12;
