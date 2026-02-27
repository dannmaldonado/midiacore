'use client'

import { TrendingUp, FileText, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react'
import { Contract } from '@/types'
import { StatusPieChart, ExpirationTimelineChart, ValueByShoppingChart } from './ReportCharts'

interface ContractReportsProps {
    contracts: Contract[]
    isAdmin: boolean
}

interface KPICardProps {
    icon: React.ReactNode
    label: string
    value: string
    sub?: string
    color: string
}

function KPICard({ icon, label, value, sub, color }: KPICardProps) {
    return (
        <div className="executive-card p-5 bg-white/80 backdrop-blur-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                    {sub && <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>}
                </div>
                <div className={`p-2 rounded-xl ${color.replace('text-', 'bg-').replace('-700', '-100').replace('-600', '-100')}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

export function ContractReports({ contracts, isAdmin }: ContractReportsProps) {
    // Metrics
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const totalValue = contracts.reduce((sum, c) => sum + c.contract_value, 0)
    const activeCount = contracts.filter(c => c.status === 'active').length
    const expiringSoon = contracts.filter(c => c.end_date >= today && c.end_date <= in30Days).length
    const expiredCount = contracts.filter(c => c.end_date < today).length
    const avgValue = contracts.length > 0 ? totalValue / contracts.length : 0

    // Top 10 shoppings
    const shoppingMap: Record<string, { total: number; count: number }> = {}
    contracts.forEach(c => {
        if (!shoppingMap[c.shopping_name]) {
            shoppingMap[c.shopping_name] = { total: 0, count: 0 }
        }
        shoppingMap[c.shopping_name].total += c.contract_value
        shoppingMap[c.shopping_name].count += 1
    })

    const top10 = Object.entries(shoppingMap)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10)

    if (contracts.length === 0) {
        return (
            <div className="executive-card p-12 bg-white/80 backdrop-blur-md text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Nenhum contrato encontrado com os filtros aplicados</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KPICard
                    icon={<DollarSign className="w-4 h-4 text-indigo-600" />}
                    label="Valor Total"
                    value={`R$ ${(totalValue / 1000).toFixed(0)}k`}
                    sub={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    color="text-indigo-700"
                />
                <KPICard
                    icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
                    label="Ativos"
                    value={String(activeCount)}
                    sub={`de ${contracts.length} contratos`}
                    color="text-emerald-700"
                />
                <KPICard
                    icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
                    label="Vencendo (30d)"
                    value={String(expiringSoon)}
                    sub="próximos 30 dias"
                    color="text-amber-700"
                />
                <KPICard
                    icon={<FileText className="w-4 h-4 text-red-600" />}
                    label="Expirados"
                    value={String(expiredCount)}
                    sub="com end_date passado"
                    color="text-red-700"
                />
                <KPICard
                    icon={<TrendingUp className="w-4 h-4 text-violet-600" />}
                    label="Valor Médio"
                    value={`R$ ${(avgValue / 1000).toFixed(1)}k`}
                    sub="por contrato"
                    color="text-violet-700"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Contratos por Status
                    </h3>
                    <StatusPieChart contracts={contracts} />
                </div>

                <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Timeline de Vencimentos
                    </h3>
                    <ExpirationTimelineChart contracts={contracts} />
                </div>

                <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Valores por Shopping
                    </h3>
                    <ValueByShoppingChart contracts={contracts} />
                </div>
            </div>

            {/* Top 10 Table */}
            <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Top 10 Shoppings — Maior Valor Total
                    </h3>
                    {isAdmin && (
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
                            Admin
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3 pr-4">#</th>
                                <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3 pr-4">Shopping</th>
                                <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3 pr-4">Contratos</th>
                                <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-wide pb-3">Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top10.map(([name, { total, count }], index) => (
                                <tr key={name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pr-4">
                                        <span className={`text-[10px] font-black ${index < 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className="text-xs font-bold text-slate-700">{name}</span>
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                        <span className="text-xs font-bold text-slate-500">{count}</span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="text-xs font-black text-slate-800">
                                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
