import Replicate from 'replicate'

import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'
export interface VTOPass {
  image_url: string;
  description: string;
  category: string;
}

export interface VTOProvider {
  /**
   * Generates a Virtual Try-On image asynchronously.
   * @param humanImgUrl URL of the person's photo
   * @param garmImgUrl URL of the garment photo
   * @param garmentDescription Text description of the garment (e.g., 'red polo shirt')
   * @param webhookUrl The URL the provider should POST to when finished
   * @param category The category of the garment ('upper_body', 'lower_body', 'dresses')
   * @returns The provider-specific Job ID
   */
  generate(humanImgUrl: string, garmImgUrl: string, garmentDescription: string, webhookUrl: string, category?: string): Promise<string>
  generateMultimodal?(humanImgUrl: string, passes: VTOPass[], webhookUrl: string): Promise<string>
}

class ReplicateVTOProvider implements VTOProvider {
  private replicate: Replicate;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  }

  async generate(humanImgUrl: string, garmImgUrl: string, garmentDescription: string, webhookUrl: string, category: string = 'upper_body'): Promise<string> {
    const prediction = await this.replicate.predictions.create({
      version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4", // cuuupid/idm-vton
      input: {
        human_img: humanImgUrl,
        garm_img: garmImgUrl,
        garment_des: garmentDescription,
        category: category,
        is_checked: true,
        is_checked_crop: false
      },
      webhook: webhookUrl,
      webhook_events_filter: ["completed"]
    })

    return prediction.id
  }
}

export class MultimodalVTOProvider implements VTOProvider {
  private replicate: Replicate;
  private openai: OpenAI;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async generate(humanImgUrl: string, garmImgUrl: string, garmentDescription: string, webhookUrl: string, category: string = 'upper_body'): Promise<string> {
    throw new Error('Use generateMultimodal for MultimodalVTOProvider')
  }

