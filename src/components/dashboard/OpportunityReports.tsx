'use client'

import { TrendingUp, Clock, AlertTriangle, Package, Wifi, FileText } from 'lucide-react'
import { Opportunity } from '@/types'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'

interface OpportunityReportsProps {
    opportunities: Opportunity[]
    isAdmin: boolean
}

interface KPICardProps {
    icon: React.ReactNode
    label: string
    value: string
    sub?: string
    color: string
    bg: string
}

const STAGE_COLORS: Record<string, string> = {
    'Em negociação': '#6366f1',
    'Aguardando resposta': '#f59e0b',
    'Mídia Kit pendente': '#8b5cf6',
    'Contrato em elaboração': '#06b6d4',
    'Fechado': '#10b981',
}

function KPICard({ icon, label, value, sub, color, bg }: KPICardProps) {
    return (
        <div className="executive-card p-5 bg-white/80 backdrop-blur-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                    {sub && <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>}
                </div>
                <div className={`p-2 rounded-xl ${bg}`}>{icon}</div>
            </div>
        </div>
    )
}

function daysPending(createdAt: string): number {
    const created = new Date(createdAt)
    const now = new Date()
    const diff = now.getTime() - created.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function OpportunityReports({ opportunities, isAdmin }: OpportunityReportsProps) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Metrics
    const total = opportunities.length
    const awaitingLong = opportunities.filter(
        o => new Date(o.created_at) < sevenDaysAgo && o.stage !== 'Fechado'
    ).length
    const mediaKitPending = opportunities.filter(
        o => o.new_media_target?.toLowerCase().includes('mídia kit') && o.stage !== 'Fechado'
    ).length
    const socialActive = opportunities.filter(o => o.frequency != null && o.frequency !== '').length
    const closed = opportunities.filter(o => o.stage === 'Fechado').length

    // Chart 1: By stage (horizontal bar)
    const stageData = Object.entries(
        opportunities.reduce((acc: Record<string, number>, o) => {
            acc[o.stage] = (acc[o.stage] || 0) + 1
            return acc
        }, {})
    )
        .sort(([, a], [, b]) => b - a)
        .map(([stage, count]) => ({ stage: stage.length > 20 ? stage.slice(0, 19) + '…' : stage, count, fullStage: stage }))

    // Chart 2: Media Kit status (pie)
    const mediaKitData = (() => {
        let pendente = 0, recebido = 0, na = 0
        opportunities.forEach(o => {
            const target = o.new_media_target?.toLowerCase() || ''
            if (target.includes('mídia kit') || target.includes('midia kit')) {
                if (target.includes('pendente')) pendente++
                else recebido++
            } else {
                na++
            }
        })
        return [
            { name: 'Pendente', value: pendente },
            { name: 'Recebido', value: recebido },
            { name: 'N/A', value: na },
        ].filter(d => d.value > 0)
    })()

    const MEDIA_KIT_COLORS = ['#f59e0b', '#10b981', '#94a3b8']

    // Table: longest pending (not closed)
    const pendingTable = opportunities
        .filter(o => o.stage !== 'Fechado')
        .map(o => ({ ...o, days: daysPending(o.created_at) }))
        .sort((a, b) => b.days - a.days)
        .slice(0, 10)

    if (opportunities.length === 0) {
        return (
            <div className="executive-card p-12 bg-white/80 backdrop-blur-md text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Nenhuma oportunidade encontrada com os filtros aplicados</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KPICard
                    icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
                    label="Total"
                    value={String(total)}
                    sub="oportunidades"
                    color="text-indigo-700"
                    bg="bg-indigo-100"
                />
                <KPICard
                    icon={<Clock className="w-4 h-4 text-amber-600" />}
                    label="Aguardando +7d"
                    value={String(awaitingLong)}
                    sub="sem fechamento"
                    color="text-amber-700"
                    bg="bg-amber-100"
                />
                <KPICard
                    icon={<Package className="w-4 h-4 text-violet-600" />}
                    label="Mídia Kit Pend."
                    value={String(mediaKitPending)}
                    sub="em aberto"
                    color="text-violet-700"
                    bg="bg-violet-100"
                />
                <KPICard
                    icon={<Wifi className="w-4 h-4 text-cyan-600" />}
                    label="Social Ativo"
                    value={String(socialActive)}
                    sub="com frequência"
                    color="text-cyan-700"
                    bg="bg-cyan-100"
                />
                <KPICard
                    icon={<AlertTriangle className="w-4 h-4 text-emerald-600" />}
                    label="Fechados"
                    value={String(closed)}
                    sub="concluídos"
                    color="text-emerald-700"
                    bg="bg-emerald-100"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart 1: By stage */}
                <div className="executive-card p-6 bg-white/80 backdrop-blur-md md:col-span-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Oportunidades por Stage
                    </h3>
                    {stageData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stageData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={140} />
                                <Tooltip
                                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                                    formatter={(v: number | undefined) => [v ?? 0, 'Oportunidades']}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Oportunidades">
                                    {stageData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STAGE_COLORS[entry.fullStage] || '#6366f1'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Chart 2: Media Kit status */}
                <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Status Mídia Kit
                    </h3>
                    {mediaKitData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={mediaKitData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {mediaKitData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={MEDIA_KIT_COLORS[index % MEDIA_KIT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number | undefined) => [v ?? 0, 'Oportunidades']}
                                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                                />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Pending Table */}
            <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Aguardando há mais tempo (em aberto)
                    </h3>
                    {isAdmin && (
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Admin</span>
                    )}
                </div>

                {pendingTable.length === 0 ? (
                    <p className="text-sm font-medium text-slate-400 text-center py-6">
                        Nenhuma oportunidade em aberto
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3 pr-4">Shopping</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3 pr-4">Stage</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3 pr-4">Responsável</th>
                                    <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3">Dias</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingTable.map((opp) => (
                                    <tr key={opp.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 pr-4">
                                            <span className="text-xs font-bold text-slate-700">{opp.shopping_name}</span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span
                                                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase"
                                                style={{
                                                    backgroundColor: (STAGE_COLORS[opp.stage] || '#6366f1') + '20',
                                                    color: STAGE_COLORS[opp.stage] || '#6366f1',
                                                }}
                                            >
                                                {opp.stage}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="text-xs font-medium text-slate-500">
                                                {opp.responsible_person || '—'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`text-xs font-black ${opp.days > 7 ? 'text-red-600' : 'text-slate-700'}`}>
                                                {opp.days}d
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
