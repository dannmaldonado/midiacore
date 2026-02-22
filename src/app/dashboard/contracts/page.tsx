'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Contract } from '@/types'
import { FileText, Plus, Filter, Search, Calendar, Edit2 } from 'lucide-react'
import Link from 'next/link'

export default function ContractsPage() {
    const { profile } = useAuth()
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const supabase = createClient()

    useEffect(() => {
        const fetchContracts = async () => {
            if (!profile?.company_id) return

            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setContracts(data as Contract[])
            }
            setLoading(false)
        }

        fetchContracts()
    }, [profile, supabase])

    const filteredContracts = useMemo(() => {
        return contracts.filter(contract => {
            const matchesSearch =
                contract.shopping_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contract.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (contract.notes && contract.notes.toLowerCase().includes(searchTerm.toLowerCase()))

            const matchesStatus = statusFilter === 'all' || contract.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [contracts, searchTerm, statusFilter])

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display">Contratos</h2>
                    <p className="text-slate-500 mt-2 font-medium">Gestão operacional de veiculações e ativos de mídia.</p>
                </div>
                <Link
                    href="/dashboard/contracts/new"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    NOVO CONTRATO
                </Link>
            </div>

            <div className="executive-card">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
                        <div className="relative w-full md:w-80">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar shopping ou responsável..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all text-slate-600 font-medium"
                            />
                        </div>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Filter className="w-3.5 h-3.5" />
                            </span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 appearance-none text-slate-600 cursor-pointer"
                            >
                                <option value="all">TODOS OS STATUS</option>
                                <option value="active">ATIVO</option>
                                <option value="pending">PENDENTE</option>
                                <option value="expired">EXPIRADO</option>
                            </select>
                        </div>
                    </div>

                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        Total: <span className="text-indigo-600">{filteredContracts.length}</span> / {contracts.length}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shopping / Ativo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigência</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="shimmer-row">
                                        <td colSpan={5} className="px-8 py-6">
                                            <div className="h-6 bg-slate-50 rounded-lg shimmer w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center max-w-xs mx-auto">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                                <FileText className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="text-slate-900 font-black text-lg font-display">Nenhum contrato</p>
                                            <p className="text-slate-400 text-sm mt-2 font-medium">
                                                Ajuste sua busca ou inicie um novo registro.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map((contract) => (
                                    <tr key={contract.id} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm">{contract.shopping_name}</span>
                                                <span className="text-[11px] text-slate-400 font-bold tracking-tight uppercase">{contract.media_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-slate-600 text-sm font-bold">{contract.responsible_person}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-tighter">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>{new Date(contract.start_date).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-slate-200">/</span>
                                                <span>{new Date(contract.end_date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${contract.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/5' :
                                                    contract.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/5' :
                                                        'bg-slate-50 text-slate-500 border-slate-200 shadow-slate-500/5'
                                                    }`}>
                                                    {contract.status === 'active' ? 'Ativo' : contract.status === 'pending' ? 'Pendente' : 'Expirado'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                href={`/dashboard/contracts/${contract.id}`}
                                                className="inline-flex items-center justify-center w-10 h-10 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
