import { Worker, NativeConnection } from '@temporalio/worker'
import * as activities from './activities'
import dotenv from 'dotenv'
import dns from 'dns/promises'

// Load .env.local for the standalone worker
dotenv.config({ path: '.env.local', override: true })

async function run() {
  const addressStr = process.env.TEMPORAL_ADDRESS?.trim() || ''
  let [host, port] = addressStr.split(':')
  host = host.replace(/['"]/g, '').trim()
  
  // Workaround for Rust tonic DNS resolution bug on Windows:
  // Use resolve4 (which uses c-ares directly) instead of lookup (OS getaddrinfo)
  const ips = await dns.resolve4(host)
  const ip = ips[0]
  
  console.log(`Connecting to Temporal (IP: ${ip}, Host: ${host})`)

  const connection = await NativeConnection.connect({
    address: `${ip}:${port || 7233}`,
    tls: {
      serverNameOverride: host
    },
    metadata: {
      Authorization: `Bearer ${process.env.TEMPORAL_API_KEY?.trim()}`,
    },
  })

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: 'grooming-os-tasks',
    workflowsPath: require.resolve('./workflows'),
    activities,
  })

  console.log('Temporal Worker started successfully.')
  await worker.run()
}

run().catch((err) => {
  console.error('Fatal worker error', err)
  process.exit(1)
})
