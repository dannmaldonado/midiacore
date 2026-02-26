'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, FileText, BadgeDollarSign, Calendar, Users, Tag, X, Link2, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Contract } from '@/types'

export default function EditContractPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const params = useParams()
    const contractId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newMediaProp, setNewMediaProp] = useState('')

    const [formData, setFormData] = useState({
        shopping_name: '',
        media_type: '',
        media_properties: [] as string[],
        status: 'pending' as Contract['status'],
        contract_value: '',
        pending_quotes: '',
        contract_docs: '',
        layouts_url: '',
        start_date: '',
        end_date: '',
        negotiation: '',
        responsible_person: '',
        comments: '',
        notes: ''
    })

    useEffect(() => {
        const fetchContract = async () => {
            if (!profile?.company_id || !contractId) return

            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .eq('company_id', profile.company_id)
                .single()

            if (error) {
                setError('Contrato não encontrado ou sem permissão de acesso.')
                setLoading(false)
            } else if (data) {
                setFormData({
                    shopping_name: data.shopping_name ?? '',
                    media_type: data.media_type ?? '',
                    media_properties: data.media_properties ?? [],
                    status: data.status,
                    contract_value: data.contract_value.toString(),
                    pending_quotes: data.pending_quotes ?? '',
                    contract_docs: data.contract_docs ?? '',
                    layouts_url: data.layouts_url ?? '',
                    start_date: data.start_date ?? '',
                    end_date: data.end_date ?? '',
                    negotiation: data.negotiation ?? '',
                    responsible_person: data.responsible_person ?? '',
                    comments: data.comments ?? '',
                    notes: data.notes ?? ''
                })
                setLoading(false)
            }
        }

        fetchContract()
    }, [profile, contractId, supabase])

    const addMediaProp = () => {
        const trimmed = newMediaProp.trim()
        if (trimmed && !formData.media_properties.includes(trimmed)) {
            setFormData(prev => ({ ...prev, media_properties: [...prev.media_properties, trimmed] }))
        }
        setNewMediaProp('')
    }

    const removeMediaProp = (item: string) => {
        setFormData(prev => ({ ...prev, media_properties: prev.media_properties.filter(p => p !== item) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.company_id) return

        setSaving(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('contracts')
                .update({
                    shopping_name: formData.shopping_name,
                    media_type: formData.media_type,
                    media_properties: formData.media_properties.length > 0 ? formData.media_properties : null,
                    status: formData.status,
                    contract_value: parseFloat(formData.contract_value) || 0,
                    pending_quotes: formData.pending_quotes.trim() || null,
                    contract_docs: formData.contract_docs.trim() || null,
                    layouts_url: formData.layouts_url.trim() || null,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    negotiation: formData.negotiation.trim() || null,
                    responsible_person: formData.responsible_person,
                    comments: formData.comments.trim() || null,
                    notes: formData.notes.trim() || null
                })
                .eq('id', contractId)
                .eq('company_id', profile.company_id)

            if (error) throw error

            router.push('/dashboard/contracts')
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar contrato'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!profile?.company_id) return
        if (!window.confirm('Tem certeza que deseja excluir este contrato?')) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('contracts')
                .delete()
                .eq('id', contractId)
                .eq('company_id', profile.company_id)

            if (error) throw error
            router.push('/dashboard/contracts')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir contrato'
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
                        href="/dashboard/contracts"
                        className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display uppercase tracking-widest">Editar Registro</h2>
                        <p className="text-slate-500 mt-1 font-medium">Gestão detalhada do ativo de mídia.</p>
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

                    {/* Seção 1: Dados do Ativo */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados do Ativo</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Shopping / Cliente</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.shopping_name}
                                    onChange={(e) => setFormData({ ...formData, shopping_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Tipo de Mídia</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.media_type}
                                    onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Propriedades de Mídia</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMediaProp}
                                    onChange={(e) => setNewMediaProp(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMediaProp() } }}
                                    placeholder="Ex: Empena, Totem Digital, Placa..."
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={addMediaProp}
                                    className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                                >
                                    <Tag className="w-4 h-4" />
                                </button>
                            </div>
                            {formData.media_properties.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.media_properties.map((prop) => (
                                        <span key={prop} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-black uppercase tracking-wide border border-indigo-100">
                                            {prop}
                                            <button type="button" onClick={() => removeMediaProp(prop)} className="hover:text-red-500 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seção 2: Financeiro & Status */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financeiro & Status</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Valor do Contrato (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.contract_value}
                                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Status Atual</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'pending' | 'expired' })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                >
                                    <option value="pending">PENDENTE</option>
                                    <option value="active">ATIVO</option>
                                    <option value="expired">EXPIRADO</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Orçamentos Pendentes</label>
                            <input
                                type="text"
                                value={formData.pending_quotes}
                                onChange={(e) => setFormData({ ...formData, pending_quotes: e.target.value })}
                                placeholder="Descreva orçamentos em aberto..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                            />
                        </div>
                    </div>

                    {/* Seção 3: Documentação */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Link2 className="w-4 h-4 text-blue-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Contrato / PI / OS (URL)</label>
                                {formData.contract_docs && (
                                    <a
                                        href={formData.contract_docs}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[11px] font-black text-indigo-600 hover:text-indigo-800 mb-2 uppercase tracking-wide transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Abrir documento
                                    </a>
                                )}
                                <input
                                    type="url"
                                    value={formData.contract_docs}
                                    onChange={(e) => setFormData({ ...formData, contract_docs: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Layouts (URL)</label>
                                {formData.layouts_url && (
                                    <a
                                        href={formData.layouts_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[11px] font-black text-indigo-600 hover:text-indigo-800 mb-2 uppercase tracking-wide transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Abrir layouts
                                    </a>
                                )}
                                <input
                                    type="url"
                                    value={formData.layouts_url}
                                    onChange={(e) => setFormData({ ...formData, layouts_url: e.target.value })}
                                    placeholder="https://slides.google.com/..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção 4: Cronograma */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronograma de Veiculação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Data Início</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Data Fim</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Tipo de Negociação</label>
                                <input
                                    type="text"
                                    value={formData.negotiation}
                                    onChange={(e) => setFormData({ ...formData, negotiation: e.target.value })}
                                    placeholder="Ex: Renovação, Negociação Direta..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção 5: Stakeholder & Notas */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder & Notas</h3>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Gestor Responsável</label>
                            <input
                                type="text"
                                required
                                value={formData.responsible_person}
                                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Comentários / Observações</label>
                            <textarea
                                value={formData.comments}
                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                placeholder="Observações gerais sobre o contrato..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600 min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Notas Adicionais</label>
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
                            href="/dashboard/contracts"
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
                                    ATUALIZAR REGISTRO
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
