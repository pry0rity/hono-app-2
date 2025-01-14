import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { expensesRoute } from '../../server/routes/expenses'

const app = new Hono()

// Add logging middleware
app.use('*', async (c, next) => {
  console.log('Request path:', c.req.path)
  console.log('Request method:', c.req.method)
  await next()
})

// Test route to verify the handler is working
app.get('/', (c) => c.json({ message: 'Expenses API is running' }))

// Main expenses routes
app.route('/', expensesRoute)

export const config = {
  runtime: 'edge'
}

export default handle(app) 