import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject, embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const { destinations, days, bagSize } = await request.json()

    if (!destinations || !days || !bagSize) {
      return NextResponse.json({ error: 'Destinations, days, and bag size are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    // 2. Fetch user's body profile
    const { data: bodyProfile } = await supabase
      .from('body_profiles')
      .select('body_type, height_estimate, shoulder_width, torso_ratio, build, fit_recommendations')
      .eq('user_id', userId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single()

    // 3. Create travel prompt and embed it
    const travelPrompt = `Travel capsule for a ${days}-day trip to ${destinations}. Bag size constraint: ${bagSize}. Need versatile, cohesive items.`
    
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: travelPrompt,
    })

    // 4. Perform Semantic Search (RAG) to get top ~40 items
    // Using the RPC function we created in the migration
    const { data: matchedItems, error: matchError } = await supabase
      .rpc('match_wardrobe_items', {
        query_embedding: embedding,
        match_threshold: 0.2, // Adjust threshold as needed
        match_count: 40,
        p_user_id: userId
      })

    if (matchError || !matchedItems || matchedItems.length === 0) {
      console.error('Semantic search error:', matchError)
      return NextResponse.json({ error: 'Could not find enough matching items in wardrobe.' }, { status: 400 })
    }

    // 5. Fetch full item details for the matched IDs
    const matchedItemIds = matchedItems.map((m: any) => m.id)
    const { data: wardrobeItems, error: itemsError } = await supabase
      .from('wardrobe_items')
      .select('id, category, sub_category, primary_color, pattern, material, formality_score, ai_tags')
      .in('id', matchedItemIds)

    if (itemsError || !wardrobeItems) {
      return NextResponse.json({ error: 'Failed to fetch wardrobe item details.' }, { status: 500 })
    }

    // 6. Ask OpenAI to curate the final capsule
    const inventory = wardrobeItems.map(item => ({
      id: item.id,
      description: `${item.primary_color} ${item.pattern || 'solid'} ${item.sub_category || item.category}`,
      category: item.category,
      material: item.material || 'Unknown',
      pattern: item.pattern || 'None',
      formality: item.formality_score,
      details: item.ai_tags?.join(', ') || ''
    }))

    const bodyContext = bodyProfile 
      ? `User Body Profile:\n- Build: ${bodyProfile.build} (${bodyProfile.body_type})\n- Height: ${bodyProfile.height_estimate}\n- Shoulders: ${bodyProfile.shoulder_width}\n- Torso: ${bodyProfile.torso_ratio}\n- Fit Recommendations: Tops should be ${bodyProfile.fit_recommendations?.top_fit || 'Regular'}, Bottoms should be ${bodyProfile.fit_recommendations?.bottom_fit || 'Regular'}.`
      : 'User Body Profile: Unknown. Assume average build.'

    // Determine target item counts based on bag size in Liters
    const capacityLiters = parseInt(bagSize) || 40
    let itemLimits = "Total ~12 items (4 Tops, 3 Bottoms, 1 Outerwear, 2 Shoes, 2 Accessories)" // 30-55L (Carry-on)
    if (capacityLiters < 30) itemLimits = "Total ~6 items (2 Tops, 1 Bottom, 1 Shoe, 2 Accessories)" // <30L (Backpack)
    if (capacityLiters > 55) itemLimits = "Total ~20 items (7 Tops, 5 Bottoms, 2 Outerwear, 3 Shoes, 3 Accessories)" // >55L (Checked Bag)

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an elite travel stylist. You are given a user's travel itinerary, their body profile, and a pre-filtered list of their most relevant wardrobe items.
      Your task is to select a cohesive Travel Capsule.
      Rules:
      - Strictly respect the Bag Size Constraints: ${itemLimits}.
      - Choose items that can be mixed and matched to create multiple outfits for the ${days} days.
      - Return the precise database IDs of the items you selected.
      - Write a short, engaging explanation (2-3 sentences) of your packing strategy and why these items work well together for ${destinations}.
      - Give the capsule a catchy title (e.g. 'Parisian Summer Chic', 'Tokyo Streetwear Weekend').`,
      messages: [
        {
          role: 'user',
          content: `Destinations: ${destinations}\nDays: ${days}\nBag Capacity: ${bagSize} Liters\n\n${bodyContext}\n\nPre-filtered Inventory:\n${JSON.stringify(inventory, null, 2)}`
        }
      ],
      schema: z.object({
        capsule_name: z.string(),
        explanation: z.string(),
        selected_item_ids: z.array(z.string().uuid()),
        core_item_ids: z.array(z.string().uuid()).describe("A subset of selected_item_ids that act as the versatile core bases")
      })
    })

    if (object.selected_item_ids.length === 0) {
      return NextResponse.json({ error: 'AI failed to curate a capsule.' }, { status: 500 })
    }

    // 7. Save the Capsule to Supabase using Admin client to bypass RLS issues
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: capsuleData, error: capsuleError } = await supabaseAdmin
      .from('capsules')
      .insert({
        user_id: userId,
        title: object.capsule_name,
        destinations,
        days: parseInt(days),
        bag_size: bagSize,
        reasoning: object.explanation
      })
      .select('id')
      .single()

    if (capsuleError) {
      console.error('Failed to save capsule:', capsuleError)
      return NextResponse.json({ error: 'Failed to save capsule.' }, { status: 500 })
    }

    const capsuleId = capsuleData.id

    // 8. Save Capsule Items
    const capsuleItemsPayload = object.selected_item_ids.map(itemId => {
      return {
        capsule_id: capsuleId,
        wardrobe_item_id: itemId,
        is_core_item: object.core_item_ids.includes(itemId)
      }
    })

    const { error: linkingError } = await supabaseAdmin
      .from('capsule_items')
      .insert(capsuleItemsPayload)

    if (linkingError) {
      console.error('Failed to link capsule items:', linkingError)
      return NextResponse.json({ error: 'Failed to link items.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      capsuleId,
      name: object.capsule_name
    })

  } catch (error: any) {
    console.error('Capsule generation API error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
