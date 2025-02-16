import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { rota } from './routes/primeiraRouter.js'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(
  '/v1/*',
  cors({
    origin: [
      '*',
      'http://localhost:3000',
      '0.0.0.0',
      '127.0.0.1',
      'localhost',
      '0.0.0.0:3000',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'Date', 'X-Request-Id'],
    maxAge: 600,
    credentials: false,
  })
)
app.get('/', c => {
  return c.text('Hello Hono!')
})

app.route('/v1', rota)

const port = 3003
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
