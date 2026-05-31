import { Connection, Client } from '@temporalio/client'

export async function getTemporalClient() {
  const address = process.env.TEMPORAL_ADDRESS?.trim()
  const apiKey = process.env.TEMPORAL_API_KEY?.trim()
  const namespace = process.env.TEMPORAL_NAMESPACE?.trim() || 'default'

  const connection = await Connection.connect({
    address,
    tls: true, // Required for Temporal Cloud
    apiKey,
  })

  return new Client({
    connection,
    namespace,
  })
}
