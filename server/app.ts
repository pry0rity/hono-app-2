import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { expensesRoute } from './routes/expenses';
import { sentry } from '@hono/sentry'
import { authRoute } from './routes/auth'
const app = new Hono()

/* Middleware */
app.use('*', logger());

/* API routes */
const apiRoutes = app.basePath('/api/v1').route('/expenses', expensesRoute).route('/', authRoute)

/* Frontend routes */
app.get('*', serveStatic({ root: './frontend/dist' }))
app.get('*', serveStatic({ path: './frontend/dist/index.html' }))

/* Export */
export type ApiRoutes = typeof apiRoutes

export default app
