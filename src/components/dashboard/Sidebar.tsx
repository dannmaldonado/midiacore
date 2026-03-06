import { LayoutDashboard, FileText, Users, TrendingUp, LogOut, Clock, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

interface MenuItem {
  icon: LucideIcon
  label: string
  href: string
  admin?: boolean
}

const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Contratos', href: '/dashboard/contracts' },
    { icon: Clock, label: 'Prazos', href: '/dashboard/prazos' },
    { icon: TrendingUp, label: 'Oportunidades', href: '/dashboard/opportunities' },
    { icon: Users, label: 'Contatos', href: '/dashboard/contacts' },
    { icon: Users, label: 'Usuários', href: '/dashboard/users', admin: true },
]

export function Sidebar() {
    const { signOut, profile } = useAuth()

    return (
        <aside className="w-64 bg-slate-900 border-r border-white/5 text-white flex flex-col h-screen fixed left-0 top-0 z-20 shadow-2xl">
            <div className="p-8 pb-10">
                <div className="flex items-center gap-3 mb-6">
                    {/* Logo Audi Comunicação */}
                    <div className="w-10 h-10 flex-shrink-0">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                            <rect width="40" height="40" rx="10" fill="#C41E3A"/>
                            <path d="M20 8L28 30H24.5L22.5 24.5H17.5L15.5 30H12L20 8ZM20 14L18.5 22H21.5L20 14Z" fill="white"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight font-display">Lojas Torra - Mídia Mall</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Audi Comunicação</p>
                        </div>
                    </div>
                </div>

                <nav className="space-y-1.5">
                    {menuItems.map((item) => {
                        // Hide admin-only items from non-admins
                        if (item.admin && profile?.role !== 'admin') {
                            return null
                        }
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group relative overflow-hidden"
                            >
                                <item.icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                <span className="text-sm font-semibold group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-indigo-500 group-hover:h-6 transition-all rounded-r-full" />
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-bold">Encerrar Sessão</span>
                </button>
            </div>
        </aside>
    )
}
