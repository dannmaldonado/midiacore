import Link from 'next/link';
import { ArrowRight, FileText, TrendingUp, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <nav className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center text-white font-bold text-sm">
            AC
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-brand-navy">Mídia Mall</span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
              Audi Comunicação
            </span>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="bg-brand-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-blue transition-all"
        >
          Entrar no Sistema
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-bold uppercase tracking-wider mb-6">
          Uso Interno — Lojas Torra
        </div>

        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Mídia Mall — <span className="text-brand-blue">Gestão de Mídias</span>
        </h1>

        <p className="text-lg text-slate-600 mb-10 max-w-2xl">
          Plataforma interna de contratos, oportunidades e aprovações para as mídias
          das <strong>Lojas Torra</strong> — gerenciado pela Audi Comunicação.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-brand-navy text-white px-8 py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-navy/20"
          >
            Acessar Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          <div className="executive-card p-6 text-left">
            <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center mb-4">
              <FileText />
            </div>
            <h3 className="text-lg font-bold mb-2">Contratos</h3>
            <p className="text-slate-500 text-sm">Gerencie contratos vigentes, prazos e documentos de mídia em um só lugar.</p>
          </div>
          <div className="executive-card p-6 text-left">
            <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center mb-4">
              <TrendingUp />
            </div>
            <h3 className="text-lg font-bold mb-2">Oportunidades</h3>
            <p className="text-slate-500 text-sm">Acompanhe negociações, status de mídia kit e evolução do pipeline.</p>
          </div>
          <div className="executive-card p-6 text-left">
            <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center mb-4">
              <Users />
            </div>
            <h3 className="text-lg font-bold mb-2">Aprovações</h3>
            <p className="text-slate-500 text-sm">Workflow de aprovação com etapas, SLAs e notificações para cada responsável.</p>
          </div>
        </div>
      </main>

      <footer className="p-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        Mídia Mall &copy; {new Date().getFullYear()} — Audi Comunicação
      </footer>
    </div>
  );
}
