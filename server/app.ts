import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { expensesRoute } from './routes/expenses';
import { authRoute } from './routes/auth'

const app = new Hono()

/* Middleware */
app.use('*', logger());

/* API routes */
const api = new Hono()
  .route('/expenses', expensesRoute)
  .route('/', authRoute)

app.route('/api/v1', api)

// Handle 404s for API routes
app.use('/api/*', async (c) => {
  return c.json({ error: 'API endpoint not found' }, 404)
})

/* Frontend routes */
app.get('*', serveStatic({ root: './frontend/dist' }))
app.get('*', serveStatic({ path: './frontend/dist/index.html' }))

export type ApiRoutes = typeof api
export default app
