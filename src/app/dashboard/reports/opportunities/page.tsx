'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Download, BarChart2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { OpportunityReports } from '@/components/dashboard/OpportunityReports'
import { Opportunity } from '@/types'

const STAGE_OPTIONS = [
    'Em negociação',
    'Aguardando resposta',
    'Mídia Kit pendente',
    'Contrato em elaboração',
    'Fechado',
]

export default function OpportunityReportsPage() {
    const { profile, isAdmin } = useAuth()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [filtered, setFiltered] = useState<Opportunity[]>([])

    // Filters
    const [stageFilter, setStageFilter] = useState<string>('all')
    const [shoppingFilter, setShoppingFilter] = useState<string>('')
    const [periodStart, setPeriodStart] = useState<string>('')
    const [periodEnd, setPeriodEnd] = useState<string>('')

    const fetchOpportunities = useCallback(async () => {
        if (!profile?.company_id) return
        setLoading(true)
        try {
            const { data } = await supabase
                .from('opportunities')
                .select('*')
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: false })
            setOpportunities(data || [])
        } finally {
            setLoading(false)
        }
    }, [profile?.company_id, supabase])

    useEffect(() => { fetchOpportunities() }, [fetchOpportunities])

    // Apply filters
    useEffect(() => {
        let result = [...opportunities]

        if (stageFilter !== 'all') {
            result = result.filter(o => o.stage === stageFilter)
        }
        if (shoppingFilter.trim()) {
            result = result.filter(o =>
                o.shopping_name.toLowerCase().includes(shoppingFilter.toLowerCase())
            )
        }
        if (periodStart) {
            result = result.filter(o => o.created_at >= periodStart)
        }
        if (periodEnd) {
            result = result.filter(o => o.created_at.split('T')[0] <= periodEnd)
        }

        setFiltered(result)
    }, [opportunities, stageFilter, shoppingFilter, periodStart, periodEnd])

    const handleExportCSV = () => {
        if (!isAdmin) return

        const headers = ['Shopping', 'Stage', 'Responsável', 'Frequência', 'Social Media Plan', 'Nova Mídia', 'Criado em']
        const rows = filtered.map(o => [
            o.shopping_name,
            o.stage,
            o.responsible_person || '',
            o.frequency || '',
            o.social_media_plan || '',
            o.new_media_target || '',
            new Date(o.created_at).toLocaleDateString('pt-BR'),
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `oportunidades-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 uppercase tracking-widest">Relatório de Oportunidades</h2>
                        <p className="text-slate-500 mt-1 font-medium">Pipeline e previsão · {filtered.length} oportunidades</p>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wide">Stage</label>
                        <select
                            value={stageFilter}
                            onChange={e => setStageFilter(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="all">Todos</option>
                            {STAGE_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wide">Shopping</label>
                        <input
                            type="text"
                            value={shoppingFilter}
                            onChange={e => setShoppingFilter(e.target.value)}
                            placeholder="Filtrar por nome..."
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wide">Criado a partir de</label>
                        <input
                            type="date"
                            value={periodStart}
                            onChange={e => setPeriodStart(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wide">Criado até</label>
                        <input
                            type="date"
                            value={periodEnd}
                            onChange={e => setPeriodEnd(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
                {(stageFilter !== 'all' || shoppingFilter || periodStart || periodEnd) && (
                    <button
                        onClick={() => { setStageFilter('all'); setShoppingFilter(''); setPeriodStart(''); setPeriodEnd('') }}
                        className="mt-3 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wide transition-colors"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Reports Content */}
            <OpportunityReports opportunities={filtered} isAdmin={isAdmin} />
        </div>
    )
}
