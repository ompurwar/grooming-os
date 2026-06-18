import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdminEmail } from '@/utils/admin'

export async function GET() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Total registered users (from auth.users via the 'users' table)
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // 2. Total wardrobe items (active only)
    const { count: totalWardrobeItems } = await supabaseAdmin
      .from('wardrobe_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 3. Total outfits generated
    const { count: totalOutfits } = await supabaseAdmin
      .from('outfits')
      .select('*', { count: 'exact', head: true })

    // 4. Total saved outfits
    const { count: totalSavedOutfits } = await supabaseAdmin
      .from('outfits')
      .select('*', { count: 'exact', head: true })
      .eq('is_saved', true)

    // 5. Total body scans
    const { count: totalBodyScans } = await supabaseAdmin
      .from('body_profiles')
      .select('*', { count: 'exact', head: true })

    // 6. Total face scans
    const { count: totalFaceScans } = await supabaseAdmin
      .from('face_profiles')
      .select('*', { count: 'exact', head: true })

    // 7. Total capsules
    const { count: totalCapsules } = await supabaseAdmin
      .from('capsules')
      .select('*', { count: 'exact', head: true })

    // 8. Per-user breakdown
    const { data: usersData } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false })

    // For each user, get their wardrobe count, outfit count, and scan statuses
    const userBreakdown = await Promise.all(
      (usersData || []).map(async (u: any) => {
        const [wardrobeRes, outfitRes, savedRes, bodyRes, faceRes] = await Promise.all([
          supabaseAdmin.from('wardrobe_items').select('*', { count: 'exact', head: true }).eq('user_id', u.id).eq('is_active', true),
          supabaseAdmin.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
          supabaseAdmin.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', u.id).eq('is_saved', true),
          supabaseAdmin.from('body_profiles').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
          supabaseAdmin.from('face_profiles').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
        ])

        return {
          id: u.id,
          email: u.email,
          fullName: u.full_name || null,
          joinedAt: u.created_at,
          wardrobeCount: wardrobeRes.count || 0,
          outfitCount: outfitRes.count || 0,
          savedCount: savedRes.count || 0,
          hasBodyScan: (bodyRes.count || 0) > 0,
          hasFaceScan: (faceRes.count || 0) > 0,
        }
      })
    )

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalWardrobeItems: totalWardrobeItems || 0,
        totalOutfits: totalOutfits || 0,
        totalSavedOutfits: totalSavedOutfits || 0,
        totalBodyScans: totalBodyScans || 0,
        totalFaceScans: totalFaceScans || 0,
        totalCapsules: totalCapsules || 0,
      },
      users: userBreakdown,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