  async generateMultimodal(humanImgUrl: string, passes: VTOPass[], webhookUrl: string): Promise<string> {
    console.log('MultimodalVTO: Analyzing images with GPT-4o Vision...')
    
    // Use standard supabase client, no cookies needed for public buckets
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Helper function to fetch and convert an image URL to a base64 data URI
    const urlToBase64 = async (url: string) => {
      try {
        // If it's a Supabase storage URL, download it directly via the SDK to avoid network timeouts
        if (url.includes('/storage/v1/object/public/')) {
          const parts = url.split('/storage/v1/object/public/')[1].split('/')
          const bucket = parts[0]
          const path = parts.slice(1).join('/')
          
          const { data, error } = await supabase.storage.from(bucket).download(path)
          if (error || !data) throw new Error(`Supabase download failed: ${error?.message}`)
          
          const arrayBuffer = await data.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          return `data:${data.type || 'image/jpeg'};base64,${buffer.toString('base64')}`
        }

        // Fallback for non-Supabase URLs
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = response.headers.get('content-type') || 'image/jpeg'
        return `data:${mimeType};base64,${buffer.toString('base64')}`
      } catch (err) {
        console.error('Error downloading image for OpenAI:', url, err)
        return url // Fallback to URL if download fails
      }
    }

    const humanImgBase64 = await urlToBase64(humanImgUrl)
    const passesBase64 = await Promise.all(passes.map(async (p) => ({
      ...p,
      base64: await urlToBase64(p.image_url)
    })))

    const messages: any[] = [
      {
        role: "system",
        content: `You are a fashion material analyst. You will receive photos of clothing and accessory items. For EACH item, extract and describe in precise detail:

1. **Material & Fabric**: Exact fabric type (linen, cotton twill, full-grain leather, suede, knit, etc.), weave pattern, weight (lightweight, heavy), and finish (matte, satin, glossy, distressed)
2. **Color & Tone**: Exact color shade (not just "brown" — say "warm chestnut brown with honey undertones"), gradient, wash, or dye pattern
3. **Surface & Texture**: Surface quality (smooth, rough, pebbled, perforated, ribbed, brushed), visible stitching, embossing, perforations, or detailing
4. **Fit & Drape**: How the garment falls (relaxed, tailored, slim, oversized), silhouette shape, and how it sits on the body
5. **Construction Details**: Collar type, cuff style, button/zip closure, pocket placement, sole type for shoes, frame shape for glasses

Do NOT describe the person wearing them. Output a single edit instruction starting with "Dress this person in..." that combines all items into one cohesive description. The instruction must also end with: "Preserve the person's exact skin tone, body shape, posture, face, hands, and background. Match the lighting and shadows of the original photo."`
      },
      {
        role: "user",
        content: [
          {
            type: "text", 
            text: `Analyze each clothing/accessory item below in detail. Extract the material, texture, surface finish, exact color tone, and construction. Write a single edit instruction starting with "Dress this person in..." Items: ${passes.map(p => p.description).join(', ')}.`
          },
          ...passesBase64.map(p => ({
            type: "image_url",
            image_url: { url: p.base64 }
          }))
        ]
      }
    ]

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
    })

    let prompt = completion.choices[0].message.content?.trim() || ""
    console.log('MultimodalVTO: GPT-4o Output Prompt:', prompt)

    // Ensure the preservation instruction is always appended
    if (prompt && !prompt.includes('Preserve')) {
      prompt += ' Preserve the person\'s exact skin tone, body shape, posture, face, hands, and background. Match the lighting and shadows of the original photo.'
    }

    // Fallback if vision fails
    if (!prompt) {
      prompt = `Dress this person in ${passes.map(p => p.description).join(' and ')}. Preserve the person's exact skin tone, body shape, posture, face, hands, and background. Match the lighting and shadows of the original photo.`
    }

    let tryOnUrl = ''
    try {
      console.log('MultimodalVTO: Triggering OpenAI gpt-image-2 generation...')
      const { toFile } = require('openai')
      const base64Data = humanImgBase64.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      const imageFile = await toFile(imageBuffer, 'human.jpg', { type: 'image/jpeg' })

      const response = await this.openai.images.edit({
        model: "gpt-image-2",
        image: imageFile,
        prompt: prompt,
        n: 1,
        size: "1024x1024" // Or "auto" if supported
      } as any)
      
      const imgData = response.data && response.data[0]
      if (!imgData) {
        throw new Error('gpt-image-2 returned no image data')
      }
      
      if (imgData.url) {
        tryOnUrl = imgData.url
      } else if (imgData.b64_json) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        
        const fileName = `vto_${Date.now()}.png`
        const buffer = Buffer.from(imgData.b64_json, 'base64')
        const { data, error } = await supabase.storage
          .from('wardrobe-images')
          .upload(`uploads/${fileName}`, buffer, {
            contentType: 'image/png'
          })
          
        if (error) {
          throw new Error(`Failed to upload gpt-image-2 result to Supabase: ${error.message}`)
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('wardrobe-images')
          .getPublicUrl(`uploads/${fileName}`)
          
        tryOnUrl = publicUrlData.publicUrl
      } else {
        throw new Error('gpt-image-2 returned no image URL or b64_json')
      }
      
      console.log('MultimodalVTO: gpt-image-2 generation complete!', tryOnUrl)
    } catch (err: any) {
      console.error('MultimodalVTO: gpt-image-2 failed.', err.message)
      throw err
    }
    
    // Prefix the job ID with 'SYNC:' so the API route knows it's the actual image URL, not a job ID
    return `SYNC:${tryOnUrl}`
  }
}

