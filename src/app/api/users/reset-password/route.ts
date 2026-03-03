import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/users/reset-password - Reset user password (admin only)
 * Body: { userId: string, newPassword: string }
 */
export async function PATCH(request: NextRequest) {
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
            return NextResponse.json({ error: 'Forbidden: Only admins can reset passwords' }, { status: 403 })
        }

        const { userId, newPassword } = await request.json()

        if (!userId || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields: userId, newPassword' }, { status: 400 })
        }

        if (userId === user.id) {
            return NextResponse.json(
                { error: 'Use the profile modal to change your own password' },
                { status: 400 }
            )
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
        }

        const supabaseAdmin = await createClient({ admin: true })

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        })

        if (resetError) {
            return NextResponse.json({ error: resetError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PATCH /api/users/reset-password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
