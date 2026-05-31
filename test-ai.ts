import { analyzeWardrobeItemImage } from './src/temporal/activities'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function test() {
  try {
    const imageUrl = 'https://urwtuxmjfsiktchpwzww.supabase.co/storage/v1/object/public/wardrobe-images/uploads/test.jpg'
    const result = await analyzeWardrobeItemImage(imageUrl, 'test-user')
    console.log('Result:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

test()
