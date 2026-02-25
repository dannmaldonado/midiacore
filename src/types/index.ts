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
    // Story 1.1 — novos campos
    negotiation?: string | null
    media_properties?: string[] | null
    contract_docs?: string | null
    layouts_url?: string | null
    pending_quotes?: string | null
    comments?: string | null
}

export interface Opportunity {
    id: string
    company_id: string
    title: string
    client_name: string
    value: number
    stage: string
    responsible_person: string
    notes: string | null
    created_at: string
    // Story 1.1 — novos campos
    frequency?: string | null
    social_media_plan?: string | null
    new_media_target?: string | null
    events_plan?: string | null
}

export interface Contact {
    id: string
    company_id: string
    name: string
    role?: string | null
    company_name?: string | null
    phone?: string | null
    email?: string | null
    created_at: string
    // Story 1.1 — novos campos
    contact_type: 'store_manager' | 'shopping_mkt'
    shopping_name?: string | null
}

export interface ApprovalWorkflow {
    id: string
    contract_id: string
    current_step: string
    step_status: 'pending' | 'approved' | 'rejected' | 'skipped'
    assigned_to: string | null
    deadline: string | null
    completed_at: string | null
    notes: string | null
    created_at: string
}
