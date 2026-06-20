import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && session?.user) {
      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile?.onboarding_completed) {
        return NextResponse.redirect(`${origin}/home`)
      }

      // For new users or incomplete onboarding, redirect to plans selection.
      return NextResponse.redirect(`${origin}/plans`)
    }
  }

  // Return the user to an error page or login with some error parameters
  return NextResponse.redirect(`${origin}/login?error=Verification_failed`)
}
