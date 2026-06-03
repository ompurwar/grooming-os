import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id

    // Search for existing outfit using ILIKE on prompt_text or occasion
    // Note: since Postgres ILIKE is just basic text matching, we'll split the prompt into words
    // and check if any word > 4 chars matches, or just check the whole prompt.
    // For simplicity and speed, a direct ILIKE on the whole prompt or occasion is a good start.
    const cleanPrompt = prompt.trim().toLowerCase()
    
    // Fetch the most recent saved outfits
    const { data: outfits, error: outfitError } = await supabase
      .from('outfits')
      .select('id, occasion, prompt_text')
      .eq('user_id', userId)
      .eq('is_saved', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (outfitError) {
      console.error('Failed to fetch outfits:', outfitError)
      return NextResponse.json({ error: 'Failed to fetch outfits.' }, { status: 500 })
    }

    if (!outfits || outfits.length === 0) {
      return NextResponse.json({ match: null })
    }

    // Basic heuristic: check if the occasion or prompt_text includes keywords from the prompt
    // Or just check if prompt_text is very similar
    const promptWords = cleanPrompt.split(/\s+/).filter((w: string) => w.length > 3)
    
    let bestMatch = null
    for (const outfit of outfits) {
      const occasionLower = (outfit.occasion || '').toLowerCase()
      const textLower = (outfit.prompt_text || '').toLowerCase()
      
      // If exact or very close match
      if (textLower === cleanPrompt || occasionLower === cleanPrompt) {
        bestMatch = outfit
        break
      }
      
      // If prompt words intersect significantly
      if (promptWords.length > 0) {
        const matchCount = promptWords.filter((w: string) => occasionLower.includes(w) || textLower.includes(w)).length
        if (matchCount / promptWords.length > 0.5) { // more than 50% of significant words match
          bestMatch = outfit
          break
        }
      }
    }

    return NextResponse.json({
      match: bestMatch ? { id: bestMatch.id, occasion: bestMatch.occasion } : null
    })

  } catch (error: any) {
    console.error('Style match API error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
