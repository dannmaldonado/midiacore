'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Contact } from '@/types'
import { Users, Plus, Search, Edit2, Mail, Phone, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 50

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
    store_manager: { label: 'Gerente de Loja', className: 'bg-blue-100 text-blue-700' },
    shopping_mkt:  { label: 'MKT Shopping',    className: 'bg-purple-100 text-purple-700' },
}

function exportCSV(contacts: Contact[]) {
    const BOM = '\uFEFF'
    const headers = ['Nome', 'Shopping', 'Tipo', 'Telefone', 'Email', 'Criado em']
    const rows = contacts.map(c => [
        c.name,
        c.shopping_name || '',
        c.contact_type === 'store_manager' ? 'Gerente de Loja' : 'MKT Shopping',
        c.phone || '',
        c.email || '',
        new Date(c.created_at).toLocaleDateString('pt-BR'),
    ])
    const csv = BOM + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contatos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

export default function ContactsPage() {
    const { profile } = useAuth()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const supabase = createClient()

    const isAdmin = profile?.role === 'admin'

    useEffect(() => {
        const fetchContacts = async () => {
            if (!profile?.company_id) return

            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('company_id', profile.company_id)
                .order('name', { ascending: true })

            if (!error && data) {
                setContacts(data as Contact[])
            }
            setLoading(false)
        }

        fetchContacts()
    }, [profile, supabase])

    const filteredContacts = useMemo(() => {
        const term = searchTerm.toLowerCase()
        if (!term) return contacts
        return contacts.filter(c =>
            c.name.toLowerCase().includes(term) ||
            (c.email && c.email.toLowerCase().includes(term)) ||
            (c.shopping_name && c.shopping_name.toLowerCase().includes(term))
        )
    }, [contacts, searchTerm])

    // Reset page when search changes
    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(1)
    }

    const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE))
    const paginatedContacts = filteredContacts.length > PAGE_SIZE
        ? filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        : filteredContacts

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">Contatos</h2>
                    <p className="text-slate-500 mt-2 font-medium">
                        CRM centralizado — {contacts.length} contato{contacts.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => exportCSV(filteredContacts)}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            EXPORTAR CSV
                        </button>
                    )}
                    {profile?.role !== 'viewer' && (
                        <Link
                            href="/dashboard/contacts/new"
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            NOVO CONTATO
                        </Link>
                    )}
                </div>
            </div>

            <div className="executive-card bg-white/80 backdrop-blur-md">
                {/* Search */}
                <div className="p-6 border-b border-slate-100">
                    <div className="relative w-full md:w-96">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nome, e-mail ou shopping..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-slate-600 font-medium"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-12 bg-slate-50 rounded-xl shimmer" />
                        ))}
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center py-24 max-w-xs mx-auto text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                            <Users className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-900 font-black text-lg font-display">Nenhum contato</p>
                        <p className="text-slate-400 text-sm mt-2 font-medium">
                            {searchTerm ? 'Nenhum resultado para esta busca.' : 'Adicione o primeiro contato.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wide">Nome</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wide">Shopping</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wide">Tipo</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wide">Telefone</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wide">E-mail</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedContacts.map(contact => {
                                        const badge = TYPE_BADGE[contact.contact_type] ?? TYPE_BADGE.store_manager
                                        return (
                                            <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                                                    {contact.role && (
                                                        <p className="text-[11px] text-slate-400 font-medium">{contact.role}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-slate-600">{contact.shopping_name || '—'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${badge.className}`}>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {contact.phone ? (
                                                        <a
                                                            href={`tel:${contact.phone}`}
                                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                                        >
                                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                            {contact.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-300 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {contact.email ? (
                                                        <a
                                                            href={`mailto:${contact.email}`}
                                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                                        >
                                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                            {contact.email}
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-300 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {profile?.role !== 'viewer' && (
                                                        <Link
                                                            href={`/dashboard/contacts/${contact.id}`}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredContacts.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                                <p className="text-[11px] font-medium text-slate-400">
                                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredContacts.length)} de {filteredContacts.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-[11px] font-black text-slate-600 px-2">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
