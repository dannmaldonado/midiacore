'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Contract, Opportunity } from '@/types'

export interface SparklinePoint {
    week: string
    value: number
}

export interface TrendingInfo {
    pct: number
    direction: 'up' | 'down' | 'flat'
}

export interface DashboardMetrics {
    contracts: Contract[]
    opportunities: Opportunity[]
    // KPI values
    activeContracts: number
    totalRevenue: number
    expiringSoon: number
    openOpportunities: number
    mediaKitPct: number

    // Trending vs last month
    trendingActive: TrendingInfo
    trendingRevenue: TrendingInfo
    trendingExpiring: TrendingInfo
    trendingOpportunities: TrendingInfo

    // Sparklines (last 4 weeks)
    sparkActive: SparklinePoint[]
    sparkRevenue: SparklinePoint[]
    sparkExpiring: SparklinePoint[]
    sparkOpportunities: SparklinePoint[]

    // Tables
    upcomingExpirations: Contract[]
    waitingOpportunities: (Opportunity & { days: number })[]

    loading: boolean
}

function calcTrending(current: number, previous: number): TrendingInfo {
    if (previous === 0) {
        return { pct: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'flat' }
    }
    const pct = Math.round(((current - previous) / previous) * 100)
    return {
        pct: Math.abs(pct),
        direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
    }
}

function buildWeeklySparkline(
    items: { date: string; value: number }[],
    weeksBack = 4
): SparklinePoint[] {
    const now = new Date()
    const result: SparklinePoint[] = []

    for (let i = weeksBack - 1; i >= 0; i--) {
        const weekEnd = new Date(now)
        weekEnd.setDate(now.getDate() - i * 7)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekEnd.getDate() - 6)

        const weekStartStr = weekStart.toISOString().split('T')[0]
        const weekEndStr = weekEnd.toISOString().split('T')[0]

        const total = items
            .filter(item => item.date >= weekStartStr && item.date <= weekEndStr)
            .reduce((sum, item) => sum + item.value, 0)

        const label = `Sem ${weeksBack - i}`
        result.push({ week: label, value: total })
    }

    return result
}

export function useDashboardMetrics(): DashboardMetrics {
    const { profile } = useAuth()
    const supabase = createClient()

    const [contracts, setContracts] = useState<Contract[]>([])
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        if (!profile?.company_id) return
        setLoading(true)
        try {
            const [cResult, oResult] = await Promise.all([
                supabase.from('contracts').select('*').eq('company_id', profile.company_id),
                supabase.from('opportunities').select('*').eq('company_id', profile.company_id),
            ])
            if (!cResult.error && cResult.data) setContracts(cResult.data as Contract[])
            if (!oResult.error && oResult.data) setOpportunities(oResult.data as Opportunity[])
        } finally {
            setLoading(false)
        }
    }, [profile?.company_id, supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const metrics = useMemo(() => {
        const now = new Date()
        const today = now.toISOString().split('T')[0]

        // Month boundaries
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

        const in30Days = new Date(now)
        in30Days.setDate(now.getDate() + 30)
        const in30DaysStr = in30Days.toISOString().split('T')[0]

        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(now.getDate() - 7)

        // --- KPIs current ---
        const activeContracts = contracts.filter(c => c.status === 'active').length
        const totalRevenue = contracts.reduce((sum, c) => sum + (Number(c.contract_value) || 0), 0)
        const expiringSoon = contracts.filter(c => c.end_date >= today && c.end_date <= in30DaysStr).length
        const openOpps = opportunities.filter(o => o.stage !== 'Fechado')
        const openOpportunities = openOpps.length
        const withMediaKit = openOpps.filter(o =>
            o.new_media_target?.toLowerCase().includes('mídia kit') ||
            o.new_media_target?.toLowerCase().includes('midia kit')
        ).length
        const mediaKitPct = openOpportunities > 0 ? Math.round((withMediaKit / openOpportunities) * 100) : 0

        // --- KPIs last month (for trending) ---
        const activeLastMonth = contracts.filter(c =>
            c.status === 'active' &&
            c.start_date >= lastMonthStart && c.start_date <= lastMonthEnd
        ).length
        const activeThisMonth = contracts.filter(c =>
            c.status === 'active' && c.start_date >= thisMonthStart
        ).length

        const revenueLastMonth = contracts
            .filter(c => c.start_date >= lastMonthStart && c.start_date <= lastMonthEnd)
            .reduce((sum, c) => sum + (Number(c.contract_value) || 0), 0)
        const revenueThisMonth = contracts
            .filter(c => c.start_date >= thisMonthStart)
            .reduce((sum, c) => sum + (Number(c.contract_value) || 0), 0)

        const expiringLastMonth = contracts.filter(c => c.end_date >= lastMonthStart && c.end_date <= lastMonthEnd).length
        const expiringThisMonth = contracts.filter(c => c.end_date >= thisMonthStart && c.end_date <= in30DaysStr).length

        const oppsLastMonth = opportunities.filter(o =>
            o.created_at >= lastMonthStart && o.created_at <= lastMonthEnd && o.stage !== 'Fechado'
        ).length
        const oppsThisMonth = opportunities.filter(o =>
            o.created_at >= thisMonthStart && o.stage !== 'Fechado'
        ).length

        // --- Trending ---
        const trendingActive = calcTrending(activeThisMonth, activeLastMonth)
        const trendingRevenue = calcTrending(revenueThisMonth, revenueLastMonth)
        const trendingExpiring = calcTrending(expiringThisMonth, expiringLastMonth)
        const trendingOpportunities = calcTrending(oppsThisMonth, oppsLastMonth)

        // --- Sparklines ---
        const sparkActive = buildWeeklySparkline(
            contracts.filter(c => c.status === 'active').map(c => ({ date: c.start_date, value: 1 }))
        )
        const sparkRevenue = buildWeeklySparkline(
            contracts.map(c => ({ date: c.start_date, value: Number(c.contract_value) || 0 }))
        )
        const sparkExpiring = buildWeeklySparkline(
            contracts.map(c => ({ date: c.end_date, value: 1 }))
        )
        const sparkOpportunities = buildWeeklySparkline(
            opportunities.filter(o => o.stage !== 'Fechado').map(o => ({
                date: o.created_at.split('T')[0],
                value: 1,
            }))
        )

        // --- Tables ---
        const upcomingExpirations = contracts
            .filter(c => c.end_date >= today && c.end_date <= in30DaysStr)
            .sort((a, b) => a.end_date.localeCompare(b.end_date))
            .slice(0, 5)

        const waitingOpportunities = opportunities
            .filter(o => o.stage !== 'Fechado' && new Date(o.created_at) < sevenDaysAgo)
            .map(o => ({
                ...o,
                days: Math.floor((now.getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            }))
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .slice(0, 5)

        return {
            activeContracts,
            totalRevenue,
            expiringSoon,
            openOpportunities,
            mediaKitPct,
            trendingActive,
            trendingRevenue,
            trendingExpiring,
            trendingOpportunities,
            sparkActive,
            sparkRevenue,
            sparkExpiring,
            sparkOpportunities,
            upcomingExpirations,
            waitingOpportunities,
        }
    }, [contracts, opportunities])

    return { ...metrics, loading, contracts, opportunities }
}
