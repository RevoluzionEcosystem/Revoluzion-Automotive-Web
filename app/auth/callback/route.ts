import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/feed'

  // Password recovery (PKCE) — exchange the code server-side to set the session
  // cookie, then redirect to the reset page where the client reads the session.
  if (type === 'recovery' && code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
    }
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert profile on OAuth sign-in
      const meta = data.user.user_metadata
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: (meta.preferred_username || meta.email?.split('@')[0] || data.user.id).toLowerCase(),
        display_name: meta.full_name || meta.name || null,
        avatar_url: meta.avatar_url || meta.picture || null,
      }, { onConflict: 'id', ignoreDuplicates: true })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
