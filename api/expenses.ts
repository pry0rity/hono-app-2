import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { expensesRoute } from '../server/routes/expenses'

const app = new Hono().basePath('/api/v1')

app.route('/expenses', expensesRoute)

export const config = {
  runtime: 'edge'
}

export default handle(app) 