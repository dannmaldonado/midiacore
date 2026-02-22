import { useAuth } from '@/hooks/use-auth'
import { Bell, Search } from 'lucide-react'

export function Header() {
    const { user, profile } = useAuth()

    return (
        <header className="h-20 border-b border-white/10 glass-effect flex items-center justify-between px-10 sticky top-0 z-10">
            <div className="relative w-full max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                </span>
                <input
                    type="text"
                    placeholder="Análise rápida de contratos ou ativos..."
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-slate-600 placeholder:text-slate-400"
                />
            </div>

            <div className="flex items-center gap-6">
                <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl relative transition-all group">
                    <Bell className="w-5 h-5 group-hover:shake transition-transform" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white animate-pulse"></span>
                </button>

                <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 leading-none font-display">
                            {user?.email?.split('@')[0].toUpperCase() || 'USUÁRIO'}
                        </p>
                        <p className="text-[10px] font-black text-indigo-500 mt-1 uppercase tracking-tighter">
                            Acesso: {profile?.role || 'Executivo'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-white border border-slate-200 flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:shadow-md transition-all">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    )
}
