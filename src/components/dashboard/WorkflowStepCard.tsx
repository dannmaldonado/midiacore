'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Check, X, SkipForward } from 'lucide-react'
import { ApprovalWorkflow, Profile } from '@/types'

// AC-3: Formatar valor em BRL
const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface WorkflowStepCardProps {
    workflow: ApprovalWorkflow
    stepConfig: { step: string; label: string; sla_days: number }
    assignedProfile?: Profile
    contractId: string
    contractValue?: number
    onUpdate: () => void
}

export function WorkflowStepCard({
    workflow,
    stepConfig,
    assignedProfile,
    contractId,
    contractValue,
    onUpdate,
}: WorkflowStepCardProps) {
    const { profile } = useAuth()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [assignmentLoading, setAssignmentLoading] = useState(false)
    const [showAssignmentSelect, setShowAssignmentSelect] = useState(false)
    const [companyProfiles, setCompanyProfiles] = useState<Profile[]>([])
    const [rejectNotes, setRejectNotes] = useState('')
    const [showRejectPrompt, setShowRejectPrompt] = useState(false)

    const isAdmin = profile?.role === 'admin'
    const isAssignedTo = profile?.id === workflow.assigned_to
    const canAction = isAdmin || isAssignedTo
    const isCompleted = workflow.step_status !== 'pending'

    // Fetch company profiles for assignment select
    useEffect(() => {
        if (showAssignmentSelect && profile?.company_id) {
            const fetchProfiles = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .order('full_name')

                setCompanyProfiles(data || [])
            }
            fetchProfiles()
        }
    }, [showAssignmentSelect, profile?.company_id, supabase])

    const statusBadgeColor = {
        pending: 'bg-slate-100 text-slate-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        skipped: 'bg-slate-100 text-slate-500',
    }[workflow.step_status]

    const statusLabel = {
        pending: 'Aguardando',
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        skipped: 'Pulado',
    }[workflow.step_status]

    const isDeadlinePassed = workflow.deadline && new Date(workflow.deadline) < new Date()

    const handleAssignTo = async (assignedId: string) => {
        if (!profile?.company_id) return

        setAssignmentLoading(true)
        try {
            const { error } = await supabase
                .from('approval_workflows')
                .update({ assigned_to: assignedId })
                .eq('id', workflow.id)
                .eq('contract_id', contractId)

            if (error) throw error

            // Create notification via RPC (Story 3.2)
            if (workflow.deadline) {
                const { error: notifError } = await supabase.rpc(
                    'create_approval_notification',
                    {
                        p_contract_id: contractId,
                        p_user_id: assignedId,
                        p_step: workflow.current_step,
                        p_deadline: workflow.deadline,
                    }
                )

                if (notifError) {
                    console.warn('Erro ao criar notificação:', notifError)
                    // Don't fail the assignment if notification fails
                }
            }

            setShowAssignmentSelect(false)
            onUpdate()
        } catch (err) {
            console.error('Erro ao atribuir:', err)
        } finally {
            setAssignmentLoading(false)
        }
    }

    const handleApprove = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('approval_workflows')
                .update({
                    step_status: 'approved',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', workflow.id)
                .eq('contract_id', contractId)

            if (error) throw error
            onUpdate()
        } catch (err) {
            console.error('Erro ao aprovar:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('approval_workflows')
                .update({
                    step_status: 'rejected',
                    notes: rejectNotes || null,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', workflow.id)
                .eq('contract_id', contractId)

            if (error) throw error
            setShowRejectPrompt(false)
            setRejectNotes('')
            onUpdate()
        } catch (err) {
            console.error('Erro ao rejeitar:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('approval_workflows')
                .update({
                    step_status: 'skipped',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', workflow.id)
                .eq('contract_id', contractId)

            if (error) throw error
            onUpdate()
        } catch (err) {
            console.error('Erro ao pular:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="executive-card p-6 bg-white/80 backdrop-blur-md space-y-4">
            {/* Header: Label + Badge */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">{stepConfig.label}</h3>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${statusBadgeColor}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Responsável */}
            <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block mb-2">Responsável</label>
                {assignedProfile ? (
                    <p className="text-sm font-bold text-slate-700">{assignedProfile.full_name || 'Sem nome'}</p>
                ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Não atribuído</p>
                )}
                {isAdmin && !isCompleted && (
                    <button
                        onClick={() => setShowAssignmentSelect(!showAssignmentSelect)}
                        className="mt-2 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wide transition-colors"
                    >
                        {showAssignmentSelect ? 'Fechar' : 'Atribuir'}
                    </button>
                )}

                {/* Assignment Select */}
                {showAssignmentSelect && (
                    <div className="mt-3 space-y-2">
                        {companyProfiles.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleAssignTo(p.id)}
                                disabled={assignmentLoading}
                                className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-100 hover:border-indigo-200 disabled:opacity-50"
                            >
                                {p.full_name || 'Sem nome'} ({p.role})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Prazo */}
            <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block mb-2">Prazo</label>
                {workflow.deadline ? (
                    <p className={`text-sm font-bold ${isDeadlinePassed ? 'text-red-600 font-black' : 'text-slate-700'}`}>
                        {new Date(workflow.deadline).toLocaleDateString('pt-BR')}
                        {isDeadlinePassed && <span className="ml-1 text-[10px] uppercase"> (ATRASADO)</span>}
                    </p>
                ) : (
                    <p className="text-sm font-medium text-slate-400 italic">Sem prazo</p>
                )}
            </div>

            {/* AC-1: Quem executou (apenas para etapas concluídas) */}
            {isCompleted && (
                <div className="border-t border-slate-100 pt-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block mb-2">Executado por</label>
                    {/* AC-5: exibir nome ou "—" */}
                    <p className="text-sm font-bold text-slate-700">
                        {assignedProfile?.full_name || '—'}
                    </p>
                    {workflow.completed_at && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(workflow.completed_at).toLocaleString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </p>
                    )}
                </div>
            )}

            {/* Valor do Contrato (AC-1) */}
            {contractValue !== undefined && (
                <div className="border-t border-slate-100 pt-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block mb-2">Valor do Contrato</label>
                    <p className="text-sm font-black text-indigo-700">{formatBRL(contractValue)}</p>
                </div>
            )}

            {/* Notas (se rejeitado) */}
            {workflow.notes && workflow.step_status === 'rejected' && (
                <div className="border-t border-slate-100 pt-3 bg-red-50 rounded-lg p-3">
                    <label className="text-[10px] font-black text-red-700 uppercase tracking-wide block mb-1">Motivo da Rejeição</label>
                    <p className="text-[11px] font-medium text-red-600">{workflow.notes}</p>
                </div>
            )}

            {/* Action Buttons */}
            {canAction && !isCompleted && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                    <button
                        onClick={handleApprove}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border border-emerald-100 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Check className="w-3 h-3" />
                        )}
                        Aprovar
                    </button>

                    <button
                        onClick={() => setShowRejectPrompt(true)}
                        disabled={loading || showRejectPrompt}
                        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border border-red-100 disabled:opacity-50"
                    >
                        <X className="w-3 h-3" />
                        Rejeitar
                    </button>

                    <button
                        onClick={handleSkip}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border border-slate-100 disabled:opacity-50"
                    >
                        <SkipForward className="w-3 h-3" />
                        Pular
                    </button>

                    {/* Reject Prompt */}
                    {showRejectPrompt && (
                        <div className="space-y-2 bg-red-50 rounded-lg p-3 border border-red-100">
                            <textarea
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Motivo da rejeição (opcional)..."
                                className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-[10px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 min-h-[60px]"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReject}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Confirmar'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRejectPrompt(false)
                                        setRejectNotes('')
                                    }}
                                    disabled={loading}
                                    className="flex-1 bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-slate-400 transition-all disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!canAction && !isCompleted && (
                <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-medium text-slate-400 italic">Aguardando atribuição ou ação da pessoa responsável</p>
                </div>
            )}
        </div>
    )
}
