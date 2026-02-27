'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Contract, ApprovalWorkflow } from '@/types'
import { PrazosEtapas, PRAZOS_ETAPAS } from '@/components/dashboard/PrazosEtapas'

// Labels for internal workflow steps (Story 3.1) + Prazos steps
const STEP_LABELS: Record<string, string> = {
    pre_approval: 'Pré-aprovação',
    financial: 'Financeiro',
    director: 'Diretor',
    legal: 'Legal',
    ...Object.fromEntries(PRAZOS_ETAPAS.map(e => [e.id, e.label])),
}

export default function PrazosPage() {
    const { profile } = useAuth()
    const supabase = createClient()

    const [contracts, setContracts] = useState<Contract[]>([])
    const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!profile?.company_id) return
            setLoading(true)
            try {
                const { data: contractsData } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .eq('status', 'active')
                    .order('end_date', { ascending: true })

                setContracts(contractsData || [])

                if (contractsData && contractsData.length > 0) {
                    const contractIds = contractsData.map((c: Contract) => c.id)
                    const { data: workflowsData } = await supabase
                        .from('approval_workflows')
                        .select('*')
                        .in('contract_id', contractIds)
                        .eq('step_status', 'pending')
                        .order('created_at', { ascending: false })

                    setWorkflows(workflowsData || [])
                }
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [profile?.company_id, supabase])

    // Map contractId → most recent pending workflow step
    const workflowMap = useMemo(() => {
        const map: Record<string, ApprovalWorkflow> = {}
        for (const wf of workflows) {
            if (!map[wf.contract_id]) {
                map[wf.contract_id] = wf
            }
        }
        return map
    }, [workflows])

    // Count contracts per stage (for the reference panel)
    const stageCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const c of contracts) {
            const wf = workflowMap[c.id]
            if (wf?.current_step) {
                counts[wf.current_step] = (counts[wf.current_step] || 0) + 1
            }
        }
        return counts
    }, [contracts, workflowMap])

    const { today, in30DaysStr } = useMemo(() => {
        const now = new Date()
        return {
            today: now.toISOString().split('T')[0],
            in30DaysStr: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
    }, [])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex-1 p-10 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Prazos & Etapas</h1>
                    <p className="text-sm text-slate-500">
                        Pipeline de aprovação e etapas vigentes por contrato
                    </p>
                </div>
            </div>

            {/* Reference Panel — 12 stages */}
            <PrazosEtapas stageCounts={stageCounts} />

            {/* Contracts Table */}
            <div className="executive-card">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-tight">
                        Contratos Ativos — {contracts.length} contrato{contracts.length !== 1 ? 's' : ''}
                    </h2>
                </div>

                {contracts.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">
                        Nenhum contrato ativo encontrado
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left p-4 text-xs font-black text-slate-400 uppercase tracking-tight">Shopping</th>
                                    <th className="text-left p-4 text-xs font-black text-slate-400 uppercase tracking-tight">Vencimento</th>
                                    <th className="text-left p-4 text-xs font-black text-slate-400 uppercase tracking-tight">Etapa Vigente</th>
                                    <th className="text-left p-4 text-xs font-black text-slate-400 uppercase tracking-tight">Prazo da Etapa</th>
                                    <th className="text-left p-4 text-xs font-black text-slate-400 uppercase tracking-tight">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {contracts.map(contract => {
                                    const wf = workflowMap[contract.id]
                                    const stepLabel = wf
                                        ? (STEP_LABELS[wf.current_step] || wf.current_step)
                                        : null
                                    const isDeadlineOverdue = !!wf?.deadline && wf.deadline < today
                                    const isEndDateSoon = contract.end_date >= today && contract.end_date <= in30DaysStr

                                    return (
                                        <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <span className="font-semibold text-slate-900 text-sm">
                                                    {contract.shopping_name}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-sm font-medium ${isEndDateSoon ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                                    {isEndDateSoon && '⚠ '}
                                                    {new Date(contract.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {stepLabel ? (
                                                    <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                                        {stepLabel}
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase bg-slate-100 text-slate-400">
                                                        Sem workflow
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {wf?.deadline ? (
                                                    <span className={`text-sm font-medium ${isDeadlineOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                                        {isDeadlineOverdue && '⚠ '}
                                                        {new Date(wf.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Link
                                                    href={`/dashboard/contracts/${contract.id}/approvals`}
                                                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-colors"
                                                >
                                                    Ver Workflow
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
