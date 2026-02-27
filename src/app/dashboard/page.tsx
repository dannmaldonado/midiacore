'use client'

export const dynamic = 'force-dynamic'

import { useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useDashboardMetrics, TrendingInfo, SparklinePoint } from '@/hooks/use-dashboard-metrics'
import {
    TrendingUp,
    TrendingDown,
    Minus,
    FileText,
    BadgeDollarSign,
    AlertCircle,
    Target,
    ExternalLink,
    Clock,
    Package,
} from 'lucide-react'
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart'
import { OccupancyChart } from '@/components/dashboard/OccupancyChart'
import { Sparkline } from '@/components/dashboard/Sparkline'
import Link from 'next/link'
import { Contract } from '@/types'

// ─── Trending badge ────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: TrendingInfo }) {
    if (trend.direction === 'up') {
        return (
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <TrendingUp className="w-3 h-3" />+{trend.pct}%
            </span>
        )
    }
    if (trend.direction === 'down') {
        return (
            <span className="flex items-center gap-1 text-[10px] font-black text-red-500">
                <TrendingDown className="w-3 h-3" />-{trend.pct}%
            </span>
        )
    }
    return (
        <span className="flex items-center gap-1 text-[10px] font-black text-slate-400">
            <Minus className="w-3 h-3" />0%
        </span>
    )
}

// ─── KPI Card ──────────────────────────────────────────────────────────────

interface KPICardProps {
    label: string
    value: string
    sub?: string
    icon: React.ReactNode
    iconBg: string
    trend: TrendingInfo
    sparkData: SparklinePoint[]
    sparkColor: string
    alert?: boolean
    loading: boolean
}

