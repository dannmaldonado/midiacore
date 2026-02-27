'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const PRAZOS_ETAPAS = [
    { id: 'proposta_solicitacao',     label: 'Solicitação da Proposta Audi × MKT Shopping', sla_days: 1 },
    { id: 'proposta_mkt',             label: 'Proposta MKT Shopping',                        sla_days: 7 },
    { id: 'analise_audi',             label: 'Análise Audi',                                 sla_days: 3 },
    { id: 'aprovacao_mkt_torra',      label: 'Aprovação MKT Torra',                          sla_days: 15 },
    { id: 'juridico_torra',           label: 'Jurídico Torra',                               sla_days: 30 },
    { id: 'renovacao_sem_troca',      label: 'Renovação sem Troca de Mídia',                 sla_days: null },
    { id: 'renovacao_com_troca',      label: 'Renovação com Troca de Mídia',                 sla_days: 15 },
    { id: 'orcamento_producao',       label: 'Orçamento Produção c/ Retirada 1 Ano',         sla_days: 5 },
    { id: 'producao_instalacao',      label: 'Produção e Instalação das Novas Mídias',       sla_days: 10 },
    { id: 'checking_instalacao',      label: 'Checking de Instalação',                       sla_days: null },
    { id: 'renovacao_nao_autorizada', label: 'Renovação Não Autorizada',                     sla_days: null },
    { id: 'retirada_midias',          label: 'Retirada das Mídias',                          sla_days: 7 },
]

interface PrazosEtapasProps {
    stageCounts: Record<string, number>
}

export function PrazosEtapas({ stageCounts }: PrazosEtapasProps) {
    const [expanded, setExpanded] = useState(true)

    return (
        <div className="executive-card">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-6 text-left"
            >
                <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-tight">
                        Pipeline — 12 Etapas de Aprovação
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Referência de SLAs e contagem de contratos por etapa
                    </p>
                </div>
                {expanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                }
            </button>

            {expanded && (
                <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {PRAZOS_ETAPAS.map((etapa, index) => {
                        const count = stageCounts[etapa.id] || 0
                        const isActive = count > 0

                        return (
                            <div
                                key={etapa.id}
                                className={`p-3 rounded-xl border transition-colors ${
                                    isActive
                                        ? 'border-indigo-200 bg-indigo-50'
                                        : 'border-slate-100 bg-slate-50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                        isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    {isActive && (
                                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-600 text-white leading-none">
                                            {count}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs font-semibold leading-tight ${
                                    isActive ? 'text-indigo-900' : 'text-slate-600'
                                }`}>
                                    {etapa.label}
                                </p>
                                <p className={`text-[10px] mt-1.5 font-bold ${
                                    isActive ? 'text-indigo-500' : 'text-slate-400'
                                }`}>
                                    {etapa.sla_days
                                        ? `SLA: ${etapa.sla_days} dia${etapa.sla_days > 1 ? 's' : ''}`
                                        : 'Sem SLA fixo'
                                    }
                                </p>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
