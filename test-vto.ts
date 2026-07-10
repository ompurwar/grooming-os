import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { MultimodalVTOProvider } from './src/lib/vto/vtoService'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const outfitId = '77bafa99-d263-43fd-9b77-1b935558f8ed'

  console.log('Fetching outfit items...')
  const { data: outfitItems, error: itemsError } = await supabase
    .from('outfit_items')
    .select(`
      wardrobe_items (
        category,
        image_url,
        sub_category,
        primary_color
      )
    `)
    .eq('outfit_id', outfitId)

  if (itemsError || !outfitItems) {
    console.error('Error fetching items', itemsError)
    return
  }

  const allItems = outfitItems
    .filter((oi: any) => (oi.wardrobe_items as any)?.image_url)
    .map((oi: any) => {
      const wItem = oi.wardrobe_items as any
      return {
        image_url: wItem.image_url,
        description: `${wItem.primary_color} ${wItem.sub_category || wItem.category}`,
        category: wItem.category
      }
    })

  console.log(`Found ${allItems.length} items.`)

  // Fetch human photo
  const { data: profile } = await supabase
    .from('body_profiles')
    .select('front_photo_url')
    .limit(1)
    .single()

  const humanUrl = profile?.front_photo_url
  if (!humanUrl) {
    console.error('No human photo found in body_profiles')
    return
  }

  console.log('Human photo:', humanUrl)
  console.log('Testing DALL-E 3 MultimodalVTO Provider...')
  const provider = new MultimodalVTOProvider()
  const result = await provider.generateMultimodal(humanUrl, allItems, 'http://localhost/webhook')
  
  console.log('Result from VTO:', result)
}

run().catch(console.error)
