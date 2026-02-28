'use client'

import { X, CheckCircle, XCircle, SkipForward, Clock } from 'lucide-react'
import { ApprovalWorkflow, Profile } from '@/types'

// Labels para etapas internas + 12 etapas do cliente
const STEP_LABELS: Record<string, string> = {
    pre_approval:             'Pré-aprovação',
    financial:                'Financeiro',
    director:                 'Diretor',
    legal:                    'Legal',
    proposta_solicitacao:     'Solicitação da Proposta Audi × MKT Shopping',
    proposta_mkt:             'Proposta MKT Shopping',
    analise_audi:             'Análise Audi',
    aprovacao_mkt_torra:      'Aprovação MKT Torra',
    juridico_torra:           'Jurídico Torra',
    renovacao_sem_troca:      'Renovação sem Troca de Mídia',
    renovacao_com_troca:      'Renovação com Troca de Mídia',
    orcamento_producao:       'Orçamento Produção c/ Retirada 1 Ano',
    producao_instalacao:      'Produção e Instalação das Novas Mídias',
    checking_instalacao:      'Checking de Instalação',
    renovacao_nao_autorizada: 'Renovação Não Autorizada',
    retirada_midias:          'Retirada das Mídias',
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    approved: {
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        label: 'Aprovado',
        color: 'text-emerald-700',
    },
    rejected: {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        label: 'Rejeitado',
        color: 'text-red-700',
    },
    skipped: {
        icon: <SkipForward className="w-4 h-4 text-slate-400" />,
        label: 'Pulado',
        color: 'text-slate-500',
    },
    pending: {
        icon: <Clock className="w-4 h-4 text-slate-300" />,
        label: 'Aguardando',
        color: 'text-slate-400',
    },
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

interface ApprovalHistoryDrawerProps {
    isOpen: boolean
    onClose: () => void
    contractName: string
    workflows: ApprovalWorkflow[]
    profiles: Record<string, Profile>
}

export function ApprovalHistoryDrawer({
    isOpen,
    onClose,
    contractName,
    workflows,
    profiles,
}: ApprovalHistoryDrawerProps) {
    if (!isOpen) return null

    const sorted = [...workflows].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-sm font-black text-slate-900">Histórico de Aprovações</h2>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{contractName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
                    {sorted.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-10">
                            Nenhum registro de workflow encontrado
                        </p>
                    ) : (
                        sorted.map((wf, idx) => {
                            const cfg = STATUS_CONFIG[wf.step_status] ?? STATUS_CONFIG.pending
                            // AC-4: nome do responsável via join com profiles
                            const approverName = wf.assigned_to
                                ? (profiles[wf.assigned_to]?.full_name || 'Usuário desconhecido')
                                : '—'
                            // AC-5: etapas pendentes não exibem usuário
                            const displayApprover = wf.step_status === 'pending' ? '—' : approverName
                            const stepLabel = STEP_LABELS[wf.current_step] || wf.current_step
                            const isLast = idx === sorted.length - 1

                            return (
                                <div key={wf.id} className="flex gap-4">
                                    {/* Linha do tempo */}
                                    <div className="flex flex-col items-center">
                                        <div className="mt-1">{cfg.icon}</div>
                                        {!isLast && (
                                            <div className="w-px flex-1 bg-slate-100 my-1" />
                                        )}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="pb-5 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-black text-slate-800 leading-tight">
                                                {stepLabel}
                                            </p>
                                            <span className={`text-[10px] font-black uppercase shrink-0 ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* AC-3: usuário + data + nota */}
                                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                                            {displayApprover}
                                        </p>
                                        {wf.completed_at && wf.step_status !== 'pending' && (
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {formatDateTime(wf.completed_at)}
                                            </p>
                                        )}
                                        {/* Nota de rejeição */}
                                        {wf.notes && wf.step_status === 'rejected' && (
                                            <div className="mt-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
                                                <p className="text-[10px] text-red-600 font-semibold">
                                                    {wf.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-[10px] text-slate-400 text-center font-medium">
                        {sorted.filter(w => w.step_status !== 'pending').length} de {sorted.length} etapas concluídas
                    </p>
                </div>
            </div>
        </>
    )
}
