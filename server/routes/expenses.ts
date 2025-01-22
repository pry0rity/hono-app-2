import { Hono } from 'hono'
import { z } from 'zod' 
import { zValidator } from '@hono/zod-validator'

// Define schema for expense validation
const expenseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3).max(100), 
  amount: z.number().min(0).max(1000000),
}) 

// Schema for creating new expenses (omits id since it's auto-generated)
const createExpenseSchema = expenseSchema.omit({ id: true })

// TypeScript type for expense objects
type Expense = z.infer<typeof expenseSchema>

const fakeExpenses: Expense[] = [
  { id: 1, title: 'Expense 1', amount: 100},
  { id: 2, title: 'Expense 2', amount: 200},
  { id: 3, title: 'Expense 3', amount: 300},
]

// Create new Hono router instance for expenses routes
export const expensesRoute = new Hono()
  .get('/', (c) => {
    return c.json({ expenses: fakeExpenses })
  })
  .get('/total-spent',  (c) => {
    const total = fakeExpenses.reduce((acc, expense) => acc + expense.amount, 0)
    return c.json({ total })
  })
  .get('/:id{[0-9]+}', (c) => {
    const id = c.req.param('id') 
    const expense = fakeExpenses.find(expense => expense.id === Number(id))
    if (!expense) {
      return c.notFound()
    }
    return c.json({ expense })
  })
  .post('/', zValidator('json', createExpenseSchema), async (c) => {
    const expense = c.req.valid('json')
    fakeExpenses.push({ ...expense, id: fakeExpenses.length + 1 })
    c.status(201)
    return c.json({ expense }) 
  })  
  .delete('/:id{[0-9]+}', (c) => {
    const id = c.req.param('id') 
    const expense = fakeExpenses.find(expense => expense.id === Number(id))
    if (!expense) {
      return c.notFound()
    }
    const index = fakeExpenses.findIndex(expense => expense.id === Number(id))
    fakeExpenses.splice(index, 1)
    return c.json({ expense })
  })