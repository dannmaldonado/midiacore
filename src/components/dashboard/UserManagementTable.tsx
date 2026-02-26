'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Role } from '@/types'
import { Loader2, Trash2, Edit2, Plus } from 'lucide-react'

interface NewUserForm {
    email: string
    full_name: string
    role: Role
}

export function UserManagementTable() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showNewUserForm, setShowNewUserForm] = useState(false)
    const [newUserForm, setNewUserForm] = useState<NewUserForm>({
        email: '',
        full_name: '',
        role: 'editor',
    })
    const [creatingUser, setCreatingUser] = useState(false)
    const [editingRole, setEditingRole] = useState<{ userId: string; role: Role } | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true)
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (fetchError) throw fetchError
                setUsers(data || [])
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Erro ao carregar usuários'
                setError(message)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [supabase])

    const handleCreateUser = async () => {
        if (!newUserForm.email || !newUserForm.full_name) {
            setError('Email e nome são obrigatórios')
            return
        }

        setCreatingUser(true)
        setError(null)

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserForm),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao criar usuário')
            }

            // Reset form and refresh list
            setNewUserForm({ email: '', full_name: '', role: 'editor' })
            setShowNewUserForm(false)

            // Refresh users list
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (!fetchError && data) {
                setUsers(data)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
            setError(message)
        } finally {
            setCreatingUser(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: Role) => {
        try {
            setError(null)
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao atualizar role')
            }

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
            setEditingRole(null)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar role'
            setError(message)
        }
    }

    const handleDeactivateUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja desativar este usuário? Esta ação não pode ser desfeita.')) {
            return
        }

        try {
            setError(null)
            const response = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erro ao desativar usuário')
            }

            setUsers(users.filter(u => u.id !== userId))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao desativar usuário'
            setError(message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* New User Button */}
            <button
                onClick={() => setShowNewUserForm(!showNewUserForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
                <Plus className="w-4 h-4" />
                Novo Usuário
            </button>

            {/* New User Form */}
            {showNewUserForm && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            placeholder="usuario@empresa.com"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={newUserForm.full_name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                            placeholder="Nome do usuário"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Role
                        </label>
                        <select
                            value={newUserForm.role}
                            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as Role })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowNewUserForm(false)}
                            className="px-3 py-1.5 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateUser}
                            disabled={creatingUser}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creatingUser ? 'Criando...' : 'Criar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Nome</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Data Criação</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-slate-900 font-medium">
                                    {user.full_name || '(sem nome)'}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{user.id}</td>
                                <td className="px-4 py-3">
                                    {editingRole?.userId === user.id ? (
                                        <select
                                            value={editingRole.role}
                                            onChange={(e) => {
                                                const newRole = e.target.value as Role
                                                setEditingRole({ userId: user.id, role: newRole })
                                                handleUpdateRole(user.id, newRole)
                                            }}
                                            className="px-2 py-1 border border-slate-200 rounded text-sm"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="editor">Editor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    ) : (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                            {user.role}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setEditingRole({ userId: user.id, role: user.role })}
                                            className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600"
                                            title="Editar role"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeactivateUser(user.id)}
                                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                            title="Desativar usuário"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                    Nenhum usuário encontrado
                </div>
            )}
        </div>
    )
}
