import { Hono } from 'hono'
import { z } from 'zod' 
import { zValidator } from '@hono/zod-validator'

import { getUser } from '../kinde'

import db from '../db'
import { expenses as expensesTable } from '../db/schema/expenses'
import { and, eq, desc, count, sum } from 'drizzle-orm'

// Define schema for expense validation
const expenseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3).max(100),
  amount: z.string(),
  createdAt: z.date().optional(),
})

// Schema for pagination query
const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
})

// Schema for creating new expenses (omits id since it's auto-generated)
const createExpenseSchema = expenseSchema.omit({ id: true, createdAt: true })

// TypeScript type for expense objects
type Expense = z.infer<typeof expenseSchema>

// Create new Hono router instance for expenses routes
export const expensesRoute = new Hono()
  // GET /expenses - Returns paginated list of expenses for authenticated user
  .get('/', getUser, zValidator('query', paginationSchema), async (c) => {
    const user = c.var.user
    const { page, limit } = c.req.valid('query')
    
    // Calculate offset
    const offset = (page - 1) * limit

    // Get paginated expenses
    const expenses = await db
      .select()
      .from(expensesTable)
      .where(eq(expensesTable.userId, user.id))
      .orderBy(desc(expensesTable.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [result] = await db
      .select({ count: count() })
      .from(expensesTable)
      .where(eq(expensesTable.userId, user.id))

    return c.json({ 
      expenses,
      pagination: {
        total: Number(result.count),
        page,
        limit,
        pages: Math.ceil(Number(result.count) / limit)
      }
    })
  })
  // GET /expenses/total-spent - Returns total sum of all expenses for authenticated user
  .get('/total-spent', getUser, async (c) => {
    const user = c.var.user
    const [result] = await db
      .select({ 
        total: sum(expensesTable.amount)
      })
      .from(expensesTable)
      .where(eq(expensesTable.userId, user.id))

    return c.json({ total: result.total || '0' })
  })
  // GET /expenses/:id - Returns single expense by ID if it belongs to authenticated user
  .get('/:id{[0-9]+}', getUser, async (c) => {
    const id = c.req.param('id')
    const user = c.var.user
    
    const expense = await db.select()
      .from(expensesTable)
      .where(
        and(
          eq(expensesTable.id, Number(id)),
          eq(expensesTable.userId, user.id)
        )
      )
      .limit(1)

    if (!expense.length) {
      return c.notFound()
    }
    return c.json({ expense: expense[0] })
  })
  // POST /expenses - Creates new expense for authenticated user
  .post('/', zValidator('json', createExpenseSchema), getUser, async (c) => {
    const expense = c.req.valid('json')
    const user = c.var.user

    const result = await db.insert(expensesTable).values({ 
      ...expense,
      userId: c.var.user.id,
      // createdAt will be set by database default
    })

    c.status(201)
    return c.json({ result }) 
  })  
  // DELETE /expenses/:id - Deletes expense by ID if it belongs to authenticated user
  .delete('/:id{[0-9]+}', getUser, async (c) => {
    const id = c.req.param('id')
    const user = c.var.user

    const result = await db.delete(expensesTable)
      .where(and(
        eq(expensesTable.id, Number(id)),
        eq(expensesTable.userId, user.id)
      ))

    if (!result.length) {
      return c.notFound()
    }
    return c.json({ success: true })
  })