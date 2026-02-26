import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

        // Create user with service role (admin API)
        const supabaseAdmin = await createClient({
            admin: true,
        })

        const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: crypto.getRandomValues(new Uint8Array(32)).toString(),
            email_confirm: true,
            user_metadata: {
                role,
                full_name,
            },
        })

        if (createError) {
            return NextResponse.json(
                { error: `Failed to create user: ${createError.message}` },
                { status: 400 }
            )
        }

        // Create profile entry (if not auto-created by trigger)
        if (newUser?.id) {
            const { error: profileCreateError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: newUser.id,
                    company_id: profile?.company_id || user.user_metadata?.company_id,
                    full_name,
                    role,
                })

            if (profileCreateError && !profileCreateError.message.includes('duplicate')) {
                console.error('Warning: Could not create profile:', profileCreateError)
                // Don't fail here - profile might be created by trigger
            }
        }

        return NextResponse.json({ user: newUser }, { status: 201 })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
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
