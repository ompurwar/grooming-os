import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const { prompt, weatherContext } = await request.json()

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

    // 2. Fetch user's active wardrobe items
    const { data: wardrobeItems, error: itemsError } = await supabase
      .from('wardrobe_items')
      .select('id, category, sub_category, primary_color, pattern, material, formality_score, ai_tags')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (itemsError || !wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json({ error: 'No wardrobe items found to style.' }, { status: 400 })
    }

    // 3. Ask OpenAI to select the best items
    // Prepare a simplified inventory string for the LLM
    const inventory = wardrobeItems.map(item => ({
      id: item.id,
      description: `${item.primary_color} ${item.sub_category || item.category}`,
      category: item.category,
      formality: item.formality_score,
      details: item.ai_tags?.join(', ') || ''
    }))

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an elite personal stylist. You are given a user's prompt for an occasion/mood, their local weather context, and their available wardrobe inventory.
      Your task is to select the BEST combination of items for an outfit.
      Rules:
      - Strictly respect the weather context (e.g. recommend outerwear if cold, shorts if hot, etc.).
      - Select exactly one Top and one Bottom.
      - Optionally select Footwear, Outerwear, and Accessories if appropriate and available in the inventory.
      - Ensure the colors match and the formality level is appropriate for the prompt.
      - Return the precise database IDs of the items you selected.
      - Write a short, engaging explanation (1-2 sentences) of why you chose this look, specifically referencing how it suits the weather.
      - Give the outfit a catchy title (e.g. 'Rooftop Elegance', 'Casual Friday').`,
      messages: [
        {
          role: 'user',
          content: `Prompt: "${prompt}"\n\nWeather: ${weatherContext ? `${weatherContext.temperature}°C, ${weatherContext.condition} in ${weatherContext.city}` : 'Unknown'}\n\nInventory:\n${JSON.stringify(inventory, null, 2)}`
        }
      ],
      schema: z.object({
        outfit_name: z.string(),
        explanation: z.string(),
        selected_item_ids: z.array(z.string().uuid())
      })
    })

    if (object.selected_item_ids.length === 0) {
      return NextResponse.json({ error: 'AI failed to select any items.' }, { status: 500 })
    }

    // 4. Save the Outfit to Supabase
    const { data: outfitData, error: outfitError } = await supabase
      .from('outfits')
      .insert({
        user_id: userId,
        occasion: object.outfit_name,
        prompt_text: prompt,
        reasoning: object.explanation,
        weather_context: weatherContext || null,
        is_saved: false
      })
      .select('id')
      .single()

    if (outfitError) {
      console.error('Failed to save outfit:', outfitError)
      return NextResponse.json({ error: 'Failed to save outfit.' }, { status: 500 })
    }

    const outfitId = outfitData.id

    // 5. Save Outfit Items
    const outfitItemsPayload = object.selected_item_ids.map(itemId => {
      const item = wardrobeItems.find(w => w.id === itemId)
      return {
        outfit_id: outfitId,
        wardrobe_item_id: itemId,
        slot: item?.category || 'Unknown'
      }
    })

    const { error: linkingError } = await supabase
      .from('outfit_items')
      .insert(outfitItemsPayload)

    if (linkingError) {
      console.error('Failed to link outfit items:', linkingError)
      return NextResponse.json({ error: 'Failed to link items.' }, { status: 500 })
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