function KPICard({ label, value, sub, icon, iconBg, trend, sparkData, sparkColor, alert, loading }: KPICardProps) {
    return (
        <div className={`executive-card p-5 flex flex-col justify-between relative overflow-hidden ${alert ? 'ring-2 ring-red-300/60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
                <TrendBadge trend={trend} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                {loading ? (
                    <div className="w-20 h-7 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                    <p className={`text-2xl font-black ${alert ? 'text-red-600' : 'text-slate-900'} leading-none`}>{value}</p>
                )}
                {sub && <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>}
            </div>
            <div className="mt-3 -mx-1">
                <Sparkline data={sparkData} color={sparkColor} />
            </div>
            <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-widest">Últimas 4 semanas</p>
        </div>
    )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
    const target = new Date(dateStr)
    const now = new Date()
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const STATUS_LABELS: Record<string, string> = {
    active: 'Ativo',
    pending: 'Pendente',
    expired: 'Expirado',
}

// ─── Dashboard Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { profile } = useAuth()
    const metrics = useDashboardMetrics()

    // Data for existing charts
    const statusData = useMemo(() => {
        const statuses = ['active', 'pending', 'expired'] as const
        const labels: Record<string, string> = { active: 'Ativo', pending: 'Pendente', expired: 'Expirado' }
        return statuses
            .map(s => ({ name: labels[s], value: metrics.contracts.filter(c => c.status === s).length }))
            .filter(d => d.value > 0)
    }, [metrics.contracts])

    const occupancyData = useMemo(() => {
        const months = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setDate(1)
            d.setMonth(d.getMonth() - i)
            months.push({ year: d.getFullYear(), month: d.getMonth() })
        }
        return months.map(({ year, month }) => {
            const monthStart = new Date(year, month, 1)
            const monthEnd = new Date(year, month + 1, 0)
            const label = monthStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
            const activeInMonth = metrics.contracts.filter(c => {
                const start = new Date(c.start_date)
                const end = new Date(c.end_date)
                return start <= monthEnd && end >= monthStart
            }).length
            return { month: label, value: activeInMonth }
        })
    }, [metrics.contracts])

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">Visão Geral</h2>
                    <p className="text-slate-500 mt-2 font-medium">
                        Olá, {profile?.full_name?.split(' ')[0] || 'usuário'} · Análise consolidada de performance e ativos MidiaCore.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/reports/contracts"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 hover:border-indigo-300 hover:shadow-sm transition-all uppercase tracking-wide"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver Relatórios
                    </Link>
                    <div className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 border border-slate-200">
                        {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* KPI Cards — 4 cards com trending + sparkline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Contratos Vigentes"
                    value={String(metrics.activeContracts)}
                    sub="status ativo"
                    icon={<FileText className="w-4 h-4 text-blue-600" />}
                    iconBg="bg-blue-100"
                    trend={metrics.trendingActive}
                    sparkData={metrics.sparkActive}
                    sparkColor="#3b82f6"
                    loading={metrics.loading}
                />
                <KPICard
                    label="Faturamento Total"
                    value={`R$ ${(metrics.totalRevenue / 1000).toFixed(0)}k`}
                    sub={`R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<BadgeDollarSign className="w-4 h-4 text-emerald-600" />}
                    iconBg="bg-emerald-100"
                    trend={metrics.trendingRevenue}
                    sparkData={metrics.sparkRevenue}
                    sparkColor="#10b981"
                    loading={metrics.loading}
                />
                <KPICard
                    label="Vencendo em 30d"
                    value={String(metrics.expiringSoon)}
                    sub="contratos expirando"
                    icon={<AlertCircle className="w-4 h-4 text-red-500" />}
                    iconBg="bg-red-100"
                    trend={metrics.trendingExpiring}
                    sparkData={metrics.sparkExpiring}
                    sparkColor="#ef4444"
                    alert={metrics.expiringSoon > 0}
                    loading={metrics.loading}
                />
                <KPICard
                    label="Oportunidades Abertas"
                    value={String(metrics.openOpportunities)}
                    sub={`${metrics.mediaKitPct}% com Mídia Kit`}
                    icon={<Target className="w-4 h-4 text-indigo-600" />}
                    iconBg="bg-indigo-100"
                    trend={metrics.trendingOpportunities}
                    sparkData={metrics.sparkOpportunities}
                    sparkColor="#6366f1"
                    loading={metrics.loading}
                />
            </div>

            {/* Existing Charts */}
            <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                <defs>
                    <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                </defs>
            </svg>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="executive-card p-10 min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                            Distribuição por Status
                        </h3>
                        <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-600 uppercase">Geral</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {metrics.loading ? (
                            <div className="w-full h-full shimmer rounded-2xl" />
                        ) : statusData.length === 0 ? (
                            <div className="text-center">
                                <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sem dados disponíveis</p>
                            </div>
                        ) : (
                            <StatusDistributionChart data={statusData} />
                        )}
                    </div>
                </div>

                <div className="executive-card p-10 min-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            Contratos Ativos por Mês
                        </h3>
                        <div className="px-3 py-1 bg-emerald-50 rounded-lg text-[10px] font-black text-emerald-600 uppercase">Últimos 6 meses</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {metrics.loading ? (
                            <div className="w-full h-full shimmer rounded-2xl" />
                        ) : (
                            <OccupancyChart data={occupancyData} />
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Próximos Vencimentos */}
                <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximos Vencimentos</h3>
                        </div>
                        <Link href="/dashboard/reports/contracts" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wide transition-colors">
                            Ver todos
                        </Link>
                    </div>

                    {metrics.loading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : metrics.upcomingExpirations.length === 0 ? (
                        <p className="text-sm font-medium text-slate-400 text-center py-6">Nenhum contrato vencendo em 30 dias</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-2 pr-2">Shopping</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-2 pr-2">Status</th>
                                    <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-wide pb-2">Dias</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.upcomingExpirations.map((c: Contract) => {
                                    const days = daysUntil(c.end_date)
                                    return (
                                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 pr-2">
                                                <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] block">{c.shopping_name}</span>
                                            </td>
                                            <td className="py-2.5 pr-2">
                                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                                                    {STATUS_LABELS[c.status] || c.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right">
                                                <span className={`text-xs font-black ${days <= 10 ? 'text-red-600' : 'text-slate-700'}`}>
                                                    {days}d
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Oportunidades Aguardando */}
                <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-amber-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oportunidades Aguardando</h3>
                        </div>
                        <Link href="/dashboard/reports/opportunities" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wide transition-colors">
                            Ver todos
                        </Link>
                    </div>

                    {metrics.loading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : metrics.waitingOpportunities.length === 0 ? (
                        <p className="text-sm font-medium text-slate-400 text-center py-6">Nenhuma oportunidade aguardando há +7 dias</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-2 pr-2">Shopping</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-2 pr-2">Stage</th>
                                    <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-wide pb-2">Dias</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.waitingOpportunities.map(o => (
                                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-2.5 pr-2">
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] block">{o.shopping_name}</span>
                                        </td>
                                        <td className="py-2.5 pr-2">
                                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px] block">{o.stage}</span>
                                        </td>
                                        <td className="py-2.5 text-right">
                                            <span className={`text-xs font-black ${o.days > 14 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {o.days}d
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
