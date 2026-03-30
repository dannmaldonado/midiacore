'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

const STAGE_OPTIONS = [
    'Em negociação',
    'Aguardando resposta',
    'Mídia Kit pendente',
    'Contrato em elaboração',
    'Fechado',
]

const FREQUENCY_OPTIONS = ['Diário', 'Semanal', 'Mensal', 'Sob demanda']

interface Company {
    id: string
    company_name: string
}

export default function NewOpportunityPage() {
    const router = useRouter()
    const supabase = createClient()

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [companies, setCompanies] = useState<Company[]>([])
    const [loadingCompanies, setLoadingCompanies] = useState(true)

    const [formData, setFormData] = useState({
        shopping_name: '',
        frequency: '',
        social_media_plan: '',
        new_media_target: '',
        events_plan: '',
        stage: 'Em negociação',
        responsible_person: '',
        notes: '',
        company_id: ''
    })

    // ✅ Carregar lista de companies ao montar
    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('id, company_name')
                    .order('company_name')

                if (error) throw error
                setCompanies(data || [])
            } catch (err) {
                console.error('Erro ao carregar companies:', err)
                setError('Erro ao carregar lista de clientes')
            } finally {
                setLoadingCompanies(false)
            }
        }

        loadCompanies()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // ✅ Validate that company is selected
        if (!formData.company_id) {
            setError('Erro: Selecione um cliente/shopping para prosseguir.')
            return
        }

        // ✅ Update state AFTER validation
        setSaving(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('opportunities')
                .insert({
                    company_id: formData.company_id,
                    shopping_name: formData.shopping_name,
                    frequency: formData.frequency || null,
                    social_media_plan: formData.social_media_plan.trim() || null,
                    new_media_target: formData.new_media_target.trim() || null,
                    events_plan: formData.events_plan.trim() || null,
                    stage: formData.stage,
                    responsible_person: formData.responsible_person,
                    notes: formData.notes.trim() || null
                })

            if (error) throw error

            router.push('/dashboard/opportunities')
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar oportunidade'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4 mb-10">
                <Link
                    href="/dashboard/opportunities"
                    className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display uppercase tracking-widest">Nova Oportunidade</h2>
                    <p className="text-slate-500 mt-1 font-medium">Registre uma nova negociação de mídia no pipeline.</p>
                </div>
            </div>

            <div className="executive-card p-10 bg-white/80 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="space-y-10">

                    {/* Seção 1: Identificação */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</h3>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Cliente / Empresa *</label>
                            <select
                                required
                                value={formData.company_id}
                                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                disabled={loadingCompanies}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700 appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">— Selecione um cliente —</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>{company.company_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Shopping / Mídia *</label>
                            <input
                                type="text"
                                required
                                value={formData.shopping_name}
                                onChange={(e) => setFormData({ ...formData, shopping_name: e.target.value })}
                                placeholder="Ex: Shopping Tietê Plaza"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Frequência de Conteúdo</label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600 appearance-none cursor-pointer"
                                >
                                    <option value="">— Sem frequência definida —</option>
                                    {FREQUENCY_OPTIONS.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Stage *</label>
                                <select
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                >
                                    {STAGE_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Seção 2: Planos de Mídia */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planos de Mídia</h3>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Plano de Redes Sociais</label>
                            <textarea
                                value={formData.social_media_plan}
                                onChange={(e) => setFormData({ ...formData, social_media_plan: e.target.value })}
                                placeholder="Descreva o plano de conteúdo para redes sociais..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600 min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Novas Mídias a Contratar</label>
                            <textarea
                                value={formData.new_media_target}
                                onChange={(e) => setFormData({ ...formData, new_media_target: e.target.value })}
                                placeholder="Liste as novas mídias em negociação (ex: Mídia Kit pendente, Aguardando proposta)..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600 min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Programação de Eventos</label>
                            <textarea
                                value={formData.events_plan}
                                onChange={(e) => setFormData({ ...formData, events_plan: e.target.value })}
                                placeholder="Descreva eventos previstos ou em negociação..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600 min-h-[100px]"
                            />
                        </div>
                    </div>

                    {/* Seção 3: Stakeholder */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder & Notas</h3>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Responsável *</label>
                            <input
                                type="text"
                                required
                                value={formData.responsible_person}
                                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Notas / Observações</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600 min-h-[80px]"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-black text-red-600 flex items-center gap-3">
                            <span className="w-2 h-2 bg-red-600 rounded-full" />
                            {error.toUpperCase()}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
                        <Link
                            href="/dashboard/opportunities"
                            className="px-8 py-4 text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                        >
                            CANCELAR
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    SALVANDO...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    CRIAR OPORTUNIDADE
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
