import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    // 2. Fetch capsules using Admin client to bypass any RLS cache issues on user's remote
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: capsules, error } = await supabaseAdmin
      .from('capsules')
      .select('id, title, destinations, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to fetch capsules:', error)
      return NextResponse.json({ error: 'Failed to fetch capsules' }, { status: 500 })
    }

    return NextResponse.json({ capsules })
  } catch (error: any) {
    console.error('Capsules API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
