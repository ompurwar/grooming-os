import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdminEmail } from '@/utils/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Fetch User Profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Fetch Wardrobe Items
    const { data: wardrobeItems } = await supabaseAdmin
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('added_at', { ascending: false })

    // 3. Fetch Outfits (with outfit_items and joined wardrobe_items)
    const { data: outfits } = await supabaseAdmin
      .from('outfits')
      .select(`
        *,
        outfit_items (
          id, slot,
          wardrobe_items (
            id, category, sub_category, primary_color, image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 4. Fetch Body Profile
    const { data: bodyProfile } = await supabaseAdmin
      .from('body_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // 5. Fetch Face Profile
    const { data: faceProfile } = await supabaseAdmin
      .from('face_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        joinedAt: profile.created_at,
      },
      wardrobe: wardrobeItems || [],
      outfits: outfits || [],
      profiles: {
        body: bodyProfile || null,
        face: faceProfile || null,
      }
    })
  } catch (err) {
    console.error('Error fetching user details:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
