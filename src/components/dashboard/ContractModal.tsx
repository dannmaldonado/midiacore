'use client'

import { useState, useEffect, useRef } from 'react'
import { Contract } from '@/types'
import { X, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ContractModalProps {
    contract: Contract | null
    onClose: () => void
    onSave?: (contract: Contract) => void
    onDelete?: (id: string) => void
    onFilterByStatus?: (status: string) => void
}

export function ContractModal({
    contract,
    onClose,
    onSave,
    onDelete,
    onFilterByStatus,
}: ContractModalProps) {
    const [mode, setMode] = useState<'view' | 'edit'>('view')
    const [formData, setFormData] = useState<Contract | null>(null)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newMediaProp, setNewMediaProp] = useState('')
    const modalRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Initialize form data when contract changes
    useEffect(() => {
        if (contract) {
            setFormData(contract)
            setMode('view')
            setCopiedField(null)
            setError(null)
        }
    }, [contract])

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

    if (!contract || !formData) return null

    // Copy to clipboard with feedback
    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(null), 2000)
    }

    // Handle form changes in edit mode
    const handleInputChange = (
        field: keyof Contract,
        value: string | number | string[] | null
    ) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : null)
    }

    // Add media property tag
    const addMediaProp = () => {
        if (!newMediaProp.trim() || !formData) return
        const current = formData.media_properties || []
        setFormData({
            ...formData,
            media_properties: [...current, newMediaProp.trim()]
        })
        setNewMediaProp('')
    }

    // Remove media property tag
    const removeMediaProp = (index: number) => {
        if (!formData) return
        const updated = (formData.media_properties || []).filter((_, i) => i !== index)
        setFormData({ ...formData, media_properties: updated })
    }

    // Save contract
    const handleSave = async () => {
        if (!formData || !contract.id) return
        setSaving(true)
        setError(null)

        try {
            const { error: updateError } = await supabase
                .from('contracts')
                .update(formData)
                .eq('id', contract.id)

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

    // Delete contract
    const handleDelete = async () => {
        if (!contract.id || !window.confirm('Tem certeza que deseja deletar este contrato?')) return
        setDeleting(true)
        setError(null)

        try {
            const { error: deleteError } = await supabase
                .from('contracts')
                .delete()
                .eq('id', contract.id)

            if (deleteError) {
                setError(`Erro ao deletar: ${deleteError.message}`)
                return
            }

            onDelete?.(contract.id)
            onClose()
        } catch (err) {
            setError(`Erro inesperado: ${err instanceof Error ? err.message : 'desconhecido'}`)
        } finally {
            setDeleting(false)
        }
    }

    const statusColors = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        pending: 'bg-amber-50 text-amber-600 border-amber-100',
        expired: 'bg-slate-50 text-slate-500 border-slate-200'
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
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">
                                {formData.media_type}
                            </p>
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
                        {/* Seção 1: Dados do Ativo */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Dados do Ativo</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Shopping / Ativo</p>
                                    <button
                                        onClick={() => copyToClipboard(formData.shopping_name, 'shopping_name')}
                                        className="group flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                                    >
                                        {formData.shopping_name}
                                        <Copy className={`w-3.5 h-3.5 transition-all ${copiedField === 'shopping_name' ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Tipo de Mídia</p>
                                    <p className="text-sm text-slate-600 font-medium">{formData.media_type}</p>
                                </div>
                            </div>

                            {/* Media Properties Tags */}
                            {formData.media_properties && formData.media_properties.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Propriedades de Mídia</p>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.media_properties.map((prop, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => copyToClipboard(prop, `media_prop_${idx}`)}
                                                className="group px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold uppercase hover:bg-indigo-100 transition-all flex items-center gap-1"
                                            >
                                                {prop}
                                                <Copy className={`w-2.5 h-2.5 transition-all ${copiedField === `media_prop_${idx}` ? 'text-emerald-500' : 'text-indigo-400'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Seção 2: Financeiro & Status */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Financeiro & Status</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Valor do Contrato</p>
                                    <button
                                        onClick={() => copyToClipboard(`R$ ${formData.contract_value.toLocaleString('pt-BR')}`, 'contract_value')}
                                        className="group flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                                    >
                                        R$ {formData.contract_value.toLocaleString('pt-BR')}
                                        <Copy className={`w-3.5 h-3.5 transition-all ${copiedField === 'contract_value' ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                    </button>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Status</p>
                                    <button
                                        onClick={() => {
                                            onFilterByStatus?.(formData.status)
                                            onClose()
                                        }}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm cursor-pointer hover:shadow-md transition-all ${statusColors[formData.status]}`}
                                    >
                                        {formData.status === 'active' ? 'Ativo' : formData.status === 'pending' ? 'Pendente' : 'Expirado'}
                                    </button>
                                </div>
                            </div>

                            {formData.pending_quotes && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Orçamento Pendente</p>
                                    <p className="text-sm text-amber-600 font-medium">{formData.pending_quotes}</p>
                                </div>
                            )}
                        </div>

                        {/* Seção 3: Documentação */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Documentação</h4>
                            {formData.contract_docs && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Documentos do Contrato</p>
                                    <a
                                        href={formData.contract_docs}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                                    >
                                        Abrir documentos
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            )}

                            {formData.layouts_url && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Layouts</p>
                                    <a
                                        href={formData.layouts_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                                    >
                                        Abrir layouts
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Seção 4: Cronograma */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cronograma</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Data de Início</p>
                                    <p className="text-sm text-slate-600 font-medium">
                                        {new Date(formData.start_date).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Data de Término</p>
                                    <p className="text-sm text-slate-600 font-medium">
                                        {new Date(formData.end_date).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            {formData.negotiation && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Negociação</p>
                                    <button
                                        onClick={() => copyToClipboard(formData.negotiation!, 'negotiation')}
                                        className="group flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                                    >
                                        {formData.negotiation}
                                        <Copy className={`w-3.5 h-3.5 transition-all ${copiedField === 'negotiation' ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Seção 5: Stakeholder & Notas */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Responsável & Notas</h4>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Responsável</p>
                                <button
                                    onClick={() => copyToClipboard(formData.responsible_person, 'responsible_person')}
                                    className="group flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                                >
                                    {formData.responsible_person}
                                    <Copy className={`w-3.5 h-3.5 transition-all ${copiedField === 'responsible_person' ? 'text-emerald-500' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                </button>
                            </div>

                            {formData.comments && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Comentários</p>
                                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{formData.comments}</p>
                                </div>
                            )}

                            {formData.notes && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">Notas</p>
                                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{formData.notes}</p>
                                </div>
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

                    {/* Seção 1: Dados do Ativo */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Dados do Ativo</h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Shopping / Ativo
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
                                Tipo de Mídia
                            </label>
                            <input
                                type="text"
                                value={formData.media_type}
                                onChange={(e) => handleInputChange('media_type', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        {/* Media Properties */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Propriedades de Mídia
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newMediaProp}
                                    onChange={(e) => setNewMediaProp(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addMediaProp()
                                        }
                                    }}
                                    placeholder="Digite e pressione Enter"
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                                />
                                <button
                                    onClick={addMediaProp}
                                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                                >
                                    + Adicionar
                                </button>
                            </div>

                            {formData.media_properties && formData.media_properties.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.media_properties.map((prop, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => removeMediaProp(idx)}
                                            className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold uppercase hover:bg-indigo-100 transition-all flex items-center gap-1 group"
                                        >
                                            {prop}
                                            <X className="w-2.5 h-2.5 text-indigo-400 group-hover:text-indigo-600" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seção 2: Financeiro & Status */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Financeiro & Status</h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Valor do Contrato
                            </label>
                            <input
                                type="number"
                                value={formData.contract_value}
                                onChange={(e) => handleInputChange('contract_value', parseFloat(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'pending' | 'expired')}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            >
                                <option value="active">ATIVO</option>
                                <option value="pending">PENDENTE</option>
                                <option value="expired">EXPIRADO</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Orçamento Pendente
                            </label>
                            <input
                                type="text"
                                value={formData.pending_quotes || ''}
                                onChange={(e) => handleInputChange('pending_quotes', e.target.value || null)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Seção 3: Documentação */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Documentação</h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Documentos do Contrato (URL)
                            </label>
                            <input
                                type="url"
                                value={formData.contract_docs || ''}
                                onChange={(e) => handleInputChange('contract_docs', e.target.value || null)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Layouts (URL)
                            </label>
                            <input
                                type="url"
                                value={formData.layouts_url || ''}
                                onChange={(e) => handleInputChange('layouts_url', e.target.value || null)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Seção 4: Cronograma */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cronograma</h4>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                    Data de Início
                                </label>
                                <input
                                    type="date"
                                    value={formData.start_date.split('T')[0]}
                                    onChange={(e) => handleInputChange('start_date', new Date(e.target.value).toISOString())}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                    Data de Término
                                </label>
                                <input
                                    type="date"
                                    value={formData.end_date.split('T')[0]}
                                    onChange={(e) => handleInputChange('end_date', new Date(e.target.value).toISOString())}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Negociação
                            </label>
                            <input
                                type="text"
                                value={formData.negotiation || ''}
                                onChange={(e) => handleInputChange('negotiation', e.target.value || null)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Seção 5: Stakeholder & Notas */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Responsável & Notas</h4>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Responsável
                            </label>
                            <input
                                type="text"
                                value={formData.responsible_person}
                                onChange={(e) => handleInputChange('responsible_person', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-tight mb-2">
                                Comentários
                            </label>
                            <textarea
                                value={formData.comments || ''}
                                onChange={(e) => handleInputChange('comments', e.target.value || null)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all resize-none"
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
