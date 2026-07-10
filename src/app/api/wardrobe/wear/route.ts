import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { outfitId, notes } = await req.json()

    if (!outfitId) {
      return NextResponse.json({ error: 'outfitId is required' }, { status: 400 })
    }

    const { data: outfitHistory, error } = await supabase
      .from('outfit_history')
      .insert({
        user_id: session.user.id,
        outfit_id: outfitId,
        worn_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        notes: notes || 'Worn today'
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging wear:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, outfitHistory })
  } catch (error: any) {
    console.error('Error in wear API:', error)
    return NextResponse.json({ error: 'Failed to log wear' }, { status: 500 })
  }
}
