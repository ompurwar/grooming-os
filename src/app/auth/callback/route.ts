import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Successfully exchanged code for session
      // For new users, we redirect to plans selection.
      return NextResponse.redirect(`${origin}/plans`)
    }
  }

  // Return the user to an error page or login with some error parameters
  return NextResponse.redirect(`${origin}/login?error=Verification_failed`)
}
