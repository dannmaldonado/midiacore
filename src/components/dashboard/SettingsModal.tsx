'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { X } from 'lucide-react'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    profile: Profile | null
}

export function SettingsModal({ isOpen, onClose, profile }: SettingsModalProps) {
    const [fullName, setFullName] = useState(profile?.full_name || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    if (!isOpen) return null

    const handleSaveProfile = async () => {
        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ full_name: fullName || null })
                .eq('id', profile?.id)

            if (updateError) throw updateError

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar perfil'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900">Meu Perfil</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Profile Settings */}
                    <div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profile?.id || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500 mt-1">Email não pode ser alterado</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    value={profile?.role || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500 mt-1">Role não pode ser alterado por você mesmo</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                                    Perfil salvo com sucesso!
                                </div>
                            )}

                            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Fechar
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
