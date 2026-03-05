import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/users - List users with emails (admin only)
 * Returns profiles enriched with email from Supabase Auth
 */
export async function GET() {
    try {
        const supabaseClient = await createClient()

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const supabaseAdmin = await createClient({ admin: true })

        const [profilesResult, authResult] = await Promise.all([
            supabaseClient.from('profiles').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.auth.admin.listUsers(),
        ])

        if (profilesResult.error) {
            return NextResponse.json({ error: profilesResult.error.message }, { status: 400 })
        }

        const authUsers = authResult.data?.users ?? []
        const enriched = (profilesResult.data ?? []).map(p => ({
            ...p,
            email: authUsers.find(u => u.id === p.id)?.email,
        }))

        return NextResponse.json({ users: enriched })
    } catch (error) {
        console.error('GET /api/users error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/users - Create new user (admin only)
 * Body: { email: string, full_name: string, role: 'admin' | 'editor' | 'viewer' }
 */
export async function POST(request: NextRequest) {
    try {
        const supabaseClient = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized: Not authenticated' },
                { status: 401 }
            )
        }

        // Verify admin role
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden: Only admins can create users' },
                { status: 403 }
            )
        }

        // Parse request body
        const { email, full_name, role } = await request.json()

        if (!email || !full_name || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: email, full_name, role' },
                { status: 400 }
            )
        }

        // Validate role
        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            )
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]
        const tempPassword = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')

        let newUserId: string | null = null

        if (serviceKey.startsWith('sb_secret_') && projectRef) {
            // New Supabase Secret Key: use Management API
            const mgmtResponse = await fetch(
                `https://api.supabase.com/v1/projects/${projectRef}/auth/users`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password: tempPassword,
                        email_confirm: true,
                        user_metadata: { role, full_name },
                    }),
                }
            )

            if (!mgmtResponse.ok) {
                const errorData = await mgmtResponse.json()
                console.error('Management API createUser error:', JSON.stringify(errorData))
                return NextResponse.json(
                    { error: `Failed to create user: ${errorData.message || JSON.stringify(errorData)}` },
                    { status: 400 }
                )
            }

            const createdUser = await mgmtResponse.json()
            newUserId = createdUser.id
        } else {
            // Legacy JWT service_role key: use SDK
            const supabaseAdmin = await createClient({ admin: true })
            const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { role, full_name },
            })

            if (createError) {
                console.error('createUser error:', JSON.stringify(createError))
                return NextResponse.json(
                    { error: `Failed to create user: ${createError.message || createError.code || JSON.stringify(createError)}` },
                    { status: 400 }
                )
            }
            newUserId = newUser?.id ?? null
        }

        // Create profile entry (if not auto-created by trigger)
        if (newUserId) {
            const supabaseAdmin = await createClient({ admin: true })
            const { error: profileCreateError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: newUserId,
                    company_id: profile?.company_id || user.user_metadata?.company_id,
                    full_name,
                    role,
                })

            if (profileCreateError && !profileCreateError.message.includes('duplicate')) {
                console.error('Warning: Could not create profile:', profileCreateError)
            }
        }

        return NextResponse.json({ user: { id: newUserId } }, { status: 201 })
    } catch (error) {
        console.error('API error:', error)
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/users - Update user role (admin only)
 * Body: { userId: string, role: 'admin' | 'editor' | 'viewer' }
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabaseClient = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized: Not authenticated' },
                { status: 401 }
            )
        }

        // Verify admin role
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden: Only admins can update roles' },
                { status: 403 }
            )
        }

        // Parse request body
        const { userId, role } = await request.json()

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, role' },
                { status: 400 }
            )
        }

        if (!['admin', 'editor', 'viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            )
        }

        // Update profile role
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ role })
            .eq('id', userId)

        if (updateError) {
            return NextResponse.json(
                { error: updateError.message },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/users - Deactivate user (admin only)
 * Body: { userId: string }
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabaseClient = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized: Not authenticated' },
                { status: 401 }
            )
        }

        // Verify admin role
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden: Only admins can deactivate users' },
                { status: 403 }
            )
        }

        // Parse request body
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required field: userId' },
                { status: 400 }
            )
        }

        // Prevent self-deactivation
        if (userId === user.id) {
            return NextResponse.json(
                { error: 'Cannot deactivate yourself' },
                { status: 400 }
            )
        }

        // Deactivate user via admin API
        const supabaseAdmin = await createClient({
            admin: true,
        })

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            return NextResponse.json(
                { error: deleteError.message },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
