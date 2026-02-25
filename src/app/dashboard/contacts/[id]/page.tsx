'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Users, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Contact } from '@/types'

export default function EditContactPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const params = useParams()
    const contactId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        contact_type: 'store_manager' as 'store_manager' | 'shopping_mkt',
        shopping_name: '',
        name: '',
        role: '',
        company_name: '',
        phone: '',
        email: ''
    })

    useEffect(() => {
        const fetchContact = async () => {
            if (!profile?.company_id || !contactId) return

            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', contactId)
                .eq('company_id', profile.company_id)
                .single()

            if (error) {
                setError('Contato não encontrado ou sem permissão de acesso.')
                setLoading(false)
            } else if (data) {
                const contact = data as Contact
                setFormData({
                    contact_type: contact.contact_type ?? 'store_manager',
                    shopping_name: contact.shopping_name ?? '',
                    name: contact.name ?? '',
                    role: contact.role ?? '',
                    company_name: contact.company_name ?? '',
                    phone: contact.phone ?? '',
                    email: contact.email ?? ''
                })
                setLoading(false)
            }
        }

        fetchContact()
    }, [profile, contactId, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.company_id) return

        setSaving(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('contacts')
                .update({
                    contact_type: formData.contact_type,
                    shopping_name: formData.shopping_name.trim() || null,
                    name: formData.name,
                    role: formData.role.trim() || null,
                    company_name: formData.company_name.trim() || null,
                    phone: formData.phone.trim() || null,
                    email: formData.email.trim() || null
                })
                .eq('id', contactId)
                .eq('company_id', profile.company_id)

            if (error) throw error

            router.push('/dashboard/contacts')
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar contato'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este contato?')) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', contactId)

            if (error) throw error
            router.push('/dashboard/contacts')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir contato'
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
        <div className="max-w-2xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/contacts"
                        className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display uppercase tracking-widest">Editar Contato</h2>
                        <p className="text-slate-500 mt-1 font-medium">Atualize as informações do contato.</p>
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
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Tipo de contato */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Contato</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {([
                                { value: 'store_manager', label: 'Gerente de Loja', desc: 'Contato interno Lojas Torra' },
                                { value: 'shopping_mkt', label: 'MKT Shopping', desc: 'Equipe de marketing do shopping' },
                            ] as { value: 'store_manager' | 'shopping_mkt'; label: string; desc: string }[]).map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, contact_type: option.value })}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                        formData.contact_type === option.value
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    <p className={`text-[11px] font-black uppercase tracking-wide ${
                                        formData.contact_type === option.value ? 'text-indigo-700' : 'text-slate-600'
                                    }`}>{option.label}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">{option.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dados do contato */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados do Contato</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Shopping</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.shopping_name}
                                    onChange={(e) => setFormData({ ...formData, shopping_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Cargo / Função</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Empresa</label>
                                <input
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Telefone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-medium text-slate-600"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-black text-red-600 flex items-center gap-3">
                            <span className="w-2 h-2 bg-red-600 rounded-full" />
                            {error.toUpperCase()}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                        <Link
                            href="/dashboard/contacts"
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
                                    ATUALIZAR CONTATO
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
