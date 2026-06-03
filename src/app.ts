import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { env } from './config/env.js'
import { vocabulariesRoutes } from './modules/vocabularies/vocabularies.routes.js'
import { meaningsRoutes } from './modules/meanings/meanings.routes.js'
import { reviewsRoutes } from './modules/reviews/reviews.routes.js'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      ...(env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    },
  })

  app.register(helmet)
  app.register(cors, { origin: env.CORS_ORIGIN, credentials: true })
  app.register(cookie)
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  app.register(vocabulariesRoutes, { prefix: '/api/vocabularies' })
  app.register(meaningsRoutes, { prefix: '/api/vocabularies' })
  app.register(reviewsRoutes, { prefix: '/api/reviews' })

  return app
}
