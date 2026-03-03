'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { X, LogOut, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
    profile: Profile | null
}

export function UserProfileModal({ isOpen, onClose, profile }: UserProfileModalProps) {
    const { user, signOut } = useAuth()
    const supabase = useMemo(() => createClient(), [])
    const [fullName, setFullName] = useState(profile?.full_name || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)

    // Sincroniza fullName quando profile carrega (modal pode montar antes do profile chegar)
    useEffect(() => {
        setFullName(profile?.full_name || '')
    }, [profile?.full_name])

    if (!isOpen) return null

    const handleSaveProfile = async () => {
        if (!profile?.id) {
            setError('Perfil não carregado. Tente novamente.')
            return
        }

        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ full_name: fullName || null })
                .eq('id', profile.id)

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

    const handleChangePassword = async () => {
        setPasswordError(null)
        if (passwordForm.newPassword.length < 8) {
            setPasswordError('A nova senha deve ter no mínimo 8 caracteres.')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('As senhas não coincidem.')
            return
        }

        setChangingPassword(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
            if (updateError) throw updateError
            setPasswordSuccess(true)
            setPasswordForm({ newPassword: '', confirmPassword: '' })
            setShowPasswordForm(false)
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao alterar senha'
            setPasswordError(message)
        } finally {
            setChangingPassword(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
                <div className="p-6 space-y-6">
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
                        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm">
                            {user?.email || '—'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Email não pode ser alterado</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Role
                        </label>
                        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm">
                            {profile?.role || 'Sem definição'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Sua role não pode ser alterada aqui</p>
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

                    {/* Alterar Senha */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => { setShowPasswordForm(v => !v); setPasswordError(null) }}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-semibold text-slate-700"
                        >
                            <span className="flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-slate-400" />
                                Alterar Senha
                            </span>
                            <span className="text-slate-400 text-xs">{showPasswordForm ? '▲' : '▼'}</span>
                        </button>

                        {showPasswordForm && (
                            <div className="p-4 space-y-3 border-t border-slate-200">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                                        placeholder="Mínimo 8 caracteres"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                        placeholder="Repita a nova senha"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-xs text-red-600">{passwordError}</p>
                                )}
                                {passwordSuccess && (
                                    <p className="text-xs text-emerald-600">Senha alterada com sucesso!</p>
                                )}

                                <button
                                    type="button"
                                    onClick={handleChangePassword}
                                    disabled={changingPassword}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    {changingPassword ? 'Alterando...' : 'Confirmar Nova Senha'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button
                            onClick={async () => {
                                await signOut()
                            }}
                            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Encerrar Sessão
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
