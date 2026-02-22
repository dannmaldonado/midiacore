'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, TrendingUp, AlertCircle, FileText, BadgeDollarSign } from 'lucide-react'
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart'
import { OccupancyChart } from '@/components/dashboard/OccupancyChart'
import { Contract } from '@/types'

export default function DashboardPage() {
    const { profile } = useAuth()
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchKPIs = async () => {
            if (!profile?.company_id) return

            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('company_id', profile.company_id)

            if (!error && data) {
                setContracts(data as Contract[])
            }
            setLoading(false)
        }

        fetchKPIs()
    }, [profile, supabase])

    const stats = useMemo(() => {
        const active = contracts.filter(c => c.status === 'active').length

        // Expiration check (next 30 days)
        const today = new Date()
        const thirtyDaysLater = new Date()
        thirtyDaysLater.setDate(today.getDate() + 30)

        const expiring = contracts.filter(c => {
            const endDate = new Date(c.end_date)
            return c.status === 'active' && endDate > today && endDate <= thirtyDaysLater
        }).length

        const totalValue = contracts.reduce((sum, c) => sum + (Number(c.contract_value) || 0), 0)

        return { active, expiring, totalValue }
    }, [contracts])

    const statusData = useMemo(() => {
        const statuses = ['active', 'pending', 'expired']
        const labels = { active: 'Ativo', pending: 'Pendente', expired: 'Expirado' }

        return statuses.map(s => ({
            name: labels[s as keyof typeof labels],
            value: contracts.filter(c => c.status === s).length
        })).filter(d => d.value > 0)
    }, [contracts])

    const occupancyData = useMemo(() => {
        const months = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            months.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''))
        }

        // Fixed mock occupancy values for purity
        const baseValues = [85, 92, 78, 88, 95, 82]
        return months.map((m, idx) => ({
            month: m.toUpperCase(),
            value: baseValues[idx % baseValues.length]
        }))
    }, [])

    const kpis = [
        {
            label: 'Contratos Ativos',
            value: stats.active.toString(),
            icon: FileText,
            color: 'from-blue-500/10 to-blue-500/5 text-blue-600',
            iconColor: 'bg-blue-500/10',
            description: 'Veiculações em andamento'
        },
        {
            label: 'Expirando (30d)',
            value: stats.expiring.toString(),
            icon: AlertCircle,
            color: 'from-amber-500/10 to-amber-500/5 text-amber-600',
            iconColor: 'bg-amber-500/10',
            description: 'Contratos perto do fim'
        },
        {
            label: 'Volume de Mídia',
            value: `R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: BadgeDollarSign,
            color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
            iconColor: 'bg-emerald-500/10',
            description: 'VGV total gerenciado'
        },
        {
            label: 'Performance',
            value: '94%',
            icon: TrendingUp,
            color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600',
            iconColor: 'bg-indigo-500/10',
            description: 'Taxa de ocupação'
        },
    ]

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">Visão Geral</h2>
                    <p className="text-slate-500 mt-2 font-medium">Análise consolidada de performance e ativos MidiaCore.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="px-4 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                    <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all active:scale-95">
                        EXPORTAR BI
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="executive-card p-6 flex flex-col justify-between group cursor-default">
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-2xl ${kpi.iconColor} ${kpi.text} transition-transform group-hover:scale-110 duration-500`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Live</span>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                        <div className="mt-8">
                            <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                                {loading ? (
                                    <span className="inline-block w-24 h-8 bg-slate-100 rounded-lg shimmer animate-pulse" />
                                ) : (
                                    kpi.value
                                )}
                            </p>
                            <p className="text-[11px] font-black text-slate-400 mt-3 uppercase tracking-widest">{kpi.label}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.description}</p>
                        </div>
                        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${kpi.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                    </div>
                ))}
            </div>

            {/* SVG Gradients for Charts */}
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
                        <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-600 uppercase">
                            Geral
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {loading ? (
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
                            Ocupação de Inventário (%)
                        </h3>
                        <div className="px-3 py-1 bg-emerald-50 rounded-lg text-[10px] font-black text-emerald-600 uppercase">
                            Últimos 6 meses
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {loading ? (
                            <div className="w-full h-full shimmer rounded-2xl" />
                        ) : (
                            <OccupancyChart data={occupancyData} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
