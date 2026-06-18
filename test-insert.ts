import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const userId = '120bc656-e720-4b15-bd35-516bf945d348' // from the user's prompt (itsprabhakarsingh@gmail.com)
  const payload = {
    user_id: userId,
    face_shape: 'Oval',
    skin_tone: 'Medium',
    undertone: 'Warm',
    color_palette: { season: 'Autumn', best_colors: [], avoid_colors: [], metal_preference: 'Gold' },
    hair_type: 'Wavy',
    hair_texture: 'Coarse',
    facial_hair_status: 'Stubble',
    wears_glasses: false,
    raw_analysis: {},
    face_photo_url: 'https://example.com/photo.jpg',
    analyzed_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('face_profiles').insert(payload).select().single()
  console.log('Error:', error)
  console.log('Data:', data)
}

test()
