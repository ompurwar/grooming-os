import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  // Try to insert a duplicate items_hash and see if it fails
  const { data, error } = await supabase.from('outfits').insert({
    user_id: '23d8e1ca-2924-434b-8ede-d3c29efb5219',
    occasion: 'Test',
    items_hash: 'testhash123'
  }).select()
  console.log('Insert 1:', error)

  const { data: d2, error: e2 } = await supabase.from('outfits').insert({
    user_id: '23d8e1ca-2924-434b-8ede-d3c29efb5219',
    occasion: 'Test',
    items_hash: 'testhash123'
  }).select()
  console.log('Insert 2:', e2)
}

check()
