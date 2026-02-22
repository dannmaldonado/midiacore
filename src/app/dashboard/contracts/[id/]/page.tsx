'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Info, Calendar, Trash2 } from 'lucide-react'
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

    const [formData, setFormData] = useState({
        shopping_name: '',
        media_type: '',
        status: 'pending' as Contract['status'],
        start_date: '',
        end_date: '',
        contract_value: '',
        responsible_person: '',
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
                    shopping_name: data.shopping_name,
                    media_type: data.media_type,
                    status: data.status,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    contract_value: data.contract_value.toString(),
                    responsible_person: data.responsible_person,
                    notes: data.notes || ''
                })
                setLoading(false)
            }
        }

        fetchContract()
    }, [profile, contractId, supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
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
                    ...formData,
                    contract_value: parseFloat(formData.contract_value) || 0
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
        if (!window.confirm('Tem certeza que deseja excluir este contrato?')) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('contracts')
                .delete()
                .eq('id', contractId)

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
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/contracts"
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Editar Contrato</h2>
                        <p className="text-slate-500 text-sm">Atualize os detalhes da veiculação.</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-12">
                <div className="executive-card p-8 space-y-8">
                    {/* Identificação */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Info className="w-4 h-4 text-brand-blue" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Identificação</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Shopping</label>
                                <input
                                    required
                                    name="shopping_name"
                                    value={formData.shopping_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-600 font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Tipo de Mídia</label>
                                <input
                                    required
                                    name="media_type"
                                    value={formData.media_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-600 font-medium"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Vigência */}
                    <section className="space-y-6 pt-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <Calendar className="w-4 h-4 text-brand-blue" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Vigência e Valores</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Início</label>
                                <input
                                    required
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-600 font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Término</label>
                                <input
                                    required
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-600 font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Valor Total (R$)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    name="contract_value"
                                    value={formData.contract_value}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-600 font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-600 font-medium"
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="active">Ativo</option>
                                    <option value="expired">Expirado</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Responsável</label>
                                <input
                                    required
                                    name="responsible_person"
                                    value={formData.responsible_person}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-600 font-medium"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Observações */}
                    <section className="space-y-1.5 pt-4">
                        <label className="text-sm font-semibold text-slate-700">Observações</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all resize-none text-slate-600 font-medium"
                        />
                    </section>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            {error}
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Link
                            href="/dashboard/contracts"
                            className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-brand-navy text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-blue transition-all disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-brand-navy/10"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
