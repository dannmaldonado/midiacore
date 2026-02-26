'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type User, type Session, type AuthChangeEvent } from '@supabase/supabase-js'

import { Profile } from '@/types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    isAdmin: boolean
    isEditor: boolean
    isViewer: boolean
    canEdit: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    isEditor: false,
    isViewer: false,
    canEdit: false,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        let isMounted = true
        // eslint-disable-next-line prefer-const
        let timeoutId: NodeJS.Timeout | undefined

        const fetchProfile = async (userId: string) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (!error && data && isMounted) {
                    setProfile(data)
                } else if (error && isMounted) {
                    console.error('[Auth] Falha ao carregar perfil:', error.message)
                }
            } catch (err) {
                if (isMounted) {
                    console.error('[Auth] Erro ao buscar perfil:', err)
                }
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                const currentUser = session?.user ?? null

                if (isMounted) {
                    setUser(currentUser)

                    if (currentUser) {
                        await fetchProfile(currentUser.id)
                    } else {
                        setProfile(null)
                    }

                    setLoading(false)
                    clearTimeout(timeoutId)
                }
            }
        )

        // Fallback: se auth não completar em 8 segundos, assumir não autenticado
        // (aumentado de 3s para 8s para lidar com lock issues do Supabase)
        timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('[Auth] Timeout ao aguardar sessão')
                setLoading(false)
            }
        }, 8000)

        return () => {
            isMounted = false
            clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [supabase])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }, [supabase, router])

    const authValue = useMemo(() => ({
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isEditor: profile?.role === 'editor',
        isViewer: profile?.role === 'viewer',
        canEdit: profile?.role === 'admin' || profile?.role === 'editor',
        signOut,
    }), [profile, user, loading, signOut])

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
