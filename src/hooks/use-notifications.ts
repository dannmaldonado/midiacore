'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export interface Notification {
  id: string
  user_id: string
  type: 'approval_assigned' | 'approval_deadline' | 'approval_completed'
  contract_id: string
  step?: string
  payload: {
    deadline?: string
    step?: string
    contract_id?: string
  }
  read_at?: string
  created_at: string
}

const SLA_DAYS = {
  pre_approval: 3,
  financial: 5,
  director: 7,
  legal: 7,
}

export const STEP_LABELS = {
  pre_approval: 'Pré-aprovação',
  financial: 'Financeiro',
  director: 'Diretor',
  legal: 'Legal',
}

/**
 * Calculate days until deadline
 */
export function daysUntilDeadline(deadline: string | null | undefined): number | null {
  if (!deadline) return null
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Check if deadline is urgent (< 24 hours)
 */
export function isDeadlineUrgent(deadline: string | null | undefined): boolean {
  const days = daysUntilDeadline(deadline)
  return days !== null && days < 1
}

/**
 * Check if deadline has passed
 */
export function isDeadlinePassed(deadline: string | null | undefined): boolean {
  const days = daysUntilDeadline(deadline)
  return days !== null && days < 0
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return 'Sem prazo'

  const days = daysUntilDeadline(deadline)
  if (days === null) return 'Data inválida'

  if (days < 0) {
    return `Atrasado por ${Math.abs(days)} dias`
  }

  if (days === 0) {
    return 'Vence hoje'
  }

  if (days === 1) {
    return 'Vence em 1 dia'
  }

  return `Vence em ${days} dias`
}

/**
 * Get SLA days for a step
 */
export function getSLADays(step: string): number {
  return SLA_DAYS[step as keyof typeof SLA_DAYS] || 0
}

/**
 * Get step label
 */
export function getStepLabel(step: string): string {
  return STEP_LABELS[step as keyof typeof STEP_LABELS] || step
}

/**
 * Hook to fetch and subscribe to notifications
 */
export function useNotifications() {
  const { profile } = useAuth()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!profile?.id || !profile?.company_id) return

    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (err) throw err
      setNotifications(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar notificações'
      setError(message)
      console.error('[Notifications] Error fetching:', err)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.company_id, supabase])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!profile?.id || !profile?.company_id) return

    fetchNotifications()

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.id, profile?.company_id, fetchNotifications, supabase])

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!profile?.company_id) return

      try {
        const { error: err } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId)
          .eq('company_id', profile.company_id)

        if (err) throw err

        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
        )
      } catch (err) {
        console.error('[Notifications] Error marking as read:', err)
      }
    },
    [profile?.company_id, supabase]
  )

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read_at).length

  // Get pending approval notifications
  const pendingApprovals = notifications.filter(
    n => n.type === 'approval_assigned' && !n.read_at
  )

  return {
    notifications,
    loading,
    error,
    unreadCount,
    pendingApprovals,
    markAsRead,
    refetch: fetchNotifications,
  }
}
