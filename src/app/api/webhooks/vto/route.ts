import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getVTOProvider } from '@/lib/vto/vtoService'

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (status === 'succeeded' && output) {
      const tryOnUrl = Array.isArray(output) ? output[0] : output

      // Fetch the outfit to check multi-pass state
      const { data: outfit, error: fetchError } = await supabase
        .from('outfits')
        .select('id, vto_passes, vto_current_pass')
        .eq('vto_job_id', jobId)
        .single()

      if (fetchError || !outfit) {
        console.error('Webhook: Failed to fetch outfit for job:', jobId)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      const passes = outfit.vto_passes || []
      const currentPass = outfit.vto_current_pass || 0

      if (passes.length > 0 && currentPass < passes.length - 1) {
        // Trigger the NEXT pass
        const nextPassIndex = currentPass + 1
        const nextPass = passes[nextPassIndex]
        
        console.log(`Webhook: Triggering Pass ${nextPassIndex + 1}/${passes.length} for outfit ${outfit.id}`)
        
        const provider = getVTOProvider()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://grooming-os.com' // Fallback
        const webhookUrl = `${appUrl}/api/webhooks/vto`
        
        const idmCategory = nextPass.passType === 'Top' ? 'upper_body' : (nextPass.passType === 'Bottom' ? 'lower_body' : 'upper_body');

        // IMPORTANT: The human_img for the next pass is the OUTPUT of the current pass!
        const newJobId = await provider.generate(
          tryOnUrl,
          nextPass.image_url,
          nextPass.description,
          webhookUrl,
          idmCategory
        )

        await supabase
          .from('outfits')
          .update({ 
            try_on_image_url: tryOnUrl, // Update intermediate image
            vto_job_id: newJobId,
            vto_current_pass: nextPassIndex,
            // Keep status as processing
          })
          .eq('id', outfit.id)

      } else {
        // Final pass completed
        const { error: updateError } = await supabase
          .from('outfits')
          .update({ 
            try_on_image_url: tryOnUrl,
            vto_status: 'completed'
          })
          .eq('id', outfit.id)

        if (updateError) {
          console.error('Webhook: Failed to update final outfit:', updateError)
        } else {
          console.log('Webhook: Successfully completed ALL VTO passes for outfit', outfit.id)
        }
      }
      
    } else if (status === 'failed' || status === 'canceled') {
      await supabase
        .from('outfits')
        .update({ vto_status: 'failed' })
        .eq('vto_job_id', jobId)
        
      console.error('Webhook: VTO job failed', errorMsg)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
