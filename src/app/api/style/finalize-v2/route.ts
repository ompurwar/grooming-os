import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const {
      prompt,
      weatherContext,
      aestheticIntent,
      selections
    } = await request.json()

    if (!prompt || !selections || selections.length === 0) {
      return NextResponse.json(
        { error: 'prompt and selections are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Authenticate user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    // 2. Generate outfit name and overall explanation from AI
    const selectionsSummary = selections
      .map((s: any) => `- ${s.category}: ${s.reason}`)
      .join('\n')

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an elite fashion stylist. Given the user's occasion prompt, aesthetic intent, and per-item reasoning for a completed outfit, provide a catchy outfit name and a 2-3 sentence overall explanation that ties all the pieces together.`,
      messages: [
        {
          role: 'user',
          content: `Prompt: ${prompt}\nAesthetic Intent: ${aestheticIntent}\n\nSelected items and reasoning:\n${selectionsSummary}`
        }
      ],
      schema: z.object({
        outfit_name: z.string(),
        overall_explanation: z.string()
      })
    })

    // 3. Build items_hash from sorted selection IDs (same as V1)
    const sortedIds = selections.map((s: any) => s.id as string).sort()
    const itemsHash = crypto.createHash('sha256').update(sortedIds.join(',')).digest('hex')

    // 4. Save to outfits table using supabaseAdmin
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const reasoning = JSON.stringify(
      selections.map((s: any) => ({ id: s.id, category: s.category, reason: s.reason }))
    )

    const { data: outfitData, error: outfitError } = await supabaseAdmin
      .from('outfits')
      .insert({
        user_id: userId,
        occasion: object.outfit_name,
        prompt_text: prompt,
        reasoning,
        weather_context: weatherContext || null,
        is_saved: false,
        items_hash: itemsHash
      })
      .select('id')
      .single()

    if (outfitError) {
      console.error('Failed to save outfit:', outfitError)
      return NextResponse.json(
        { error: `Failed to save outfit. ${outfitError.message}` },
        { status: 500 }
      )
    }

    const outfitId = outfitData.id

    // 5. Save to outfit_items table
    const outfitItemsPayload = selections.map((s: any) => ({
      outfit_id: outfitId,
      wardrobe_item_id: s.id,
      slot: s.category
    }))

    const { error: linkingError } = await supabaseAdmin
      .from('outfit_items')
      .insert(outfitItemsPayload)

    if (linkingError) {
      console.error('Failed to link outfit items:', linkingError)
      return NextResponse.json(
        { error: `Failed to link items. ${linkingError.message}` },
        { status: 500 }
      )
    }

    // 6. Return success
    return NextResponse.json({
      success: true,
      outfitId,
      name: object.outfit_name,
      explanation: object.overall_explanation
    })

  } catch (error: any) {
    console.error('Finalize-v2 API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}
