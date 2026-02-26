'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        console.error('[App Error]', error)
    }, [error])

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-executive border border-slate-100 p-10 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 font-display mb-2">
                    Algo deu errado
                </h1>
                <p className="text-slate-500 text-sm mb-8">
                    Ocorreu um erro inesperado. Tente novamente ou volte ao início.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar novamente
                    </button>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}
