import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const {
      prompt,
      weatherContext,
      categoryToSelect,
      aestheticIntent,
      previousSelections,
      capsuleId,
      requiredItemIds
    } = await request.json()

    if (!prompt || !categoryToSelect || !aestheticIntent) {
      return NextResponse.json(
        { error: 'prompt, categoryToSelect, and aestheticIntent are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    // 2. Fetch wardrobe items filtered to ONLY the categoryToSelect
    let wardrobeItems: any[] = []

    if (capsuleId) {
      // Fetch items belonging to the capsule, then filter by category
      const { data: cItems, error: cError } = await supabase
        .from('capsule_items')
        .select(`
          wardrobe_items (
            id, category, sub_category, primary_color, pattern, material, formality_score, ai_tags, image_url
          )
        `)
        .eq('capsule_id', capsuleId)

      if (!cError && cItems) {
        wardrobeItems = cItems
          .map(c => c.wardrobe_items)
          .filter(Boolean)
          .filter((item: any) => item.category === categoryToSelect)
      }
    } else {
      // Fetch active wardrobe items filtered by category
      const { data: wItems, error: wError } = await supabase
        .from('wardrobe_items')
        .select('id, category, sub_category, primary_color, pattern, material, formality_score, ai_tags, image_url')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('category', categoryToSelect)

      if (!wError && wItems) {
        wardrobeItems = wItems
      }
    }

    // 3. Fetch body_profiles, face_profiles, style_preferences
    const { data: bodyProfile } = await supabase
      .from('body_profiles')
      .select('body_type, height_estimate, shoulder_width, torso_ratio, build, fit_recommendations')
      .eq('user_id', userId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: faceProfile } = await supabase
      .from('face_profiles')
      .select('skin_tone, undertone, color_palette, metal_preference')
      .eq('user_id', userId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: stylePrefs } = await supabase
      .from('style_preferences')
      .select('style_archetype, preferred_colors, avoid_colors, formality_preference')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json(
        { error: `No ${categoryToSelect} items found in wardrobe.` },
        { status: 400 }
      )
    }

    // 4. Build inventory list of items in this category
    const inventory = wardrobeItems.map((item: any) => {
      const tags = item.ai_tags && item.ai_tags.length > 0 ? ` [Fit/Tags: ${item.ai_tags.join(', ')}]` : ''
      return {
        id: item.id,
        description: `${item.primary_color} ${item.pattern || 'solid'} ${item.sub_category || item.category}${tags}`,
        category: item.category,
        material: item.material || 'Unknown',
        pattern: item.pattern || 'None',
        formality: item.formality_score
      }
    })

    // 5. Check if any requiredItemIds match items in this category — auto-select if so
    if (requiredItemIds && requiredItemIds.length > 0) {
      const requiredInCategory = wardrobeItems.filter((item: any) =>
        requiredItemIds.includes(item.id)
      )

      if (requiredInCategory.length > 0) {
        const autoSelected = requiredInCategory[0]
        return NextResponse.json({
          selectedItem: {
            id: autoSelected.id,
            category: autoSelected.category,
            description: `${autoSelected.primary_color} ${autoSelected.pattern || 'solid'} ${autoSelected.sub_category || autoSelected.category}`,
            imageUrl: autoSelected.image_url || null,
            reason: 'This item was explicitly selected by the user as a required piece for this outfit.'
          },
          aestheticNotes: 'Anchoring the outfit around the user\'s chosen piece.'
        })
      }
    }

    // 6. Build context strings
    const bodyContext = bodyProfile
      ? `User Body Profile:\n- Build: ${bodyProfile.build} (${bodyProfile.body_type})\n- Height: ${bodyProfile.height_estimate}\n- Fit Recommendations: Tops should be ${bodyProfile.fit_recommendations?.top_fit || 'Regular'}.`
      : ''

    const faceContext = faceProfile
      ? `User Face/Color Profile:\n- Skin Tone: ${faceProfile.skin_tone} (${faceProfile.undertone} undertone)\n- Color Season: ${faceProfile.color_palette?.season}\n- Best Colors: ${faceProfile.color_palette?.best_colors?.join(', ')}\n- Avoid Colors: ${faceProfile.color_palette?.avoid_colors?.join(', ')}\n- Best Metals: ${faceProfile.metal_preference}.`
      : ''

    const styleContext = stylePrefs
      ? `User Style Preferences:\n- Aesthetic/Archetype: ${stylePrefs.style_archetype}\n- Preferred Colors: ${stylePrefs.preferred_colors?.join(', ')}\n- General Formality: ${stylePrefs.formality_preference || 'Balanced'}.`
      : ''

    const weatherString = weatherContext
      ? `Weather: ${weatherContext.temperature}°C, ${weatherContext.condition} in ${weatherContext.city}.`
      : ''

    const previousSelectionsFormatted = (previousSelections && previousSelections.length > 0)
      ? previousSelections.map((s: any) => `- ${s.category}: ${s.description} (Reason: ${s.reason})`).join('\n')
      : 'None yet — this is the first piece.'

    // 7. Call generateObject
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an elite fashion stylist building an outfit step-by-step.
You are selecting the best ${categoryToSelect} from the user's wardrobe.

Aesthetic Direction: ${aestheticIntent}
- harmonious: tonal, monochromatic, analogous palette
- contrasting: bold color/texture contrast
- fun: playful patterns, unexpected combinations
- relaxed: soft textures, loose silhouettes, muted tones
- sharp: structured, tailored, high-formality

Previous selections (already locked in for this outfit):
${previousSelectionsFormatted}

Your task:
- Pick exactly ONE item that best complements the previous selections
- Consider silhouette balance, color harmony/contrast (per aesthetic intent), material weight, weather, and formality consistency
- **CRITICAL SILHOUETTE BALANCE:** Pay strict attention to the [Fit/Tags] of previous items! Do NOT create disjointed silhouettes (e.g., do not pair oversized/boxy tops with skinny/tapered bottoms, or extremely slim tops with super baggy bottoms). Match proportions carefully (e.g., oversized with relaxed/wide, slim with slim/tailored).
- Explain WHY this item works with the previous picks in 2-3 sentences
- Provide a brief aesthetic note describing the evolving direction of the outfit`,
      messages: [
        {
          role: 'user',
          content: `Prompt: ${prompt}\n\n${weatherString}\n\n${bodyContext}\n\n${faceContext}\n\n${styleContext}\n\nAvailable ${categoryToSelect} items:\n${JSON.stringify(inventory, null, 2)}`
        }
      ],
      schema: z.object({
        selected_item_id: z.string().uuid(),
        reason: z.string(),
        aesthetic_notes: z.string()
      })
    })

    // 8. Build response
    const selectedItem = wardrobeItems.find((item: any) => item.id === object.selected_item_id)

    if (!selectedItem) {
      return NextResponse.json(
        { error: 'AI selected an item ID not found in the wardrobe.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      selectedItem: {
        id: selectedItem.id,
        category: selectedItem.category,
        description: `${selectedItem.primary_color} ${selectedItem.pattern || 'solid'} ${selectedItem.sub_category || selectedItem.category}${selectedItem.ai_tags && selectedItem.ai_tags.length > 0 ? ` [Fit/Tags: ${selectedItem.ai_tags.join(', ')}]` : ''}`,
        imageUrl: selectedItem.image_url || null,
        reason: object.reason
      },
      aestheticNotes: object.aesthetic_notes
    })

  } catch (error: any) {
    console.error('Generate-step API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}
