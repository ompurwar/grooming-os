import { NativeConnection } from '@temporalio/worker'
import { Connection } from '@temporalio/client'
import dotenv from 'dotenv'
import dns from 'dns/promises'

dotenv.config({ path: '.env.local' })

async function run() {
  const address = 'quickstart-kaidranze-5d9a3776.cmgzw.tmprl.cloud'
  const apiKey = process.env.TEMPORAL_API_KEY
  
  console.log(`Resolving ${address}...`)
  const { address: ip } = await dns.lookup(address)
  console.log(`Resolved to IP: ${ip}`)

  console.log(`Connecting NativeConnection to ${ip}:7233...`)
  try {
    const conn1 = await NativeConnection.connect({
      address: `${ip}:7233`,
      tls: {
        serverNameOverride: address
      },
      metadata: { Authorization: `Bearer ${apiKey}` }
    })
    console.log('NativeConnection connected!')
    await conn1.close()
  } catch (err: any) {
    console.error('NativeConnection failed:', err.message)
  }

  console.log(`Connecting Client Connection to ${address}:7233...`)
  try {
    const conn2 = await Connection.connect({
      address: `${address}:7233`,
      tls: true,
      apiKey
    })
    console.log('Client Connection connected!')
    await conn2.close()
  } catch (err: any) {
    console.error('Client Connection failed:', err.message)
  }
}

run().catch(console.error)
