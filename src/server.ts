import 'dotenv/config'
import { buildApp } from './app.js'
import { env } from './config/env.js'

const app = buildApp()

try {
  await app.listen({ port: env.PORT, host: '127.0.0.1' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
