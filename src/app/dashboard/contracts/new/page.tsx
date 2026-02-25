'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, FileText, BadgeDollarSign, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

export default function NewContractPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        shopping_name: '',
        media_type: '',
        status: 'pending',
        start_date: '',
        end_date: '',
        contract_value: '',
        responsible_person: '',
        notes: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.company_id) return

        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('contracts')
                .insert([{
                    ...formData,
                    company_id: profile.company_id,
                    contract_value: parseFloat(formData.contract_value) || 0
                }])

            if (error) throw error

            router.push('/dashboard/contracts')
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar contrato'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4 mb-10 group">
                <Link
                    href="/dashboard/contracts"
                    className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm group-hover:-translate-x-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display uppercase tracking-widest">Novo Contrato</h2>
                    <p className="text-slate-500 mt-1 font-medium">Registro de ativo de mídia e veiculação.</p>
                </div>
            </div>

            <div className="executive-card p-10 bg-white/80 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Shopping Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados do Ativo</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Shopping / Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.shopping_name}
                                        onChange={(e) => setFormData({ ...formData, shopping_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                        placeholder="Ex: Shopping Iguatemi"
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
                                        placeholder="Ex: Painel Digital LED"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financial & Status */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financeiro & Status</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Valor do Contrato (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.contract_value}
                                        onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                        placeholder="0,00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Status Inicial</label>
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
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        {/* Dates */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Calendar className="w-4 h-4 text-brand-blue" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronograma de Veiculação</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>
                        </div>

                        {/* Responsible */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Users className="w-4 h-4 text-brand-slate" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder</h3>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Gestor Responsável</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.responsible_person}
                                    onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                    placeholder="Nome do gestor"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6">
                        <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Notas Adicionais / Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600 min-h-[120px]"
                            placeholder="Detalhes adicionais sobre a entrega ou bonificações..."
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-black text-red-600 flex items-center gap-3 animate-pulse">
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
                            disabled={loading}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    PROCESSANDO...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    SALVAR CONTRATO
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
