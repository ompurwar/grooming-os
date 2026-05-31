import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const recommendationItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(100),
})

const recommendationsSchema = z.object({
  hairstyles: z.array(recommendationItemSchema).length(3),
  facial_hair: z.array(recommendationItemSchema).length(3),
  eyebrow_grooming: z.string(),
  skincare_focus: z.string(),
  glasses_frames: z.array(
    z.object({
      title: z.string(),
      reasoning: z.string(),
      confidence: z.number().min(0).max(100),
    })
  ).length(3),
  color_recommendations: z.object({
    best_colors: z.array(z.string()),
    avoid_colors: z.array(z.string()),
    season: z.string(),
  }),
})

export async function GET() {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Fetch face profile (most recent)
    const { data: faceProfile, error: faceError } = await supabase
      .from('face_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single()

    if (faceError || !faceProfile) {
      return NextResponse.json(
        {
          error:
            'No face analysis found. Please complete a face scan first.',
        },
        { status: 400 }
      )
    }

    // 3. Fetch body profile (most recent, optional)
    const { data: bodyProfile } = await supabase
      .from('body_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single()

    // 4. Build the AI prompt
    const faceContext = [
      `Face shape: ${faceProfile.face_shape ?? 'unknown'}`,
      `Skin tone: ${faceProfile.skin_tone ?? 'unknown'}`,
      `Undertone: ${faceProfile.undertone ?? 'unknown'}`,
      `Hair type: ${faceProfile.hair_type ?? 'unknown'}`,
      `Hair texture: ${faceProfile.hair_texture ?? 'unknown'}`,
      `Facial hair status: ${faceProfile.facial_hair_status ?? 'unknown'}`,
      `Wears glasses: ${faceProfile.wears_glasses ? 'yes' : 'no'}`,
      faceProfile.color_palette
        ? `Color palette: ${JSON.stringify(faceProfile.color_palette)}`
        : null,
    ]
      .filter(Boolean)
      .join('\n')

    let bodyContext = ''
    if (bodyProfile) {
      bodyContext = [
        `Body type: ${bodyProfile.body_type ?? 'unknown'}`,
        `Height estimate: ${bodyProfile.height_estimate ?? 'unknown'}`,
        `Shoulder width: ${bodyProfile.shoulder_width ?? 'unknown'}`,
        `Torso ratio: ${bodyProfile.torso_ratio ?? 'unknown'}`,
        `Build: ${bodyProfile.build ?? 'unknown'}`,
      ].join('\n')
    }

    const userProfile = bodyContext
      ? `FACE PROFILE:\n${faceContext}\n\nBODY PROFILE:\n${bodyContext}`
      : `FACE PROFILE:\n${faceContext}`

    // 5. Generate recommendations via AI
    const { object: recommendations } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an elite men's grooming consultant and personal stylist with deep expertise in face shapes, skin tones, color theory, and modern grooming trends.

Given a user's face analysis (and optionally body analysis), generate highly personalized grooming recommendations. Every recommendation must be specific, actionable, and backed by clear reasoning that references the user's actual features.

For confidence scores, use 0-100 where:
- 90-100: Near-perfect match for the user's features
- 70-89: Strong recommendation with minor caveats
- 50-69: Decent option, depends on personal preference
- Below 50: Only if no better options exist

Be specific with hairstyle names (e.g., "Textured French Crop" not just "Short Hair").
Be specific with facial hair styles (e.g., "Extended Goatee with Faded Cheeks" not just "Goatee").
For glasses frames, reference actual frame shapes (e.g., "Clubmaster", "Aviator", "Wayfarers").
For color recommendations, use specific color names (e.g., "Burgundy", "Olive Green", "Slate Blue").`,
      messages: [
        {
          role: 'user',
          content: `Generate personalized grooming recommendations based on this profile:\n\n${userProfile}`,
        },
      ],
      schema: recommendationsSchema,
    })

    // 6. Delete old recommendations for this user, then insert new ones
    await supabase
      .from('grooming_recommendations')
      .delete()
      .eq('user_id', userId)

    const rows: Array<{
      user_id: string
      category: string
      title: string
      description: string | null
      reasoning: string | null
      confidence_score: number
    }> = []

    // Hairstyles
    for (const item of recommendations.hairstyles) {
      rows.push({
        user_id: userId,
        category: 'Hairstyle',
        title: item.title,
        description: item.description,
        reasoning: item.reasoning,
        confidence_score: item.confidence / 100,
      })
    }

    // Facial hair
    for (const item of recommendations.facial_hair) {
      rows.push({
        user_id: userId,
        category: 'Facial Hair',
        title: item.title,
        description: item.description,
        reasoning: item.reasoning,
        confidence_score: item.confidence / 100,
      })
    }

    // Eyebrow grooming (single recommendation)
    rows.push({
      user_id: userId,
      category: 'Eyebrow Grooming',
      title: 'Eyebrow Grooming',
      description: recommendations.eyebrow_grooming,
      reasoning: null,
      confidence_score: 1.0,
    })

    // Skincare focus (single recommendation)
    rows.push({
      user_id: userId,
      category: 'Skincare',
      title: 'Skincare Focus',
      description: recommendations.skincare_focus,
      reasoning: null,
      confidence_score: 1.0,
    })

    // Glasses frames
    for (const item of recommendations.glasses_frames) {
      rows.push({
        user_id: userId,
        category: 'Glasses',
        title: item.title,
        description: null,
        reasoning: item.reasoning,
        confidence_score: item.confidence / 100,
      })
    }

    // Color recommendations (single row with color info in description)
    rows.push({
      user_id: userId,
      category: 'Color Palette',
      title: `${recommendations.color_recommendations.season} Color Palette`,
      description: `Best colors: ${recommendations.color_recommendations.best_colors.join(', ')}. Avoid: ${recommendations.color_recommendations.avoid_colors.join(', ')}.`,
      reasoning: `Based on your skin tone and undertone, you fall into the ${recommendations.color_recommendations.season} color season.`,
      confidence_score: 1.0,
    })

    const { error: insertError } = await supabase
      .from('grooming_recommendations')
      .insert(rows)

    if (insertError) {
      console.error('Error saving recommendations:', insertError)
      return NextResponse.json(
        { error: 'Failed to save recommendations.' },
        { status: 500 }
      )
    }

    // 7. Return full recommendations object
    return NextResponse.json({
      success: true,
      data: recommendations,
    })
  } catch (error: unknown) {
    console.error('Error generating grooming recommendations:', error)
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
