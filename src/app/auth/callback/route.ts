import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Successfully exchanged code for session
      // For new users, we redirect to onboarding. For existing users, home.
      // Since this is email verification from signup, onboarding makes the most sense.
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  // Return the user to an error page or login with some error parameters
  return NextResponse.redirect(`${origin}/login?error=Verification_failed`)
}
