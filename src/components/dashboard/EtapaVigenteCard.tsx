'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, Layers } from 'lucide-react'
import { Contract } from '@/types'
import { PRAZOS_ETAPAS } from './PrazosEtapas'

// Campos editáveis por etapa (new_media_target excluído — não está no schema de contracts)
type EditableField = 'shopping_name' | 'contract_docs' | 'contract_value' | 'layouts_url' | 'pending_quotes' | 'end_date' | 'media_properties'

const ETAPA_CAMPOS: Record<string, EditableField[]> = {
    proposta_solicitacao:     ['shopping_name'],
    proposta_mkt:             ['shopping_name', 'contract_docs'],
    analise_audi:             ['contract_value', 'contract_docs', 'layouts_url'],
    aprovacao_mkt_torra:      ['contract_docs', 'pending_quotes'],
    juridico_torra:           ['contract_docs', 'contract_value'],
    renovacao_sem_troca:      ['end_date', 'contract_docs'],
    renovacao_com_troca:      ['end_date', 'layouts_url'],
    orcamento_producao:       ['pending_quotes', 'contract_value'],
    producao_instalacao:      ['layouts_url', 'media_properties'],
    checking_instalacao:      ['layouts_url', 'contract_docs'],
    renovacao_nao_autorizada: ['contract_docs'],
    retirada_midias:          ['end_date', 'contract_docs'],
}

const FIELD_LABELS: Record<EditableField, string> = {
    shopping_name:   'Shopping / Cliente',
    contract_docs:   'Contrato / PI / OS (URL)',
    contract_value:  'Valor do Contrato (R$)',
    layouts_url:     'Layouts (URL)',
    pending_quotes:  'Orçamentos Pendentes',
    end_date:        'Data Fim',
    media_properties:'Propriedades de Mídia',
}

const FIELD_TYPE: Record<EditableField, string> = {
    shopping_name:   'text',
    contract_docs:   'url',
    contract_value:  'number',
    layouts_url:     'url',
    pending_quotes:  'text',
    end_date:        'date',
    media_properties:'text',
}

// AC-5: Badge de status por cor
const STATUS_BADGE: Record<string, string> = {
    pending:  'bg-slate-100 text-slate-600',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    skipped:  'bg-slate-100 text-slate-400',
}

const STATUS_LABEL: Record<string, string> = {
    pending:  'Em Andamento',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    skipped:  'Pulado',
}

interface EtapaVigenteCardProps {
    contract: Contract
    currentStep: string | null
    stepStatus: string
    isAdmin: boolean
    onSaved: () => void
}

export function EtapaVigenteCard({ contract, currentStep, stepStatus, isAdmin, onSaved }: EtapaVigenteCardProps) {
    const supabase = createClient()

    const etapaInfo = PRAZOS_ETAPAS.find(e => e.id === currentStep)
    const activeFields: EditableField[] = currentStep ? (ETAPA_CAMPOS[currentStep] ?? []) : []

    const [fields, setFields] = useState<Record<EditableField, string>>({
        shopping_name:    contract.shopping_name ?? '',
        contract_docs:    contract.contract_docs ?? '',
        contract_value:   contract.contract_value?.toString() ?? '',
        layouts_url:      contract.layouts_url ?? '',
        pending_quotes:   contract.pending_quotes ?? '',
        end_date:         contract.end_date ?? '',
        media_properties: (contract.media_properties ?? []).join(', '),
    })

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savedOk, setSavedOk] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            const updates: Record<string, unknown> = {}
            for (const field of activeFields) {
                if (field === 'contract_value') {
                    updates[field] = parseFloat(fields[field]) || 0
                } else if (field === 'media_properties') {
                    const arr = fields[field].split(',').map(s => s.trim()).filter(Boolean)
                    updates[field] = arr.length > 0 ? arr : null
                } else {
                    updates[field] = fields[field].trim() || null
                }
            }

            const { error: updateError } = await supabase
                .from('contracts')
                .update(updates)
                .eq('id', contract.id)

            if (updateError) throw updateError

            setSavedOk(true)
            setTimeout(() => setSavedOk(false), 2000)
            onSaved()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    // Todos os campos possíveis nas etapas
    const allFields: EditableField[] = ['shopping_name', 'contract_value', 'end_date', 'contract_docs', 'layouts_url', 'pending_quotes', 'media_properties']

    return (
        <div className="executive-card p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Layers className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-tight">Etapa Vigente</h3>
                        {etapaInfo ? (
                            <p className="text-sm font-black text-slate-900 mt-0.5">{etapaInfo.label}</p>
                        ) : (
                            <p className="text-sm font-medium text-slate-400 mt-0.5 italic">
                                {currentStep || 'Nenhuma etapa ativa'}
                            </p>
                        )}
                    </div>
                </div>
                {/* AC-5: badge por status */}
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${STATUS_BADGE[stepStatus] ?? STATUS_BADGE.pending}`}>
                    {STATUS_LABEL[stepStatus] ?? 'Em Andamento'}
                </span>
            </div>

            {!currentStep ? (
                <p className="text-xs text-slate-400 italic">
                    Inicie um workflow de aprovação para ver e editar os campos desta etapa.
                </p>
            ) : (
                <>
                    {/* Campos da etapa */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allFields.map(field => {
                            const isActive = activeFields.includes(field)
                            const canEdit = isActive && isAdmin
                            const label = FIELD_LABELS[field]
                            const type = FIELD_TYPE[field]

                            return (
                                <div key={field}>
                                    <label className={`block text-[10px] font-black uppercase tracking-wide mb-1.5 ${
                                        isActive ? 'text-indigo-600' : 'text-slate-300'
                                    }`}>
                                        {label}
                                        {isActive && (
                                            <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[9px]">
                                                DESTA ETAPA
                                            </span>
                                        )}
                                    </label>
                                    {type === 'url' && canEdit ? (
                                        <input
                                            type="url"
                                            value={fields[field]}
                                            onChange={e => setFields(prev => ({ ...prev, [field]: e.target.value }))}
                                            placeholder="https://..."
                                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700"
                                        />
                                    ) : canEdit ? (
                                        <input
                                            type={type}
                                            step={type === 'number' ? '0.01' : undefined}
                                            value={fields[field]}
                                            onChange={e => setFields(prev => ({ ...prev, [field]: e.target.value }))}
                                            placeholder={field === 'media_properties' ? 'Ex: Empena, Totem (separados por vírgula)' : ''}
                                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-700"
                                        />
                                    ) : (
                                        // AC-3: campos fora da etapa ou viewer — read-only
                                        <div className={`w-full px-3 py-2 rounded-xl text-xs font-medium border ${
                                            isActive
                                                ? 'bg-slate-50 border-slate-200 text-slate-500'
                                                : 'bg-slate-50/50 border-slate-100 text-slate-300'
                                        }`}>
                                            {fields[field] || <span className="italic text-slate-300">—</span>}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* AC-4 + AC-6: Salvar (admin only) */}
                    {isAdmin && (
                        <div className="pt-2 flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving || !activeFields.length}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wide hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {saving
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Save className="w-3.5 h-3.5" />
                                }
                                Salvar Etapa
                            </button>
                            {savedOk && (
                                <span className="text-xs font-bold text-emerald-600">✓ Salvo com sucesso</span>
                            )}
                            {error && (
                                <span className="text-xs font-bold text-red-600">{error}</span>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
