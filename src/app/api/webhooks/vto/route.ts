import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received VTO Webhook:', body)

    // Replicate's payload includes id, status, output, etc.
    const jobId = body.id
    const status = body.status
    const output = body.output
    const errorMsg = body.error

    if (!jobId) {
      return NextResponse.json({ error: 'Missing Job ID' }, { status: 400 })
    }

    // Since this is a webhook called by an external service, we cannot use the normal auth client.
    // We must use the Service Role key to bypass RLS and update the database safely.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (status === 'succeeded' && output) {
      // The output is typically an array of URLs or a single URL string depending on the model version
      const tryOnUrl = Array.isArray(output) ? output[0] : output

      const { error: updateError } = await supabase
        .from('outfits')
        .update({ 
          try_on_image_url: tryOnUrl,
          vto_status: 'completed'
        })
        .eq('vto_job_id', jobId)

      if (updateError) {
        console.error('Webhook: Failed to update outfit:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
      
      console.log('Webhook: Successfully updated VTO job', jobId)
    } else if (status === 'failed' || status === 'canceled') {
      const { error: updateError } = await supabase
        .from('outfits')
        .update({ 
          vto_status: 'failed'
        })
        .eq('vto_job_id', jobId)
        
      console.error('Webhook: VTO job failed', errorMsg)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
