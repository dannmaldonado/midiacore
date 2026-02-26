'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

interface NotificationItem {
    id: string
    title: string
    description: string
    type: 'contract' | 'opportunity'
    date: string
}

interface NotificationsDropdownProps {
    isOpen: boolean
    onToggle: () => void
}

export function NotificationsDropdown({ isOpen, onToggle }: NotificationsDropdownProps) {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        const fetchNotifications = async () => {
            setLoading(true)
            try {
                const today = new Date()
                const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
                const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

                // 1. Contratos expirando nos próximos 30 dias
                const { data: expiringContracts } = await supabase
                    .from('contracts')
                    .select('id, shopping_name, end_date')
                    .gte('end_date', today.toISOString().split('T')[0])
                    .lte('end_date', in30Days.toISOString().split('T')[0])

                // 2. Contratos com pending_quotes preenchido
                const { data: pendingQuotesContracts } = await supabase
                    .from('contracts')
                    .select('id, shopping_name, pending_quotes')
                    .not('pending_quotes', 'is', null)

                // 3. Oportunidades em stage "Aguardando resposta" > 7 dias
                const { data: waitingOpportunities } = await supabase
                    .from('opportunities')
                    .select('id, shopping_name, stage, created_at')
                    .eq('stage', 'Aguardando resposta')
                    .lte('created_at', in7Days.toISOString())

                const items: NotificationItem[] = []

                interface ContractRecord {
                    id: string
                    shopping_name: string
                    end_date?: string
                    pending_quotes?: string
                }
                interface OpportunityRecord {
                    id: string
                    shopping_name: string
                    created_at: string
                }

                // Add expiring contracts
                expiringContracts?.forEach((contract: ContractRecord) => {
                    items.push({
                        id: `contract-expiring-${contract.id}`,
                        title: `Contrato expirando: ${contract.shopping_name}`,
                        description: `Vence em ${new Date(contract.end_date || '').toLocaleDateString('pt-BR')}`,
                        type: 'contract',
                        date: contract.end_date || '',
                    })
                })

                // Add pending quotes contracts
                pendingQuotesContracts?.forEach((contract: ContractRecord) => {
                    items.push({
                        id: `contract-pending-${contract.id}`,
                        title: `Orçamento pendente: ${contract.shopping_name}`,
                        description: contract.pending_quotes || 'Aguardando confirmação de orçamento',
                        type: 'contract',
                        date: new Date().toISOString(),
                    })
                })

                // Add waiting opportunities
                waitingOpportunities?.forEach((opp: OpportunityRecord) => {
                    items.push({
                        id: `opportunity-waiting-${opp.id}`,
                        title: `Oportunidade aguardando: ${opp.shopping_name}`,
                        description: 'Há mais de 7 dias sem resposta',
                        type: 'opportunity',
                        date: opp.created_at,
                    })
                })

                setNotifications(items)
            } catch (error) {
                console.error('Error fetching notifications:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
    }, [isOpen, supabase])

    const notificationCount = notifications.length

    return (
        <>
            <button
                onClick={onToggle}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl relative transition-all group"
                title="Notificações"
            >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
            </button>

            {/* Notifications Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg z-50">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Notificações</h3>
                        {notificationCount > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                {notificationCount}
                            </span>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                Carregando...
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Sem notificações
                            </div>
                        )}

                        {!loading && notifications.length > 0 && (
                            <div className="divide-y divide-slate-200">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <p className="font-semibold text-slate-900 text-sm">
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1">
                                            {notif.description}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            {new Date(notif.date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
