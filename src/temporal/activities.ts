import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function analyzeWardrobeItemImage(imageUrl: string, userId: string): Promise<any> {
  console.log(`Analyzing wardrobe item for user ${userId}...`)
  
  // Use GPT-4o Vision to extract data
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    system: `You are an expert fashion stylist and AI vision model. Analyze the provided image of a clothing item.
    Identify the category, sub-category, primary color, pattern, material, and a formality score from 1 (very casual) to 5 (black tie).
    Be precise. Return only the structured JSON data.`,
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
      formality_score: z.number().min(1).max(5),
      ai_tags: z.array(z.string()),
    })
  })
  
  return object
}

export async function generateOutfitRecommendation(prompt: string, userId: string, wardrobeItems?: any[]): Promise<any> {
  console.log(`Generating outfit for prompt: "${prompt}"...`)
  
  // Simulated wardrobe if none provided
  const items = wardrobeItems || [
    { id: '1', category: 'Top', name: 'Navy Linen Shirt', formality_score: 3 },
    { id: '2', category: 'Bottom', name: 'Beige Chinos', formality_score: 3 },
    { id: '3', category: 'Footwear', name: 'Brown Loafers', formality_score: 4 },
  ]

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    system: `You are Grooming OS, an elite personal AI stylist. 
    The user wants an outfit for: "${prompt}".
    Select the best items from their wardrobe. Provide a confidence score and detailed reasoning on why the outfit works for their body type and the occasion. Also suggest a hairstyle and grooming notes.`,
    prompt: `Wardrobe items available: ${JSON.stringify(items)}. The occasion is: ${prompt}`,
    schema: z.object({
      occasion: z.string(),
      confidence_score: z.number().min(0).max(1),
      reasoning: z.string(),
      hairstyle_suggestion: z.string(),
      grooming_notes: z.string(),
      selected_item_ids: z.array(z.string()),
      upgrade_suggestion: z.object({
        name: z.string(),
        price_inr: z.number(),
        reason: z.string()
      }).optional()
    })
  })
  
  return object
}