export class GeminiVTOProvider implements VTOProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  }

  async generate(humanImgUrl: string, garmImgUrl: string, garmentDescription: string, webhookUrl: string, category: string = 'upper_body'): Promise<string> {
    throw new Error('Use generateMultimodal for GeminiVTOProvider')
  }

  async generateMultimodal(humanImgUrl: string, passes: VTOPass[], webhookUrl: string): Promise<string> {
    console.log('GeminiVTO: Analyzing and generating with gemini-3-pro-image...')
    
    // Use standard supabase client, no cookies needed for public buckets
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Helper function to fetch and convert an image URL to a base64 data URI
    const urlToBase64 = async (url: string) => {
      try {
        if (url.includes('/storage/v1/object/public/')) {
          const parts = url.split('/storage/v1/object/public/')[1].split('/')
          const bucket = parts[0]
          const path = parts.slice(1).join('/')
          
          const { data, error } = await supabase.storage.from(bucket).download(path)
          if (error || !data) throw new Error(`Supabase download failed: ${error?.message}`)
          
          const arrayBuffer = await data.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          return `data:${data.type || 'image/jpeg'};base64,${buffer.toString('base64')}`
        }

        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = response.headers.get('content-type') || 'image/jpeg'
        return `data:${mimeType};base64,${buffer.toString('base64')}`
      } catch (err) {
        console.error('Error downloading image for Gemini:', url, err)
        return url
      }
    }

    const humanImgBase64 = await urlToBase64(humanImgUrl)
    const passesBase64 = await Promise.all(passes.map(async (p) => ({
      ...p,
      base64: await urlToBase64(p.image_url)
    })))

    // Construct the parts array for Gemini
    const contents: any[] = [
      { text: `You are a virtual try-on assistant. Dress the person in the first image with the clothing items shown in the subsequent images (${passes.map(p => p.description).join(', ')}). Preserve the person's exact skin tone, body shape, posture, face, hands, and background. Match the lighting and shadows of the original photo.` },
      { inlineData: { data: humanImgBase64.replace(/^data:image\/\w+;base64,/, ''), mimeType: humanImgBase64.match(/data:(.*?);/)?.[1] || 'image/jpeg' } },
      ...passesBase64.map(p => ({
        inlineData: { data: p.base64.replace(/^data:image\/\w+;base64,/, ''), mimeType: p.base64.match(/data:(.*?);/)?.[1] || 'image/jpeg' }
      }))
    ]

    let tryOnUrl = ''
    try {
      // In the @google/genai SDK, generateContent takes a single string/array or an object for contents
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-image',
        contents: contents,
        config: {
          responseModalities: ['image']
        }
      })
      
      const candidate = response.candidates?.[0]
      if (!candidate || !candidate.content || !candidate.content.parts) {
        throw new Error('Gemini returned no valid content')
      }

      // Look for an image part in the response
      const imagePart = candidate.content.parts.find(p => p.inlineData)
      
      if (!imagePart || !imagePart.inlineData) {
        throw new Error('Gemini returned no inline image data')
      }
      
      const b64Data = imagePart.inlineData.data
      
      if (!b64Data) {
        throw new Error('Gemini returned empty image data')
      }

      // Upload to Supabase
      const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const fileName = `vto_gemini_${Date.now()}.png`
      const buffer = Buffer.from(b64Data, 'base64')
      
      const { data, error } = await adminSupabase.storage
        .from('wardrobe-images')
        .upload(`uploads/${fileName}`, buffer, {
          contentType: 'image/png'
        })
        
      if (error) {
        throw new Error(`Failed to upload Gemini result to Supabase: ${error.message}`)
      }
      
      const { data: publicUrlData } = adminSupabase.storage
        .from('wardrobe-images')
        .getPublicUrl(`uploads/${fileName}`)
        
      tryOnUrl = publicUrlData.publicUrl
      console.log('GeminiVTO: Generation complete!', tryOnUrl)
      
    } catch (err: any) {
      console.error('GeminiVTO: Generation failed.', err.message)
      throw err
    }
    
    return `SYNC:${tryOnUrl}`
  }
}

export function getVTOProvider(engine: string = 'openai'): VTOProvider {
  if (engine === 'gemini') {
    return new GeminiVTOProvider()
  } else if (engine === 'openai') {
    return new MultimodalVTOProvider()
  } else if (engine === 'replicate') {
    return new ReplicateVTOProvider()
  }
  
  return new MultimodalVTOProvider() // Default
}
