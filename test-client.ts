import { getTemporalClient } from './src/temporal/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function test() {
  try {
    console.log('Testing client connection...')
    const client = await getTemporalClient()
    console.log('Client connected successfully.')
  } catch (err: any) {
    console.error('Error:', err)
  }
}

test()
