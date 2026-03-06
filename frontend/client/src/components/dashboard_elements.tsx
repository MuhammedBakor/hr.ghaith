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

export const COLOR_MAP: Record<ColorKey, { bg: string; icon: string; border: string; gradient: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-500 to-blue-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100', gradient: 'from-green-500 to-emerald-600' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100', gradient: 'from-red-500 to-rose-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100', gradient: 'from-yellow-400 to-orange-500' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100', gradient: 'from-purple-500 to-violet-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100', gradient: 'from-indigo-500 to-blue-600' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-100', gradient: 'from-teal-500 to-cyan-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100', gradient: 'from-orange-500 to-amber-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100', gradient: 'from-amber-500 to-orange-600' },
    pink: { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-100', gradient: 'from-pink-500 to-rose-600' },
    gray: { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-100', gradient: 'from-gray-500 to-gray-600' },
};

export function StatCard({ title, value, sub, icon: Icon, color = 'blue', link, alert, trend, trendLabel, badge }: StatCardProps) {
    const c = COLOR_MAP[color] ?? COLOR_MAP.blue;

    const content = (
        <div className={cn(
            'bg-white rounded-2xl border p-5 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden',
            alert ? 'border-red-200 shadow-red-50/50 shadow-md' : `${c.border} hover:border-opacity-70`,
        )}>
            {alert && (
                <div className="absolute top-0 start-0 end-0 h-0.5 bg-gradient-to-r from-red-400 to-rose-500 rounded-t-2xl" />
            )}
            <div className="flex items-start justify-between mb-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', c.bg)}>
                    <Icon className={cn('w-6 h-6', c.icon)} />
                </div>
                <div className="flex items-center gap-2">
                    {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                    {alert && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
                    {link && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />}
                </div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
            </p>
            {sub && <p className="text-xs text-gray-400">{sub}</p>}
            {trend !== undefined && trend !== 0 && (
                <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend > 0 ? 'text-green-600' : 'text-red-500')}>
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
            <div className={cn(
                'group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md relative',
                c.border, c.bg, 'hover:scale-[1.03]',
            )}>
                {countNum !== undefined && countNum > 0 && (
                    <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {countNum > 99 ? '99+' : countNum}
                    </span>
                )}
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg)}>
                    <Icon className={cn('w-5 h-5', c.icon)} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</span>
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
            <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                <div className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0', pc.color)}>
                    {pc.label}
                </div>
                <p className="flex-1 text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">{item.title}</p>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
            </div>
        </Link>
    );
}

// ═══════════════════════════════════════════════════════════
// MODULE HEALTH BADGE
// ═══════════════════════════════════════════════════════════
export function ModuleHealthBadge({ status, name }: { status: 'healthy' | 'warning' | 'critical' | 'unknown'; name: string }) {
    return (
        <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium',
            status === 'healthy' ? 'bg-green-50 border-green-100 text-green-700' :
                status === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    status === 'critical' ? 'bg-red-50 border-red-100 text-red-700' :
                        'bg-gray-50 border-gray-100 text-gray-600',
        )}>
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
