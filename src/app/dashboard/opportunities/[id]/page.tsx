'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, TrendingUp, Users, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Opportunity } from '@/types'

const STAGE_OPTIONS = [
    'Em negociação',
    'Aguardando resposta',
    'Mídia Kit pendente',
    'Contrato em elaboração',
    'Fechado',
]

const FREQUENCY_OPTIONS = ['Diário', 'Semanal', 'Mensal', 'Sob demanda']

export default function EditOpportunityPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const params = useParams()
    const opportunityId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        client_name: '',
        title: '',
        frequency: '',
        social_media_plan: '',
        new_media_target: '',
        events_plan: '',
        stage: 'Em negociação',
        responsible_person: '',
        notes: ''
    })

    useEffect(() => {
        const fetchOpportunity = async () => {
            if (!profile?.company_id || !opportunityId) return

            const { data, error } = await supabase
                .from('opportunities')
                .select('*')
                .eq('id', opportunityId)
                .eq('company_id', profile.company_id)
                .single()

            if (error) {
                setError('Oportunidade não encontrada ou sem permissão de acesso.')
                setLoading(false)
            } else if (data) {
                const opp = data as Opportunity
                setFormData({
                    client_name: opp.client_name ?? '',
                    title: opp.title ?? '',
                    frequency: opp.frequency ?? '',
                    social_media_plan: opp.social_media_plan ?? '',
                    new_media_target: opp.new_media_target ?? '',
                    events_plan: opp.events_plan ?? '',
                    stage: opp.stage ?? 'Em negociação',
                    responsible_person: opp.responsible_person ?? '',
                    notes: opp.notes ?? ''
                })
                setLoading(false)
            }
        }

        fetchOpportunity()
    }, [profile, opportunityId, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.company_id) return

        setSaving(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('opportunities')
                .update({
                    client_name: formData.client_name,
                    title: formData.title,
                    frequency: formData.frequency || null,
                    social_media_plan: formData.social_media_plan.trim() || null,
                    new_media_target: formData.new_media_target.trim() || null,
                    events_plan: formData.events_plan.trim() || null,
                    stage: formData.stage,
                    responsible_person: formData.responsible_person,
                    notes: formData.notes.trim() || null
                })
                .eq('id', opportunityId)
                .eq('company_id', profile.company_id)

            if (error) throw error

            router.push('/dashboard/opportunities')
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar oportunidade'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', opportunityId)

            if (error) throw error
            router.push('/dashboard/opportunities')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir oportunidade'
            setError(message)
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/opportunities"
                        className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display uppercase tracking-widest">Editar Oportunidade</h2>
                        <p className="text-slate-500 mt-1 font-medium">Gestão detalhada da negociação de mídia.</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-6 py-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-red-100"
                >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                </button>
            </div>

            <div className="executive-card p-10 bg-white/80 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="space-y-10">

                    {/* Seção 1: Identificação */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Shopping / Cliente</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.client_name}
                                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Título / Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
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
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Stage</label>
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
                                placeholder="Liste as novas mídias em negociação..."
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
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Responsável</label>
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
                                    PROCESSANDO...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    ATUALIZAR OPORTUNIDADE
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
