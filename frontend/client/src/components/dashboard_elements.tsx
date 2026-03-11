import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { TrendingUp, TrendingDown, ChevronRight, AlertCircle, AlertTriangle, X, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════
// ANIMATED NUMBER
// ═══════════════════════════════════════════════════════════
export function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    const prev = useRef(0);
    useEffect(() => {
        const start = prev.current;
        const end = value;
        if (start === end) return;
        let startTime: number | null = null;
        const animate = (t: number) => {
            if (!startTime) startTime = t;
            const p = Math.min((t - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(start + (end - start) * ease));
            if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        prev.current = end;
    }, [value, duration]);
    return <span>{display.toLocaleString('ar-SA')}</span>;
}

// ═══════════════════════════════════════════════════════════
// STATUS DOT
// ═══════════════════════════════════════════════════════════
export function StatusDot({ status }: { status: 'healthy' | 'warning' | 'critical' | 'unknown' }) {
    const map = {
        healthy: 'bg-emerald-500',
        warning: 'bg-amber-400 animate-pulse',
        critical: 'bg-red-500 animate-pulse',
        unknown: 'bg-gray-400',
    };
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]}`} />;
}

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
export type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'teal' | 'orange' | 'pink' | 'gray' | 'amber';
export interface StatCardProps {
    title: string;
    value: number | string;
    sub?: string;
    icon: React.ComponentType<{ className?: string }>;
    color?: ColorKey;
    link?: string;
    alert?: boolean;
    trend?: number;
    trendLabel?: string;
    badge?: string;
}

export const COLOR_MAP: Record<ColorKey, { bg: string; icon: string; border: string; gradient: string; iconBg: string; glow: string }> = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-400',   border: 'border-blue-900/40',   gradient: 'from-blue-500 to-blue-600',     iconBg: 'rgba(59,130,246,0.15)',  glow: 'rgba(59,130,246,0.12)' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-400',  border: 'border-green-900/40',  gradient: 'from-green-500 to-emerald-600', iconBg: 'rgba(34,197,94,0.15)',   glow: 'rgba(34,197,94,0.12)' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-400',    border: 'border-red-900/40',    gradient: 'from-red-500 to-rose-600',      iconBg: 'rgba(239,68,68,0.15)',   glow: 'rgba(239,68,68,0.12)' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-400', border: 'border-yellow-900/40', gradient: 'from-yellow-400 to-orange-500', iconBg: 'rgba(234,179,8,0.15)',   glow: 'rgba(234,179,8,0.12)' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-400', border: 'border-purple-900/40', gradient: 'from-purple-500 to-violet-600', iconBg: 'rgba(168,85,247,0.15)',  glow: 'rgba(168,85,247,0.12)' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-400', border: 'border-indigo-900/40', gradient: 'from-indigo-500 to-blue-600',   iconBg: 'rgba(99,102,241,0.15)',  glow: 'rgba(99,102,241,0.12)' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-400',   border: 'border-teal-900/40',   gradient: 'from-teal-500 to-cyan-600',     iconBg: 'rgba(20,184,166,0.15)',  glow: 'rgba(20,184,166,0.12)' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-400', border: 'border-orange-900/40', gradient: 'from-orange-500 to-amber-600',  iconBg: 'rgba(249,115,22,0.15)',  glow: 'rgba(249,115,22,0.12)' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-400',  border: 'border-amber-900/40',  gradient: 'from-amber-500 to-orange-600',  iconBg: 'rgba(245,158,11,0.15)',  glow: 'rgba(245,158,11,0.12)' },
    pink:   { bg: 'bg-pink-50',   icon: 'text-pink-400',   border: 'border-pink-900/40',   gradient: 'from-pink-500 to-rose-600',     iconBg: 'rgba(236,72,153,0.15)',  glow: 'rgba(236,72,153,0.12)' },
    gray:   { bg: 'bg-gray-50',   icon: 'text-gray-400',   border: 'border-gray-700/40',   gradient: 'from-gray-500 to-gray-600',     iconBg: 'rgba(107,114,128,0.15)', glow: 'rgba(107,114,128,0.12)' },
};

export function StatCard({ title, value, sub, icon: Icon, color = 'blue', link, alert, trend, trendLabel, badge }: StatCardProps) {
    const c = COLOR_MAP[color] ?? COLOR_MAP.blue;

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        border: alert ? '1px solid rgba(239,68,68,0.5)' : 'none',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: alert
            ? '0 8px 32px rgba(239,68,68,0.15), 0 4px 16px rgba(0,0,0,0.08)'
            : '0 8px 32px rgba(30,58,95,0.1), 0 4px 16px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: link ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
    };

    const content = (
        <div
            style={cardStyle}
            className="group"
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(30,58,95,0.18), 0 6px 20px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = alert
                    ? '0 8px 32px rgba(239,68,68,0.15), 0 4px 16px rgba(0,0,0,0.08)'
                    : '0 8px 32px rgba(30,58,95,0.1), 0 4px 16px rgba(0,0,0,0.06)';
            }}
        >
            {alert && (
                <div className="absolute top-0 start-0 end-0 h-0.5 bg-gradient-to-r from-red-400 to-rose-500 rounded-t-2xl" />
            )}
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.iconBg }}>
                    <Icon className={cn('w-6 h-6', c.icon)} />
                </div>
                <div className="flex items-center gap-2">
                    {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                    {alert && <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />}
                    {link && <ChevronRight className="w-4 h-4 transition-all" style={{ color: '#6b7280' }} />}
                </div>
            </div>
            <p className="text-xs font-medium mb-1" style={{ color: 'rgb(201, 168, 76)' }}>{title}</p>
            <p className="text-3xl font-bold mb-2 tracking-tight" style={{ color: '#1a2035' }}>
                {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
            </p>
            {sub && <p className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>{sub}</p>}
            {trend !== undefined && trend !== 0 && (
                <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend > 0 ? 'text-green-400' : 'text-red-400')}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend)}% {trendLabel ?? 'هذا الشهر'}
                </div>
            )}
        </div>
    );

    return link ? <Link href={link}>{content}</Link> : content;
}

// ═══════════════════════════════════════════════════════════
// QUICK ACTION BUTTON
// ═══════════════════════════════════════════════════════════
export function QuickAction({ icon: Icon, label, link, color = 'blue', count: countNum }: {
    icon: React.ComponentType<{ className?: string }>; label: string; link: string; color?: ColorKey; count?: number;
}) {
    const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
    return (
        <Link href={link}>
            <div
                className="group flex flex-col items-center gap-2.5 p-4 rounded-xl cursor-pointer relative"
                style={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    boxShadow: '0 6px 24px rgba(30,58,95,0.1), 0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 36px rgba(30,58,95,0.15), 0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(30,58,95,0.1), 0 2px 8px rgba(0,0,0,0.06)';
                }}
            >
                {countNum !== undefined && countNum > 0 && (
                    <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg">
                        {countNum > 99 ? '99+' : countNum}
                    </span>
                )}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.iconBg }}>
                    <Icon className={cn('w-5 h-5', c.icon)} />
                </div>
                <span className="text-xs font-medium text-center leading-tight" style={{ color: 'rgb(201, 168, 76)' }}>{label}</span>
            </div>
        </Link>
    );
}

// ═══════════════════════════════════════════════════════════
// PENDING ACTION ROW
// ═══════════════════════════════════════════════════════════
export function PendingActionRow({ item }: {
    item: { type: string; id: number; title: string; priority: string; link: string; createdAt: string | Date };
}) {
    const priorityConfig: Record<string, { color: string; label: string }> = {
        critical: { color: 'text-red-600 bg-red-50 border-red-100', label: 'حرج' },
        high: { color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'عالي' },
        medium: { color: 'text-yellow-600 bg-yellow-50 border-yellow-100', label: 'متوسط' },
        low: { color: 'text-gray-600 bg-gray-50 border-gray-100', label: 'منخفض' },
    };
    const pc = priorityConfig[item.priority] ?? priorityConfig.medium;

    return (
        <Link href={item.link}>
            <div
                className="flex items-center gap-3 py-3 px-4 rounded-xl transition-colors cursor-pointer group"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
                <div className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0', pc.color)}>
                    {pc.label}
                </div>
                <p className="flex-1 text-sm truncate transition-colors" style={{ color: 'rgba(0,0,0,0.75)' }}>{item.title}</p>
                <ChevronRight className="w-4 h-4 shrink-0 transition-colors" style={{ color: '#4b5563' }} />
            </div>
        </Link>
    );
}

// ═══════════════════════════════════════════════════════════
// MODULE HEALTH BADGE
// ═══════════════════════════════════════════════════════════
export function ModuleHealthBadge({ status, name }: { status: 'healthy' | 'warning' | 'critical' | 'unknown'; name: string }) {
    const styles: Record<string, React.CSSProperties> = {
        healthy:  { backgroundColor: 'rgba(34,197,94,0.1)',  border: '1px solid rgba(34,197,94,0.25)',  color: '#4ade80' },
        warning:  { backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' },
        critical: { backgroundColor: 'rgba(239,68,68,0.1)',  border: '1px solid rgba(239,68,68,0.25)',  color: '#f87171' },
        unknown:  { backgroundColor: 'rgba(107,114,128,0.1)',border: '1px solid rgba(107,114,128,0.25)',color: '#9ca3af' },
    };
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={styles[status] ?? styles.unknown}>
            <StatusDot status={status} />
            {name}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SYSTEM STATUS BAR
// ═══════════════════════════════════════════════════════════
export function SystemStatusBar({ systemStatus }: { systemStatus: 'healthy' | 'warning' | 'critical' }) {
    if (systemStatus === 'healthy') return null;
    return (
        <div className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border',
            systemStatus === 'critical'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800',
        )}>
            <Radio className={cn('w-4 h-4', systemStatus === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500')} />
            {systemStatus === 'critical' ? 'النظام يواجه مشكلة حرجة — يرجى التواصل مع الدعم الفني' : 'بعض الوحدات تحتاج انتباهاً'}
        </div>
    );
}
