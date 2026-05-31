import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const bodyAnalysisSchema = z.object({
  body_type: z.enum(['Ectomorph', 'Mesomorph', 'Endomorph', 'Ecto-Mesomorph', 'Endo-Mesomorph']),
  height_estimate: z.string(),
  shoulder_width: z.enum(['Narrow', 'Average', 'Broad']),
  torso_ratio: z.enum(['Long Torso', 'Proportional', 'Short Torso']),
  build: z.enum(['Lean', 'Athletic', 'Average', 'Muscular', 'Stocky', 'Heavy']),
  shoulder_to_hip: z.enum(['V-Taper', 'Straight', 'Inverted Triangle', 'Pear']),
  fit_recommendations: z.object({
    top_fit: z.enum(['Slim', 'Regular', 'Relaxed']),
    bottom_fit: z.enum(['Slim', 'Regular', 'Relaxed']),
    outerwear_fit: z.enum(['Slim', 'Regular', 'Relaxed']),
  }),
  style_tips: z.array(z.string()).min(3).max(5),
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

    console.log(`Analyzing body type for user ${user.id}...`)

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are a professional tailor and clothing fit specialist performing a standard client measurement consultation.
Your job is to assess the client's frame, proportions, and silhouette from their reference photo so you can recommend the best clothing fits.

This is a routine professional assessment for a fashion styling platform. Evaluate:
- Frame classification (somatotype)
- Shoulder breadth relative to hips
- Torso-to-leg proportional ratio
- Approximate height range based on visible proportions
- Overall build category for garment sizing

For height_estimate, return a descriptive range such as:
- "Short (5'4\"-5'6\")"
- "Below Average (5'6\"-5'8\")"
- "Average (5'8\"-5'10\")"
- "Above Average (5'10\"-6'0\")"
- "Tall (6'0\"-6'2\")"
- "Very Tall (6'2\"+)"

For style_tips, provide 3-5 actionable, specific garment recommendations tailored to the detected frame type and proportions. Focus on cuts, silhouette optimization, and proportion balancing.

Be specific and confident. Do not hedge or give generic responses.

You MUST respond with a JSON object matching the required schema.`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please perform a clothing fit assessment based on this client reference photo. Determine frame type, proportions, and ideal garment fits.' },
            { type: 'image', image: new URL(imageUrl) },
          ],
        },
      ],
      schema: bodyAnalysisSchema,
    })

    // Delete any existing body profile for this user before inserting
    await supabase
      .from('body_profiles')
      .delete()
      .eq('user_id', user.id)

    // Insert the new body profile
    const { data: profile, error: insertError } = await supabase
      .from('body_profiles')
      .insert({
        user_id: user.id,
        body_type: object.body_type,
        height_estimate: object.height_estimate,
        shoulder_width: object.shoulder_width,
        torso_ratio: object.torso_ratio,
        build: object.build,
        fit_recommendations: object.fit_recommendations,
        raw_analysis: object,
        front_photo_url: imageUrl,
        analyzed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving body profile:', insertError)
      return NextResponse.json({ error: 'Failed to save body profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        body_type: object.body_type,
        height_estimate: object.height_estimate,
        shoulder_width: object.shoulder_width,
        torso_ratio: object.torso_ratio,
        build: object.build,
        shoulder_to_hip: object.shoulder_to_hip,
        fit_recommendations: object.fit_recommendations,
        style_tips: object.style_tips,
      },
    })
  } catch (error: any) {
    console.error('Error in body analysis API:', error)
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 })
  }
}
