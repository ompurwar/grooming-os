import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const faceAnalysisSchema = z.object({
  face_shape: z.enum(['Oval', 'Round', 'Square', 'Heart', 'Oblong', 'Diamond', 'Rectangle', 'Triangle']),
  skin_tone: z.string().describe('e.g. Fair, Light, Medium, Olive, Tan, Brown, Deep'),
  undertone: z.enum(['Warm', 'Cool', 'Neutral']),
  jawline: z.enum(['Soft', 'Moderate', 'Strong', 'Angular']),
  forehead: z.enum(['Narrow', 'Average', 'Wide', 'High']),
  eye_shape: z.string().describe('e.g. Almond, Round, Hooded, Monolid, Deep-set, Upturned, Downturned'),
  nose_shape: z.string().describe('e.g. Straight, Roman, Button, Aquiline, Wide, Narrow'),
  lip_proportion: z.enum(['Thin', 'Medium', 'Full']),
  cheekbone_prominence: z.enum(['Flat', 'Moderate', 'High']),
  facial_symmetry_score: z.number().min(0).max(100).describe('Overall facial symmetry score from 0-100'),
  hair_type: z.string().describe('e.g. Thick, Wavy or Fine, Straight'),
  hair_texture: z.string().describe('e.g. Coarse, Silky, Frizzy, Smooth'),
  facial_hair_status: z.string().describe('e.g. Clean shaven, Stubble, Full beard, Goatee, Mustache'),
  wears_glasses: z.boolean(),
  color_season: z.enum(['Spring', 'Summer', 'Autumn', 'Winter']),
  best_colors: z.array(z.string()).describe('5-8 colors that complement this person'),
  avoid_colors: z.array(z.string()).describe('3-5 colors that clash with this person'),
  metal_preference: z.enum(['Gold', 'Silver', 'Rose Gold', 'Both']),
  grooming_tips: z.array(z.string()).min(3).max(5).describe('3-5 personalized grooming tips'),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing required field: imageUrl' }, { status: 400 })
    }

    console.log(`Analyzing face for user ${user.id}...`)

    const { object: analysis } = await generateObject({
      model: openai('gpt-4o'),
      schemaName: 'StylingConsultation',
      schemaDescription: 'Personal color analysis and grooming consultation results for a styling platform client.',
      system: `You are a professional personal stylist and color consultant performing a routine client intake assessment for a fashion and grooming platform.

Your job is to evaluate the client's photo to determine their best styling attributes for clothing, color palette, accessory, and grooming recommendations. This is a standard professional service offered by personal stylists worldwide.

Assess the following styling attributes from the client reference photo:
- Face shape classification (for recommending glasses frames, hairstyles, and necklines)
- Skin tone depth and undertone (for personal color analysis and seasonal palette assignment)
- Bone structure characteristics: jawline definition, forehead proportion, cheekbone prominence (for hairstyle and accessory recommendations)
- Eye shape and nose shape (for glasses frame recommendations)
- Lip proportion (for grooming product recommendations)
- Facial proportional balance score from 0-100 (for hairstyle recommendations)
- Hair type, texture, and current facial hair status (for grooming product and style recommendations)
- Whether the client currently wears glasses (for frame style recommendations)
- Seasonal color palette classification (Spring = warm+light, Summer = cool+muted, Autumn = warm+deep, Winter = cool+bright)
- Specific clothing colors that complement and clash with the client's coloring
- Most flattering jewelry/accessory metal tone
- 3-5 actionable grooming tips tailored to the client's features

Be specific, professional, and confident in your assessment.`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please perform a personal styling and color consultation based on this client reference photo. Determine their color season, best features, and provide grooming recommendations.' },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
      schema: faceAnalysisSchema,
    })

    // Delete any existing face profile for this user (upsert: delete old, insert new)
    await supabase
      .from('face_profiles')
      .delete()
      .eq('user_id', user.id)

    // Insert the new face profile
    const { data: profile, error: insertError } = await supabase
      .from('face_profiles')
      .insert({
        user_id: user.id,
        face_shape: analysis.face_shape,
        skin_tone: analysis.skin_tone,
        undertone: analysis.undertone,
        color_palette: {
          season: analysis.color_season,
          best_colors: analysis.best_colors,
          avoid_colors: analysis.avoid_colors,
          metal_preference: analysis.metal_preference,
        },
        hair_type: analysis.hair_type,
        hair_texture: analysis.hair_texture,
        facial_hair_status: analysis.facial_hair_status,
        wears_glasses: analysis.wears_glasses,
        raw_analysis: analysis,
        face_photo_url: imageUrl,
        analyzed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving face profile:', insertError)
      return NextResponse.json({ error: 'Failed to save face profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        profile_id: profile.id,
        ...analysis,
      },
    })
  } catch (error: any) {
    console.error('Error in face analysis API:', error)
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 })
  }
}
