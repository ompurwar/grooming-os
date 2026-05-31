import { NextResponse } from 'next/server'
import { getTemporalClient } from '@/temporal/client'

export async function POST(request: Request) {
  try {
    const { prompt, userId } = await request.json()

    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await getTemporalClient()
    
    // Trigger the outfit generation
    const handle = await client.workflow.start('generateStylingWorkflow', {
      args: [prompt, userId],
      taskQueue: 'grooming-os-tasks',
      workflowId: `style-generate-${userId}-${Date.now()}`,
    })

    return NextResponse.json({ 
      success: true, 
      workflowId: handle.workflowId 
    })
  } catch (error: any) {
    console.error('Error starting styling workflow:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
