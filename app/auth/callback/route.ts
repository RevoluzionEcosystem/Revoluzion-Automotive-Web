import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'

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
