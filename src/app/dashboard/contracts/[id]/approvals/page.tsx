'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Contract } from '@/types'
import { ApprovalWorkflow } from '@/components/dashboard/ApprovalWorkflow'

export default function ApprovalWorkflowPage() {
    const { profile } = useAuth()
    const params = useParams()
    const contractId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [contract, setContract] = useState<Contract | null>(null)

    useEffect(() => {
        const fetchContract = async () => {
            if (!profile?.company_id || !contractId) return

            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .eq('company_id', profile.company_id)
                .single()

            if (error) {
                setError('Contrato não encontrado ou sem permissão de acesso.')
            } else if (data) {
                setContract(data)
            }
            setLoading(false)
        }

        fetchContract()
    }, [profile, contractId, supabase])

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto pb-12">
                <div className="flex items-center gap-4 mb-10">
                    <Link
                        href="/dashboard/contracts"
                        className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display uppercase tracking-widest">Workflow de Aprovação</h2>
                    </div>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-black text-red-600">
                    {error.toUpperCase()}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex items-center gap-4 mb-10">
                <Link
                    href={`/dashboard/contracts/${contractId}`}
                    className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 font-display uppercase tracking-widest">Workflow de Aprovação</h2>
                    {contract && <p className="text-slate-500 mt-1 font-medium">{contract.shopping_name}</p>}
                </div>
            </div>

            {contract && (
                <ApprovalWorkflow
                    contractId={contractId}
                    contractValue={contract.contract_value}
                />
            )}
        </div>
    )
}
