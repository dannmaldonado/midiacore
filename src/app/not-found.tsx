import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-executive border border-slate-100 p-10 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileQuestion className="w-8 h-8 text-indigo-500" />
                </div>
                <h1 className="text-6xl font-black text-slate-200 font-display mb-2">404</h1>
                <h2 className="text-xl font-bold text-slate-900 font-display mb-2">
                    Página não encontrada
                </h2>
                <p className="text-slate-500 text-sm mb-8">
                    A página que você está procurando não existe ou foi movida.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors"
                >
                    <Home className="w-4 h-4" />
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    )
}
