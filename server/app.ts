import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { expensesRoute } from './routes/expenses';

const app = new Hono()

/* Middleware */
app.use('*', logger());

/* API routes */
const apiRoutes = app.basePath('/api/v1').route('/expenses', expensesRoute)

/* Frontend routes */
app.get('*', serveStatic({ root: './frontend/dist' }))
app.get('*', serveStatic({ path: './frontend/dist/index.html' }))

/* Export */
export type ApiRoutes = typeof apiRoutes

export default app
