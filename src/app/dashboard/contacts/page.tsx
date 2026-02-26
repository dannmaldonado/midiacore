'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Contact } from '@/types'
import { Users, Plus, Search, Copy, Check, Edit2, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

type TabType = 'store_manager' | 'shopping_mkt'

const TABS = [
    { key: 'store_manager' as TabType, label: 'Gerentes de Loja' },
    { key: 'shopping_mkt' as TabType, label: 'MKT Shopping' },
]

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase()
}

export default function ContactsPage() {
    const { profile } = useAuth()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('store_manager')
    const [searchTerm, setSearchTerm] = useState('')
    const [copied, setCopied] = useState<string | null>(null)
    const supabase = createClient()

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

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(field)
            setTimeout(() => setCopied(null), 2000)
        } catch {
            // Clipboard API indisponível
        }
    }

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => {
            const matchesTab = c.contact_type === activeTab
            const term = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm ||
                c.name.toLowerCase().includes(term) ||
                (c.email && c.email.toLowerCase().includes(term)) ||
                (c.shopping_name && c.shopping_name.toLowerCase().includes(term))
            return matchesTab && matchesSearch
        })
    }, [contacts, activeTab, searchTerm])

    const tabCounts = useMemo(() => ({
        store_manager: contacts.filter(c => c.contact_type === 'store_manager').length,
        shopping_mkt: contacts.filter(c => c.contact_type === 'shopping_mkt').length,
    }), [contacts])

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">Contatos</h2>
                    <p className="text-slate-500 mt-2 font-medium">CRM centralizado de gerentes e equipes de marketing.</p>
                </div>
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

            <div className="executive-card">
                {/* Tabs */}
                <div className="flex items-end gap-0 border-b border-slate-100 px-6 pt-6 bg-white/50">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSearchTerm('') }}
                            className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
                                activeTab === tab.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-black ${
                                activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {tabCounts[tab.key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="p-6 border-b border-slate-100 bg-white/50">
                    <div className="relative w-full md:w-80">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou shopping..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-slate-600 font-medium"
                        />
                    </div>
                </div>

                {/* Contact Grid */}
                <div className="p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-32 bg-slate-50 rounded-2xl shimmer" />
                            ))}
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center py-24 max-w-xs mx-auto text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-slate-900 font-black text-lg font-display">Nenhum contato</p>
                            <p className="text-slate-400 text-sm mt-2 font-medium">
                                {searchTerm
                                    ? 'Nenhum resultado para esta busca.'
                                    : `Adicione o primeiro contato desta categoria.`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredContacts.map(contact => (
                                <div key={contact.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-100 transition-all group relative">
                                    {/* Edit button */}
                                    {profile?.role !== 'viewer' && (
                                        <Link
                                            href={`/dashboard/contacts/${contact.id}`}
                                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Link>
                                    )}

                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg shadow-indigo-500/20">
                                            {getInitials(contact.name)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 text-sm truncate">{contact.name}</p>
                                            {contact.shopping_name && (
                                                <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wide truncate mt-0.5">{contact.shopping_name}</p>
                                            )}
                                            {contact.role && (
                                                <p className="text-[11px] text-slate-400 font-medium truncate">{contact.role}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {contact.phone && (
                                            <button
                                                onClick={() => copyToClipboard(contact.phone!, `phone-${contact.id}`)}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-left group/copy"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="text-[12px] font-medium text-slate-600 truncate flex-1">{contact.phone}</span>
                                                {copied === `phone-${contact.id}` ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 text-slate-300 group-hover/copy:text-slate-500 flex-shrink-0 transition-colors" />
                                                )}
                                            </button>
                                        )}
                                        {contact.email && (
                                            <button
                                                onClick={() => copyToClipboard(contact.email!, `email-${contact.id}`)}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-left group/copy"
                                            >
                                                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="text-[12px] font-medium text-slate-600 truncate flex-1">{contact.email}</span>
                                                {copied === `email-${contact.id}` ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 text-slate-300 group-hover/copy:text-slate-500 flex-shrink-0 transition-colors" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
