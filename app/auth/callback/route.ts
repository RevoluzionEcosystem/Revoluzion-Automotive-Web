import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const origin = url.origin
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/feed'

  // helper to read cookie value from incoming request
  const cookieHeader = request.headers.get('cookie') || ''
  const getCookie = (name: string) => {
    const parts = cookieHeader.split(';').map((p) => p.trim())
    const found = parts.find((p) => p.startsWith(name + '='))
    if (!found) return null
    return decodeURIComponent(found.substring(name.length + 1))
  }
  const secureFlag = origin.startsWith('https:') ? 'Secure; ' : ''
  const clearCookie = `rev_oauth_state=; Path=/; Max-Age=0; ${secureFlag}SameSite=Lax; HttpOnly`

  // Password recovery (PKCE) — exchange the code server-side to set the session
  // cookie, then redirect to the reset page where the client reads the session.
  if (type === 'recovery' && code) {
    // validate state cookie if present
    const stateParam = searchParams.get('state')
    if (stateParam) {
      const cookieState = getCookie('rev_oauth_state')
      if (!cookieState || cookieState !== stateParam) {
        const resp = NextResponse.redirect(`${origin}/forgot-password?error=invalid_state`)
        resp.headers.set('Set-Cookie', clearCookie)
        return resp
      }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const resp = NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
      resp.headers.set('Set-Cookie', clearCookie)
      return resp
    }
    const resp = NextResponse.redirect(`${origin}/reset-password`)
    resp.headers.set('Set-Cookie', clearCookie)
    return resp
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert user on OAuth sign-in
      const meta = data.user.user_metadata
      await supabase.from('users').upsert({
        id: data.user.id,
        username: (meta.preferred_username || meta.email?.split('@')[0] || data.user.id).toLowerCase(),
        display_name: meta.full_name || meta.name || null,
        avatar_url: meta.avatar_url || meta.picture || null,
      }, { onConflict: 'id', ignoreDuplicates: true })

      const resp = NextResponse.redirect(`${origin}${next}`)
      resp.headers.set('Set-Cookie', clearCookie)
      return resp
    }
  }

  const resp = NextResponse.redirect(`${origin}/login?error=auth_failed`)
  resp.headers.set('Set-Cookie', clearCookie)
  return resp
}
