'use client'

import { useState, useEffect, useRef } from 'react'
import { Opportunity } from '@/types'
import { X, Copy, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STAGE_OPTIONS = [
    'Em negociação',
    'Aguardando resposta',
    'Mídia Kit pendente',
    'Contrato em elaboração',
    'Fechado',
]

const FREQUENCY_OPTIONS = [
    'Semanal',
    'Quinzenal',
    'Mensal',
    'Sob demanda',
]

interface OpportunityModalProps {
    opportunity: Opportunity | null
    onClose: () => void
    onSave?: (opportunity: Opportunity) => void
    onDelete?: (id: string) => void
    onFilterByStage?: (stage: string) => void
}

export function OpportunityModal({
    opportunity,
    onClose,
    onSave,
    onDelete,
    onFilterByStage,
}: OpportunityModalProps) {
    const [mode, setMode] = useState<'view' | 'edit'>('view')
    const [formData, setFormData] = useState<Opportunity | null>(null)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Initialize form data when opportunity changes
    useEffect(() => {
        if (opportunity) {
            setFormData(opportunity)
            setMode('view')
            setCopiedField(null)
            setError(null)
        }
    }, [opportunity])

    // Close on Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    // Close on outside click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === modalRef.current) onClose()
    }

    if (!opportunity || !formData) return null

    // Copy to clipboard with feedback
    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(null), 2000)
    }

    // Handle form changes in edit mode
    const handleInputChange = (
        field: keyof Opportunity,
        value: string | null
    ) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : null)
    }

    // Save opportunity
    const handleSave = async () => {
        if (!formData || !opportunity.id) return
        setSaving(true)
        setError(null)

        try {
            const { error: updateError } = await supabase
                .from('opportunities')
                .update(formData)
                .eq('id', opportunity.id)

            if (updateError) {
                setError(`Erro ao salvar: ${updateError.message}`)
                return
            }

            onSave?.(formData)
            onClose()
        } catch (err) {
            setError(`Erro inesperado: ${err instanceof Error ? err.message : 'desconhecido'}`)
        } finally {
            setSaving(false)
        }
    }

    // Delete opportunity
    const handleDelete = async () => {
        if (!opportunity.id || !window.confirm('Tem certeza que deseja deletar esta oportunidade?')) return
        setDeleting(true)
        setError(null)

        try {
            const { error: deleteError } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', opportunity.id)

            if (deleteError) {
                setError(`Erro ao deletar: ${deleteError.message}`)
                return
            }

            onDelete?.(opportunity.id)
            onClose()
        } catch (err) {
            setError(`Erro inesperado: ${err instanceof Error ? err.message : 'desconhecido'}`)
        } finally {
            setDeleting(false)
        }
    }

    // ==================== VIEW MODE ====================
    if (mode === 'view') {
        return (
            <div
                ref={modalRef}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={handleOverlayClick}
            >
                <div className="executive-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 p-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-slate-900 font-display truncate">
                                {formData.shopping_name}
                            </h3>
                            {formData.frequency && (
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">
                                    Frequência: {formData.frequency}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setMode('edit')}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all"
                            >
                                EDITAR
                            </button>
                            <button
                                onClick={onClose}
                                className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 pb-20">
                        {/* Seção 1: Identificação */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identificação</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Shopping</p>
                                    <button
                                        onClick={() => copyToClipboard(formData.shopping_name, 'shopping_name')}
                                        className="group flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                                    >
                                        {formData.shopping_name}
                                        <Copy className={`w-3.5 h-3.5 transition-all ${copiedField === 'shopping_name' ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Frequência</p>
                                    <p className="text-sm text-slate-600 font-medium">{formData.frequency || '—'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Stage</p>
                                <button
                                    onClick={() => {
                                        onFilterByStage?.(formData.stage)
                                        onClose()
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm bg-slate-50 text-slate-600 border-slate-200 cursor-pointer hover:shadow-md transition-all"
                                >
                                    {formData.stage}
                                </button>
                            </div>
                        </div>

                        {/* Seção 2: Planos de Mídia */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Planos de Mídia</h4>

                            {formData.social_media_plan && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Plano de Social Media</p>
                                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{formData.social_media_plan}</p>
                                </div>
                            )}

                            {formData.new_media_target && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Novo Target de Mídia</p>
                                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{formData.new_media_target}</p>
                                </div>
                            )}

                            {formData.events_plan && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Plano de Eventos</p>
                                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{formData.events_plan}</p>
                                </div>
                            )}
                        </div>

                        {/* Seção 3: Stakeholder & Notas */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Responsável & Notas</h4>

                            {formData.responsible_person && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Responsável</p>
                                    <button
                                        onClick={() => copyToClipboard(formData.responsible_person!, 'responsible_person')}
                                        className="group flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                                    >
                                        {formData.responsible_person}
                                        <Copy className={`w-3.5 h-3.5 transition-all ${copiedField === 'responsible_person' ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                    </button>
                                </div>
                            )}

                            {formData.notes && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Notas</p>
                                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{formData.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Badges de status */}
                        <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-slate-100">
                            {(formData.new_media_target?.toLowerCase().includes('mídia kit') ||
                                formData.new_media_target?.toLowerCase().includes('aguardando')) && (
                                <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase">
                                    Mídia Kit Pendente
                                </span>
                            )}
                            {formData.frequency && (
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase">
                                    Social Ativo
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ==================== EDIT MODE ====================
    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleOverlayClick}
        >
            <div className="executive-card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 p-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-slate-900 font-display truncate">
                            Editar: {formData.shopping_name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setMode('view')}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                        >
                            VOLTAR
                        </button>
                        <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div ref={contentRef} className="p-6 space-y-6 pb-20">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-bold text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Seção 1: Identificação */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identificação</h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Shopping
                            </label>
                            <input
                                type="text"
                                value={formData.shopping_name}
                                onChange={(e) => handleInputChange('shopping_name', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Frequência
                            </label>
                            <select
                                value={formData.frequency || ''}
                                onChange={(e) => handleInputChange('frequency', e.target.value || null)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            >
                                <option value="">Selecione...</option>
                                {FREQUENCY_OPTIONS.map(f => (
                                    <option key={f} value={f}>{f.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Stage
                            </label>
                            <select
                                value={formData.stage}
                                onChange={(e) => handleInputChange('stage', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            >
                                {STAGE_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Seção 2: Planos de Mídia */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Planos de Mídia</h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Plano de Social Media
                            </label>
                            <textarea
                                value={formData.social_media_plan || ''}
                                onChange={(e) => handleInputChange('social_media_plan', e.target.value || null)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Novo Target de Mídia
                            </label>
                            <textarea
                                value={formData.new_media_target || ''}
                                onChange={(e) => handleInputChange('new_media_target', e.target.value || null)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Plano de Eventos
                            </label>
                            <textarea
                                value={formData.events_plan || ''}
                                onChange={(e) => handleInputChange('events_plan', e.target.value || null)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Seção 3: Stakeholder & Notas */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Responsável & Notas</h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Responsável
                            </label>
                            <input
                                type="text"
                                value={formData.responsible_person || ''}
                                onChange={(e) => handleInputChange('responsible_person', e.target.value || null)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Notas
                            </label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={(e) => handleInputChange('notes', e.target.value || null)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 p-6 border-t border-slate-100 bg-white/80 backdrop-blur-sm flex items-center justify-between gap-4">
                    <button
                        onClick={handleDelete}
                        disabled={deleting || saving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        DELETAR
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-6 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-sm font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            CANCELAR
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {saving ? 'SALVANDO...' : 'SALVAR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
