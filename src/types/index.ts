export interface Company {
    id: string
    company_name: string
    type: 'internal' | 'external'
    created_at: string
}

export interface Profile {
    id: string
    company_id: string
    full_name: string | null
    avatar_url: string | null
    role: 'admin' | 'user'
    created_at: string
}

export interface Contract {
    id: string
    company_id: string
    shopping_name: string
    media_type: string
    status: 'active' | 'pending' | 'expired'
    start_date: string
    end_date: string
    contract_value: number
    responsible_person: string
    notes: string | null
    created_at: string
}

export interface Opportunity {
    id: string
    company_id: string
    title: string
    client_name: string
    value: number
    stage: 'negotiation' | 'closed_won' | 'closed_lost'
    responsible_person: string
    notes: string | null
    created_at: string
}
