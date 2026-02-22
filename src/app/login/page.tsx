'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Loader2, Mail, Lock, ChevronRight } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao realizar login'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background elements for premium feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[22px] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-500/30 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                        M
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display text-center">MidiaCore</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Enterprise OS 2.0</p>
                    </div>
                </div>

                <div className="executive-card p-10 bg-white/70 backdrop-blur-xl border border-white/40">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bem-vindo de volta</h2>
                        <p className="text-slate-500 text-sm mt-1 font-medium italic">Painel administrativo de alta performance.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email">
                                E-mail Corporativo
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="exemplo@empresa.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="password">
                                    Senha de Acesso
                                </label>
                                <Link href="#" className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                                    Recuperar
                                </Link>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-black text-red-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 uppercase tracking-tight">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                <>
                                    Acessar Plataforma
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-3 text-slate-400">
                        <div className="bg-slate-50 p-2 rounded-lg">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-[9px] uppercase font-black tracking-[0.15em] leading-none opacity-60">
                            Protocolo de Segurança Ativo
                        </span>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center gap-2">
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Não possui acesso?
                    </p>
                    <button className="text-[11px] font-black text-slate-900 border-b-2 border-slate-900 pb-0.5 hover:text-indigo-600 hover:border-indigo-600 transition-all">
                        Solicitar conta corporativa
                    </button>
                </div>
            </div>

            {/* Footer versioning */}
            <div className="absolute bottom-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                V.2.0.4-GOLDEN
            </div>
        </div>
    )
}
