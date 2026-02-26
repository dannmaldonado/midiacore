'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Search, Download } from 'lucide-react'
import { UserProfileModal } from './UserProfileModal'
import { NotificationsDropdown } from './NotificationsDropdown'

interface SearchResult {
    id: string
    name: string
    type: 'contract' | 'opportunity' | 'contact'
    created_at: string
}

export function Header() {
    const { user, profile, isAdmin } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [showSearchResults, setShowSearchResults] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Profile modal state
    const [showProfileModal, setShowProfileModal] = useState(false)

    // Notifications dropdown state
    const [showNotifications, setShowNotifications] = useState(false)

    // Debounced search
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query)
        setShowSearchResults(true)

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setSearchLoading(true)
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const [contracts, opportunities, contacts] = await Promise.all([
                    supabase
                        .from('contracts')
                        .select('id, shopping_name, created_at')
                        .ilike('shopping_name', `%${query}%`)
                        .limit(8),
                    supabase
                        .from('opportunities')
                        .select('id, shopping_name, created_at')
                        .ilike('shopping_name', `%${query}%`)
                        .limit(8),
                    supabase
                        .from('contacts')
                        .select('id, full_name, created_at')
                        .ilike('full_name', `%${query}%`)
                        .limit(8),
                ])

                interface ContractData {
                    id: string
                    shopping_name: string
                    created_at: string
                }
                interface OpportunityData {
                    id: string
                    shopping_name: string
                    created_at: string
                }
                interface ContactData {
                    id: string
                    full_name: string
                    created_at: string
                }

                const results: SearchResult[] = [
                    ...(contracts.data || [] as ContractData[]).map((c: ContractData) => ({
                        id: c.id,
                        name: c.shopping_name,
                        type: 'contract' as const,
                        created_at: c.created_at,
                    })),
                    ...(opportunities.data || [] as OpportunityData[]).map((o: OpportunityData) => ({
                        id: o.id,
                        name: o.shopping_name,
                        type: 'opportunity' as const,
                        created_at: o.created_at,
                    })),
                    ...(contacts.data || [] as ContactData[]).map((c: ContactData) => ({
                        id: c.id,
                        name: c.full_name,
                        type: 'contact' as const,
                        created_at: c.created_at,
                    })),
                ].slice(0, 8)

                setSearchResults(results)
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setSearchLoading(false)
            }
        }, 300)
    }, [supabase])

    const navigateToResult = (result: SearchResult) => {
        const typeMap = {
            contract: 'contracts',
            opportunity: 'opportunities',
            contact: 'contacts',
        }
        router.push(`/dashboard/${typeMap[result.type]}/${result.id}`)
        setSearchQuery('')
        setShowSearchResults(false)
    }

    const handleBIExport = async () => {
        try {
            const [contracts, opportunities] = await Promise.all([
                supabase.from('contracts').select('*'),
                supabase.from('opportunities').select('*'),
            ])

            const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
                const headers = Object.keys(data[0] || {})
                const csvContent = [
                    headers.join(','),
                    ...data.map(row =>
                        headers.map(h => JSON.stringify(row[h] || '')).join(',')
                    ),
                ].join('\n')

                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = filename
                link.click()
                URL.revokeObjectURL(url)
            }

            const timestamp = new Date().toISOString().split('T')[0]
            exportToCSV(contracts.data || [], `contracts-${timestamp}.csv`)
            exportToCSV(opportunities.data || [], `opportunities-${timestamp}.csv`)
        } catch (error) {
            console.error('Export error:', error)
        }
    }

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.search-container') && !target.closest('.search-results')) {
                setShowSearchResults(false)
            }
            if (!target.closest('.notifications-container')) {
                setShowNotifications(false)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowSearchResults(false)
                setShowNotifications(false)
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    return (
        <>
            <UserProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                profile={profile}
            />

            <header className="h-20 border-b border-white/10 glass-effect flex items-center justify-between px-10 sticky top-0 z-10">
                {/* Search */}
                <div className="relative w-full max-w-md search-container">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Análise rápida de contratos ou ativos..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-slate-600 placeholder:text-slate-400"
                    />

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 search-results">
                            {searchLoading && (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    Procurando...
                                </div>
                            )}
                            {!searchLoading && searchResults.length === 0 && searchQuery && (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    Nenhum resultado encontrado
                                </div>
                            )}
                            {!searchLoading && searchResults.length > 0 && (
                                <div className="divide-y divide-slate-200">
                                    {searchResults.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => navigateToResult(result)}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors text-sm"
                                        >
                                            <p className="font-semibold text-slate-900">{result.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {result.type === 'contract' && 'Contrato'}
                                                {result.type === 'opportunity' && 'Oportunidade'}
                                                {result.type === 'contact' && 'Contato'} • {new Date(result.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    {/* BI Export Button (admin only) */}
                    {isAdmin && (
                        <button
                            onClick={handleBIExport}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all group"
                            title="Exportar BI"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    )}

                    {/* Notifications */}
                    <div className="notifications-container relative">
                        <NotificationsDropdown
                            isOpen={showNotifications}
                            onToggle={() => setShowNotifications(!showNotifications)}
                        />
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900 leading-none font-display">
                                {user?.email?.split('@')[0].toUpperCase() || 'USUÁRIO'}
                            </p>
                            <p className="text-[10px] font-black text-indigo-500 mt-1 uppercase tracking-tighter">
                                Acesso: {profile?.role || 'Executivo'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-white border border-slate-200 flex items-center justify-center text-indigo-600 font-black shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                            {user?.email?.[0].toUpperCase() || 'U'}
                        </button>
                    </div>
                </div>
            </header>
        </>
    )
}
