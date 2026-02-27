'use client'

import {
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'
import { Contract } from '@/types'

interface ReportChartsProps {
    contracts: Contract[]
}

const STATUS_COLORS: Record<string, string> = {
    active: '#10b981',
    pending: '#f59e0b',
    expired: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
    active: 'Ativo',
    pending: 'Pendente',
    expired: 'Expirado',
}

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function StatusPieChart({ contracts }: ReportChartsProps) {
    const data = Object.entries(
        contracts.reduce((acc: Record<string, number>, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1
            return acc
        }, {})
    ).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        status,
    }))

    if (data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Sem dados
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Contratos']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

export function ExpirationTimelineChart({ contracts }: ReportChartsProps) {
    // Group by year-month of end_date
    const monthMap: Record<string, number> = {}
    contracts.forEach(c => {
        const d = new Date(c.end_date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthMap[key] = (monthMap[key] || 0) + 1
    })

    const data = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => {
            const [year, m] = month.split('-')
            const label = new Date(Number(year), Number(m) - 1).toLocaleDateString('pt-BR', {
                month: 'short',
                year: '2-digit',
            })
            return { month: label, contratos: count }
        })

    if (data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Sem dados
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorContratos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area
                    type="monotone"
                    dataKey="contratos"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorContratos)"
                    name="Contratos"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export function ValueByShoppingChart({ contracts }: ReportChartsProps) {
    const shoppingMap: Record<string, number> = {}
    contracts.forEach(c => {
        shoppingMap[c.shopping_name] = (shoppingMap[c.shopping_name] || 0) + c.contract_value
    })

    const data = Object.entries(shoppingMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({
            shopping: name.length > 14 ? name.slice(0, 13) + '…' : name,
            valor: value,
        }))

    if (data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Sem dados
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                    dataKey="shopping"
                    tick={{ fontSize: 9 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                />
                <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                />
                <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v: number | undefined) =>
                        [`R$ ${(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']
                    }
                />
                <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} name="Valor" />
            </BarChart>
        </ResponsiveContainer>
    )
}
