'use client'

import { useAuth } from '@/hooks/use-auth'
import { redirect } from 'next/navigation'
import { UserManagementTable } from './UserManagementTable'

export function UserManagementPage() {
  const { profile } = useAuth()

  // Protect route: admins only
  if (profile && profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">
          Usuários
        </h2>
        <p className="text-slate-500 mt-2 font-medium">
          Gerenciar acesso, roles e permissões da equipe.
        </p>
      </div>

      <UserManagementTable />
    </div>
  )
}
