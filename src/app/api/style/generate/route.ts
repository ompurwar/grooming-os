import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { prompt, weatherContext, capsuleId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    // 2. Fetch user's wardrobe items and body profile
    let wardrobeItems: any[] = []
    
    if (capsuleId) {
      // Fetch ONLY items belonging to the capsule
      const { data: cItems, error: cError } = await supabase
        .from('capsule_items')
        .select(`
          wardrobe_items (
            id, category, sub_category, primary_color, pattern, material, formality_score, ai_tags
          )
        `)
        .eq('capsule_id', capsuleId)
        
      if (!cError && cItems) {
        wardrobeItems = cItems.map(c => c.wardrobe_items).filter(Boolean)
      }
    } else {
      // Fetch ALL active wardrobe items
      const { data: wItems, error: wError } = await supabase
        .from('wardrobe_items')
        .select('id, category, sub_category, primary_color, pattern, material, formality_score, ai_tags')
        .eq('user_id', userId)
        .eq('is_active', true)
        
      if (!wError && wItems) {
        wardrobeItems = wItems
      }
    }

    const { data: bodyProfile } = await supabase
      .from('body_profiles')
      .select('body_type, height_estimate, shoulder_width, torso_ratio, build, fit_recommendations')
      .eq('user_id', userId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single()

    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json({ error: `No wardrobe items found to style. Debug: capsuleId=${capsuleId || 'none'}, userId=${userId}, length=${wardrobeItems?.length || 0}` }, { status: 400 })
    }

    // 3. Ask OpenAI to select the best items
    // Prepare a simplified inventory string for the LLM
    const inventory = wardrobeItems.map((item: any) => ({
      id: item.id,
      description: `${item.primary_color} ${item.pattern || 'solid'} ${item.sub_category || item.category}`,
      category: item.category,
      material: item.material || 'Unknown',
      pattern: item.pattern || 'None',
      formality: item.formality_score,
      details: item.ai_tags?.join(', ') || ''
    }))

    const bodyContext = bodyProfile 
      ? `User Body Profile:\n- Build: ${bodyProfile.build} (${bodyProfile.body_type})\n- Height: ${bodyProfile.height_estimate}\n- Fit Recommendations: Tops should be ${bodyProfile.fit_recommendations?.top_fit || 'Regular'}.`
      : ''

    const weatherString = weatherContext 
      ? `Weather: ${weatherContext.temperature}°C, ${weatherContext.condition} in ${weatherContext.city}.`
      : ''

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an elite fashion stylist. You are given a user's prompt, weather conditions, body profile, and a list of their wardrobe items.
      Your task is to select a cohesive outfit (Top, Bottom, Footwear, optional Outerwear/Accessories).
      Rules:
      - Return the precise database IDs of the items you selected.
      - Write a short, engaging explanation (2-3 sentences) of why this outfit works.
      - Give the outfit a catchy name.`,
      messages: [
        {
          role: 'user',
          content: `Prompt: ${prompt}\n${weatherString}\n${bodyContext}\n\nInventory:\n${JSON.stringify(inventory, null, 2)}`
        }
      ],
      schema: z.object({
        outfit_name: z.string(),
        explanation: z.string(),
        selected_item_ids: z.array(z.string().uuid())
      })
    })

    if (object.selected_item_ids.length === 0) {
      return NextResponse.json({ error: 'AI failed to curate an outfit.' }, { status: 500 })
    }

    // Sort item IDs so identical outfits generate the same hash
    const sortedIds = [...object.selected_item_ids].sort()
    const itemsHash = crypto.createHash('sha256').update(sortedIds.join(',')).digest('hex')

    // 4. Save the Outfit to Supabase
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: outfitData, error: outfitError } = await supabaseAdmin
      .from('outfits')
      .insert({
        user_id: userId,
        capsule_id: capsuleId || null,
        occasion: object.outfit_name,
        prompt_text: prompt,
        reasoning: object.explanation,
        weather_context: weatherContext || null,
        is_saved: false,
        items_hash: itemsHash
      })
      .select('id')
      .single()

    if (outfitError) {
      console.error('Failed to save outfit:', outfitError)
      return NextResponse.json({ error: `Failed to save outfit. ${outfitError.message}` }, { status: 500 })
    }

    const outfitId = outfitData.id

    // 5. Save Outfit Items
    const outfitItemsPayload = object.selected_item_ids.map((itemId: string) => {
      const item = wardrobeItems.find((w: any) => w.id === itemId)
      return {
        outfit_id: outfitId,
        wardrobe_item_id: itemId,
        slot: item?.category || 'Unknown'
      }
    })

    const { error: linkingError } = await supabaseAdmin
      .from('outfit_items')
      .insert(outfitItemsPayload)

    if (linkingError) {
      console.error('Failed to link outfit items:', linkingError)
      return NextResponse.json({ error: `Failed to link items. ${linkingError.message}` }, { status: 500 })
    }

    // Return the generated outfit details
    return NextResponse.json({
      success: true,
      outfitId,
      name: object.outfit_name,
      explanation: object.explanation
    })

  } catch (error: any) {
    console.error('Styling API error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
