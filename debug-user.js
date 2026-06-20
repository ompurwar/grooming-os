const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'ompurwar96+10@gmail.com',
    password: 'r@Bt5QTbXzBP9K3'
  })

  if (loginError) {
    console.error('Login Error:', loginError)
    return
  }

  const userId = session.user.id
  console.log('User ID:', userId)

  const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single()
  console.log('Profile:', profile)

  const { data: stylePrefs, error: styleErr } = await supabase.from('style_preferences').select('*').eq('user_id', userId)
  console.log('Style Prefs:', stylePrefs, 'Error:', styleErr)
}

check()
