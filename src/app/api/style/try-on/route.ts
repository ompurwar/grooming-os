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

    // 1. Verify User and get preferences
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPrefs } = await supabase
      .from('users')
      .select('vto_engine')
      .eq('id', userData.user.id)
      .single()
      
    const enginePref = userPrefs?.vto_engine || 'openai'

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

    const provider = getVTOProvider(enginePref)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') || 'http://localhost:3000')
    const webhookUrl = `${appUrl}/api/webhooks/vto`
    let jobId: string

    if (provider.generateMultimodal) {
      // Multimodal VTO: Send all items at once
      const allItems = outfitItems
        .filter((oi: any) => (oi.wardrobe_items as any)?.image_url)
        .map((oi: any) => {
          const wItem = oi.wardrobe_items as any
          return {
            image_url: wItem.image_url,
            description: `${wItem.primary_color} ${wItem.sub_category || wItem.category}`,
            category: wItem.category
          }
        })
      
      console.log(`[TRY-ON API] Initiating Multimodal VTO Job with ${allItems.length} items for outfit: ${outfitId}`)
      const resultId = await provider.generateMultimodal(profile.front_photo_url, allItems, webhookUrl)
      console.log(`[TRY-ON API] Provider finished processing. Result starts with SYNC: ${resultId.startsWith('SYNC:')}`)

      if (resultId.startsWith('SYNC:')) {
        const tryOnUrl = resultId.replace('SYNC:', '')
        
        // Save the completed URL to the DB immediately
        await supabase
          .from('outfits')
          .update({ 
            try_on_image_url: tryOnUrl,
            vto_status: 'completed',
            vto_passes: null,
            vto_current_pass: null
          })
          .eq('id', outfitId)
          .eq('user_id', userData.user.id)

        // Return the final URL directly to the client
        return NextResponse.json({ success: true, tryOnImageUrl: tryOnUrl, status: 'completed' })
      }

      // Fallback if provider still uses webhooks
      jobId = resultId
      
      const { error: updateError } = await supabase
        .from('outfits')
        .update({ 
          vto_job_id: jobId,
          vto_status: 'processing',
          vto_passes: null, // No multiple passes needed
          vto_current_pass: null
        })
        .eq('id', outfitId)
        .eq('user_id', userData.user.id)

      if (updateError) {
        console.error('Failed to update outfit with vto status:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      return NextResponse.json({ success: true, jobId, status: 'processing', passes: [] })

    } else {
      // IDM-VTON Multi-pass logic
      const topItem = outfitItems.find((oi: any) => {
        const wItem = oi.wardrobe_items as any
        return wItem?.category === 'Top' || wItem?.category === 'Outerwear'
      })

      const bottomItem = outfitItems.find((oi: any) => {
        const wItem = oi.wardrobe_items as any
        return wItem?.category === 'Bottom' || wItem?.category === 'Pants' || wItem?.category === 'Shorts'
      })

      const passes = []
      
      if ((topItem?.wardrobe_items as any)?.image_url) {
        const wItem = topItem?.wardrobe_items as any
        passes.push({
          id: wItem.id,
          category: wItem.category,
          image_url: wItem.image_url,
          description: `${wItem.primary_color} ${wItem.sub_category || wItem.category}`,
          passType: 'Top'
        })
      }

      if ((bottomItem?.wardrobe_items as any)?.image_url) {
        const wItem = bottomItem?.wardrobe_items as any
        passes.push({
          id: wItem.id,
          category: wItem.category,
          image_url: wItem.image_url,
          description: `${wItem.primary_color} ${wItem.sub_category || wItem.category}`,
          passType: 'Bottom'
        })
      }

      if (passes.length === 0) {
        console.log('VTO API Error: No valid items found in outfit.')
        return NextResponse.json({ error: 'Outfit must contain a Top or Bottom for virtual try-on.' }, { status: 400 })
      }

      console.log(`Initiating Multi-Pass VTO Job (${passes.length} passes)...`)
      
      const firstPass = passes[0]
      const idmCategory = firstPass.passType === 'Top' ? 'upper_body' : (firstPass.passType === 'Bottom' ? 'lower_body' : 'upper_body');

      jobId = await provider.generate(
        profile.front_photo_url,
        firstPass.image_url,
        firstPass.description,
        webhookUrl,
        idmCategory
      )

      console.log('VTO Job started with ID:', jobId)

      const { error: updateError } = await supabase
        .from('outfits')
        .update({ 
          vto_job_id: jobId,
          vto_status: 'processing',
          vto_passes: passes,
          vto_current_pass: 0
        })
        .eq('id', outfitId)
        .eq('user_id', userData.user.id)

      if (updateError) {
        console.error('Failed to update outfit with vto status:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      return NextResponse.json({ success: true, jobId, status: 'processing', passes })
    }

  } catch (error: any) {
    console.error('Try On API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
