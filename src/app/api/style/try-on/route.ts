import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getVTOProvider } from '@/lib/vto/vtoService'

export async function POST(request: Request) {
  try {
    const { outfitId } = await request.json()

    if (!outfitId) {
      console.log('VTO API Error: Missing outfitId')
      return NextResponse.json({ error: 'Outfit ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verify User
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch Human Image
    const { data: profile, error: profileError } = await supabase
      .from('body_profiles')
      .select('front_photo_url')
      .eq('user_id', userData.user.id)
      .single()

    if (profileError || !profile?.front_photo_url) {
      console.log('VTO API Error: Missing front photo', profileError)
      return NextResponse.json({ error: 'Please complete the Body Scan onboarding first to upload a front photo.' }, { status: 400 })
    }

    // 3. Fetch Garment Image
    const { data: outfitItems, error: itemsError } = await supabase
      .from('outfit_items')
      .select(`
        wardrobe_items (
          category,
          image_url,
          sub_category,
          primary_color
        )
      `)
      .eq('outfit_id', outfitId)

    if (itemsError || !outfitItems) {
      console.log('VTO API Error: Could not fetch outfit items', itemsError)
      return NextResponse.json({ error: 'Could not fetch outfit items' }, { status: 400 })
    }

    const topItem = outfitItems.find((oi: any) => {
      const wItem = oi.wardrobe_items as any
      return wItem?.category === 'Top' || wItem?.category === 'Outerwear'
    })

    const wItem = topItem?.wardrobe_items as any

    if (!wItem?.image_url) {
      console.log('VTO API Error: No Top or Outerwear found in outfit.')
      return NextResponse.json({ error: 'Outfit must contain a Top or Outerwear for virtual try-on.' }, { status: 400 })
    }

    // 4. Initiate VTO Job
    console.log('Initiating VTO Job...')
    const provider = getVTOProvider()
    
    // Construct the webhook URL dynamically based on the current environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') || 'http://localhost:3000')
    const webhookUrl = `${appUrl}/api/webhooks/vto`
    const description = `${wItem.primary_color} ${wItem.sub_category || wItem.category}`

    const jobId = await provider.generate(
      profile.front_photo_url,
      wItem.image_url,
      description,
      webhookUrl
    )

    console.log('VTO Job started with ID:', jobId)

    // 5. Update the outfit status
    const { error: updateError } = await supabase
      .from('outfits')
      .update({ 
        vto_job_id: jobId,
        vto_status: 'processing'
      })
      .eq('id', outfitId)
      .eq('user_id', userData.user.id)

    if (updateError) {
      console.error('Failed to update outfit with vto status:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: 'processing'
    })

  } catch (error: any) {
    console.error('Try On API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
