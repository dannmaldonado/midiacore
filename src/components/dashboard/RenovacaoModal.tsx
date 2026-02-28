'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { X, RefreshCw } from 'lucide-react'
import { Contract } from '@/types'

// SLA em dias para cada tipo de renovação
const RENOVACAO_SLA: Record<string, number | null> = {
    renovacao_sem_troca: null,
    renovacao_com_troca: 15,
}

interface RenovacaoModalProps {
    contract: Contract
    onClose: () => void
    onSuccess: () => void
}

export function RenovacaoModal({ contract, onClose, onSuccess }: RenovacaoModalProps) {
    const { profile } = useAuth()
    const supabase = createClient()

    const [tipoRenovacao, setTipoRenovacao] = useState<'renovacao_sem_troca' | 'renovacao_com_troca'>('renovacao_sem_troca')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const daysUntilEnd = Math.ceil(
        (new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    const sla = RENOVACAO_SLA[tipoRenovacao]
    const deadline = sla
        ? new Date(Date.now() + sla * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null

    async function handleConfirm() {
        if (!profile?.company_id) return
        setLoading(true)
        setError(null)

        try {
            // 1. INSERT approval_workflows
            const { error: wfError } = await supabase
                .from('approval_workflows')
                .insert({
                    contract_id: contract.id,
                    current_step: tipoRenovacao,
                    step_status: 'pending',
                    deadline: deadline,
                    assigned_to: null,
                    notes: null,
                    completed_at: null,
                })

            if (wfError) throw wfError

            // 2. UPDATE contracts.current_step
            const { error: contractError } = await supabase
                .from('contracts')
                .update({ current_step: tipoRenovacao })
                .eq('id', contract.id)
                .eq('company_id', profile.company_id)

            if (contractError) throw contractError

            // 3. Notificação para o usuário atual (AC-6)
            if (profile.id) {
                await supabase.rpc('create_approval_notification', {
                    p_contract_id: contract.id,
                    p_user_id: profile.id,
                    p_step: tipoRenovacao,
                    p_deadline: deadline
                        ? new Date(deadline + 'T12:00:00').toISOString()
                        : new Date().toISOString(),
                })
            }

            onSuccess()
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro ao iniciar renovação'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900">Renovar Contrato</h2>
                            <p className="text-xs text-slate-500 font-medium">{contract.shopping_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Info vencimento */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 font-semibold">
                        Vencimento atual:{' '}
                        <span className="font-black">
                            {new Date(contract.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        {daysUntilEnd > 0 && (
                            <span className="text-amber-600 font-bold"> — faltam {daysUntilEnd} dias</span>
                        )}
                    </p>
                </div>

                {/* Opções de tipo */}
                <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-tight">Tipo de Renovação</p>

                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        tipoRenovacao === 'renovacao_sem_troca'
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                    }`}>
                        <input
                            type="radio"
                            name="tipoRenovacao"
                            value="renovacao_sem_troca"
                            checked={tipoRenovacao === 'renovacao_sem_troca'}
                            onChange={() => setTipoRenovacao('renovacao_sem_troca')}
                            className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                            <p className="text-sm font-bold text-slate-800">Renovação sem Troca de Mídia</p>
                            <p className="text-xs text-slate-500 mt-0.5">Sem SLA adicional · Etapa 6 do workflow</p>
                        </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        tipoRenovacao === 'renovacao_com_troca'
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                    }`}>
                        <input
                            type="radio"
                            name="tipoRenovacao"
                            value="renovacao_com_troca"
                            checked={tipoRenovacao === 'renovacao_com_troca'}
                            onChange={() => setTipoRenovacao('renovacao_com_troca')}
                            className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                            <p className="text-sm font-bold text-slate-800">Renovação com Troca de Mídia</p>
                            <p className="text-xs text-slate-500 mt-0.5">SLA: 15 dias · Etapa 7 do workflow</p>
                        </div>
                    </label>
                </div>

                {/* Deadline preview */}
                {sla && (
                    <p className="text-xs text-slate-500">
                        Prazo da etapa:{' '}
                        <span className="font-bold text-slate-700">
                            {new Date(deadline! + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                    </p>
                )}

                {/* Error */}
                {error && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 rounded-lg p-2">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Confirmar Renovação
                    </button>
                </div>
            </div>
        </div>
    )
}
