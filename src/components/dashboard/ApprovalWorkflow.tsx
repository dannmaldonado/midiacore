'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Play } from 'lucide-react'
import { ApprovalWorkflow as ApprovalWorkflowType, Profile } from '@/types'
import { WorkflowStepCard } from './WorkflowStepCard'

interface ApprovalWorkflowProps {
    contractId: string
}

const WORKFLOW_STEPS = [
    { step: 'pre_approval', label: 'Pré-aprovação', sla_days: 3 },
    { step: 'financial', label: 'Financeiro', sla_days: 5 },
    { step: 'director', label: 'Diretor', sla_days: 7 },
    { step: 'legal', label: 'Legal', sla_days: 7 },
]

export function ApprovalWorkflow({ contractId }: ApprovalWorkflowProps) {
    const { profile } = useAuth()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [workflows, setWorkflows] = useState<ApprovalWorkflowType[]>([])
    const [profiles, setProfiles] = useState<Record<string, Profile>>({})

    useEffect(() => {
        const fetchData = async () => {
            if (!profile?.company_id) return

            try {
                // Fetch existing workflows
                const { data: workflowsData, error: workflowError } = await supabase
                    .from('approval_workflows')
                    .select('*')
                    .eq('contract_id', contractId)
                    .order('created_at', { ascending: true })

                if (workflowError) throw workflowError

                setWorkflows(workflowsData || [])

                // Fetch profiles for all assigned_to IDs
                const assignedIds = [
                    ...new Set((workflowsData || []).map((w: ApprovalWorkflowType) => w.assigned_to).filter(Boolean) as string[])
                ]

                if (assignedIds.length > 0) {
                    const { data: profilesData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', assignedIds)
                        .eq('company_id', profile.company_id)

                    if (profileError) throw profileError

                    const profileMap = (profilesData || []).reduce((acc: Record<string, Profile>, p: Profile) => {
                        acc[p.id] = p
                        return acc
                    }, {} as Record<string, Profile>)

                    setProfiles(profileMap)
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Erro ao carregar workflows'
                setError(message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [profile, contractId, supabase])

    const handleInitiateWorkflow = async () => {
        if (!profile?.company_id) return

        setSaving(true)
        setError(null)

        try {
            const today = new Date()
            const newWorkflows = WORKFLOW_STEPS.map(step => ({
                contract_id: contractId,
                current_step: step.step,
                step_status: 'pending' as const,
                assigned_to: null,
                deadline: new Date(today.getTime() + step.sla_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completed_at: null,
                notes: null,
                created_at: new Date().toISOString(),
            }))

            const { error } = await supabase
                .from('approval_workflows')
                .insert(newWorkflows)

            if (error) throw error

            // Refresh workflows
            const { data: workflowsData } = await supabase
                .from('approval_workflows')
                .select('*')
                .eq('contract_id', contractId)
                .order('created_at', { ascending: true })

            setWorkflows(workflowsData || [])
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao iniciar workflow'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    const handleRefresh = async () => {
        setLoading(true)
        try {
            const { data: workflowsData, error: workflowError } = await supabase
                .from('approval_workflows')
                .select('*')
                .eq('contract_id', contractId)
                .order('created_at', { ascending: true })

            if (workflowError) throw workflowError
            setWorkflows(workflowsData || [])
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        )
    }

    const completedCount = workflows.filter(w => w.step_status === 'approved').length
    const progressPercent = workflows.length > 0 ? (completedCount / workflows.length) * 100 : 0

    return (
        <div className="space-y-8">
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-black text-red-600 flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-600 rounded-full" />
                    {error.toUpperCase()}
                </div>
            )}

            {workflows.length === 0 ? (
                <div className="executive-card p-12 bg-white/80 backdrop-blur-md text-center space-y-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-wide">Workflow não iniciado</h3>
                        <p className="text-slate-500 text-sm font-medium">Clique abaixo para iniciar o processo de aprovação com as 4 etapas padrão.</p>
                    </div>
                    <button
                        onClick={handleInitiateWorkflow}
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                INICIANDO...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                INICIAR WORKFLOW
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="executive-card p-6 bg-white/80 backdrop-blur-md">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">Progresso Geral</h3>
                                <span className="text-sm font-black text-indigo-600">{completedCount} de {workflows.length} aprovado</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Workflow Steps */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {workflows.map((workflow) => (
                            <WorkflowStepCard
                                key={workflow.id}
                                workflow={workflow}
                                stepConfig={WORKFLOW_STEPS.find(s => s.step === workflow.current_step)!}
                                assignedProfile={workflow.assigned_to ? profiles[workflow.assigned_to] : undefined}
                                contractId={contractId}
                                onUpdate={handleRefresh}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
