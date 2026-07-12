import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const capsuleId = resolvedParams.id

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if capsule belongs to user
    const { data: capsule, error: capsuleError } = await supabaseAdmin
      .from('capsules')
      .select('id')
      .eq('id', capsuleId)
      .eq('user_id', session.user.id)
      .single()

    if (capsuleError || !capsule) {
      console.error('Capsule fetch error:', capsuleError)
      return NextResponse.json({ error: 'Capsule not found or unauthorized' }, { status: 404 })
    }

    // Check if there are any outfits associated with this capsule
    const { count, error: countError } = await supabaseAdmin
      .from('outfits')
      .select('*', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)

    if (countError) {
      console.error('Error checking outfits count:', countError)
      return NextResponse.json({ error: 'Failed to check capsule associations' }, { status: 500 })
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a capsule that has looks associated with it.' },
        { status: 400 }
      )
    }

    // Safe to delete capsule
    const { error: deleteError } = await supabaseAdmin
      .from('capsules')
      .delete()
      .eq('id', capsuleId)

    if (deleteError) {
      console.error('Error deleting capsule:', deleteError)
      return NextResponse.json({ error: 'Failed to delete capsule' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Unexpected error in DELETE capsule:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const capsuleId = resolvedParams.id

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if capsule belongs to user
    const { data: capsule, error: capsuleError } = await supabaseAdmin
      .from('capsules')
      .select('id')
      .eq('id', capsuleId)
      .eq('user_id', session.user.id)
      .single()

    if (capsuleError || !capsule) {
      console.error('Capsule fetch error:', capsuleError)
      return NextResponse.json({ error: 'Capsule not found or unauthorized' }, { status: 404 })
    }

    // Fetch capsule items using Admin client to bypass RLS cache/policy limits on the client
    const { data: capsuleItems, error: itemsError } = await supabaseAdmin
      .from('capsule_items')
      .select('wardrobe_item_id')
      .eq('capsule_id', capsuleId)

    if (itemsError) {
      console.error('Error fetching capsule items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch capsule items' }, { status: 500 })
    }

    const itemIds = (capsuleItems || []).map((c: any) => c.wardrobe_item_id)
    return NextResponse.json({ itemIds })
  } catch (err: any) {
    console.error('Unexpected error in GET capsule items:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
