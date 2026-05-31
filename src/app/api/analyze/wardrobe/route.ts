import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const { imageUrl, userId } = await request.json()

    if (!imageUrl || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`Analyzing wardrobe item for user ${userId}...`)
    
    // Call OpenAI directly from the API route to bypass Next.js native module conflicts with Temporal client
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `You are an elite fashion designer and technical stylist. Analyze the provided image of a clothing item with extreme precision.
      Identify the broad category, but be extremely specific with the sub-category (e.g., 'Quarter-Zip Polo', 'Mandarin Collar Shirt', 'Pleated Trousers', 'Chelsea Boots').
      Extract granular fashion details into the 'ai_tags' array. This must include:
      - Fit (e.g., Slim fit, Oversized, Relaxed)
      - Collar/Neckline (e.g., Crewneck, V-neck, Mandarin collar, Spread collar)
      - Sleeve length (e.g., Short sleeve, Long sleeve, Sleeveless)
      - Fabric texture/weight (e.g., Heavyweight cotton, Breathable linen, Chunky knit)
      - Style aesthetic (e.g., Old Money, Streetwear, Smart Casual, Minimalist)
      
      Return a precise formality score from 1 (loungewear/gym) to 5 (black tie/formal).`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this clothing item.' },
            { type: 'image', image: imageUrl }
          ]
        }
      ],
      schema: z.object({
        category: z.enum(['Top', 'Bottom', 'Outerwear', 'Footwear', 'Accessory', 'Ethnic']),
        sub_category: z.string(),
        primary_color: z.string(),
        pattern: z.string(),
        material: z.string(),
        formality_score: z.number().int().min(1).max(5),
        ai_tags: z.array(z.string()),
      })
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        category: object.category,
        subCategory: object.sub_category,
        primaryColor: object.primary_color,
        pattern: object.pattern,
        material: object.material,
        formalityScore: object.formality_score,
        aiTags: object.ai_tags
      }
    })
  } catch (error: any) {
    console.error('Error in wardrobe analysis API:', error)
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 })
  }
}
