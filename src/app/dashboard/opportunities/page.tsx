'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Opportunity } from '@/types'
import { TrendingUp, Plus, Filter, Search, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { OpportunityModal } from '@/components/dashboard/OpportunityModal'

const STAGE_OPTIONS = [
    'Em negociação',
    'Aguardando resposta',
    'Mídia Kit pendente',
    'Contrato em elaboração',
    'Fechado',
]

export default function OpportunitiesPage() {
    const { profile } = useAuth()
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [stageFilter, setStageFilter] = useState('all')
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchOpportunities = async () => {
            if (!profile?.company_id) return

            const { data, error } = await supabase
                .from('opportunities')
                .select('*')
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setOpportunities(data as Opportunity[])
            }
            setLoading(false)
        }

        fetchOpportunities()
    }, [profile, supabase])

    const filteredOpportunities = useMemo(() => {
        return opportunities.filter(opp => {
            const matchesSearch =
                opp.shopping_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (opp.responsible_person && opp.responsible_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (opp.notes && opp.notes.toLowerCase().includes(searchTerm.toLowerCase()))

            const matchesStage = stageFilter === 'all' || opp.stage === stageFilter

            return matchesSearch && matchesStage
        })
    }, [opportunities, searchTerm, stageFilter])

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">Oportunidades</h2>
                    <p className="text-slate-500 mt-2 font-medium">Pipeline de negociações de mídia por shopping center.</p>
                </div>
                {profile?.role !== 'viewer' && (
                    <Link
                        href="/dashboard/opportunities/new"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        NOVA OPORTUNIDADE
                    </Link>
                )}
            </div>

            <div className="executive-card">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
                        <div className="relative w-full md:w-80">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar shopping ou título..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-slate-600 font-medium"
                            />
                        </div>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Filter className="w-3.5 h-3.5" />
                            </span>
                            <select
                                value={stageFilter}
                                onChange={(e) => setStageFilter(e.target.value)}
                                className="pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 appearance-none text-slate-600 cursor-pointer"
                            >
                                <option value="all">TODOS OS STAGES</option>
                                {STAGE_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        Total: <span className="text-indigo-600">{filteredOpportunities.length}</span> / {opportunities.length}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shopping / Título</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stage</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-8 py-6">
                                            <div className="h-6 bg-slate-50 rounded-lg shimmer w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredOpportunities.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center max-w-xs mx-auto">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                                <TrendingUp className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="text-slate-900 font-black text-lg font-display">Nenhuma oportunidade</p>
                                            <p className="text-slate-400 text-sm mt-2 font-medium">
                                                Inicie o pipeline adicionando uma nova oportunidade.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOpportunities.map((opp) => (
                                    <tr key={opp.id} onClick={() => setSelectedOpportunity(opp)} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm">{opp.shopping_name}</span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {(opp.new_media_target?.toLowerCase().includes('mídia kit') ||
                                                        opp.new_media_target?.toLowerCase().includes('aguardando')) && (
                                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase">
                                                            Mídia Kit Pendente
                                                        </span>
                                                    )}
                                                    {opp.frequency && (
                                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase">
                                                            Social Ativo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                {opp.frequency || <span className="text-slate-300">—</span>}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-slate-600 text-sm font-bold">{opp.responsible_person}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setStageFilter(opp.stage)
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm bg-slate-50 text-slate-600 border-slate-200 cursor-pointer hover:shadow-md transition-all"
                                                >
                                                    {opp.stage}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {profile?.role !== 'viewer' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedOpportunity(opp)
                                                    }}
                                                    className="inline-flex items-center justify-center w-10 h-10 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Opportunity Modal */}
            {selectedOpportunity && (
                <OpportunityModal
                    opportunity={selectedOpportunity}
                    onClose={() => setSelectedOpportunity(null)}
                    onSave={(updatedOpp) => {
                        setOpportunities(opportunities.map(o => o.id === updatedOpp.id ? updatedOpp : o))
                    }}
                    onDelete={(id) => {
                        setOpportunities(opportunities.filter(o => o.id !== id))
                    }}
                    onFilterByStage={(stage) => {
                        setStageFilter(stage)
                    }}
                />
            )}
        </div>
    )
}
