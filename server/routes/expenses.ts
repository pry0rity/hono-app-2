import { Hono } from 'hono'
import { z } from 'zod' 
import { zValidator } from '@hono/zod-validator'

import { getUser } from '../kinde'

import db from '../db'
import { expenses as expensesTable } from '../db/schema/expenses'
import { and, eq, desc, count, sum, sql, between, like, or, SQL, asc } from 'drizzle-orm'

// Define schema for expense validation
const expenseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  amount: z.string(),
  type: z.enum(['expense', 'income']).default('expense'),
  date: z.date().default(() => new Date()),
  category: z.string(),
  notes: z.string().optional(),
  status: z.enum(['cleared', 'pending', 'reconciled']).default('cleared'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Schema for pagination and filtering
const filterSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['expense', 'income', 'all']).default('all'),
  category: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

// Schema for creating new expenses
const createExpenseSchema = expenseSchema.omit({ id: true, createdAt: true, updatedAt: true })

// TypeScript type for expense objects
type Expense = z.infer<typeof expenseSchema>

// Create new Hono router instance for expenses routes
export const expensesRoute = new Hono()
  // GET /expenses - Returns filtered, paginated list of expenses
  .get('/', getUser, zValidator('query', filterSchema), async (c) => {
    const user = c.var.user
    const { page, limit, startDate, endDate, type, category, status, search } = c.req.valid('query')
    const offset = (page - 1) * limit

    // Build where conditions
    let conditions = [eq(expensesTable.userId, user.id)]
    
    if (startDate && endDate) {
      conditions.push(between(expensesTable.date, new Date(startDate), new Date(endDate)))
    }
    
    if (type && type !== 'all') {
      conditions.push(eq(expensesTable.type, type))
    }
    
    if (category) {
      conditions.push(eq(expensesTable.category, category))
    }
    
    if (status) {
      conditions.push(eq(expensesTable.status, status))
    }

    // Get filtered expenses
    const expenses = await db
      .select()
      .from(expensesTable)
      .where(and(...conditions))
      .orderBy(desc(expensesTable.date))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const [result] = await db
      .select({ count: count() })
      .from(expensesTable)
      .where(and(...conditions))

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
  // GET /expenses/stats - Returns financial statistics
  .get('/stats', getUser, async (c) => {
    const user = c.var.user
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get total income and expenses for last 30 days
    const [totals] = await db
      .select({
        totalIncome: sql<string>`COALESCE(SUM(CASE WHEN type = 'income' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)::text`,
        totalExpenses: sql<string>`COALESCE(SUM(CASE WHEN type = 'expense' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)::text`,
      })
      .from(expensesTable)
      .where(
        and(
          eq(expensesTable.userId, user.id),
          between(expensesTable.date, thirtyDaysAgo, new Date())
        )
      )

    // Calculate net (income - expenses)
    const net = (Number(totals.totalIncome) - Number(totals.totalExpenses)).toString()

    // Get spending by category
    const categoryTotals = await db
      .select({
        category: expensesTable.category,
        total: sql<string>`CAST(SUM(CAST(amount AS DECIMAL)) AS TEXT)`,
        count: count(),
      })
      .from(expensesTable)
      .where(
        and(
          eq(expensesTable.userId, user.id),
          eq(expensesTable.type, 'expense')
        )
      )
      .groupBy(expensesTable.category)
      .orderBy(desc(sql`SUM(CAST(amount AS DECIMAL))`))

    return c.json({
      last30Days: {
        income: totals.totalIncome,
        expenses: totals.totalExpenses,
        net
      },
      categoryBreakdown: categoryTotals
    })
  })
  // GET /expenses/categories - Returns list of used categories with counts
  .get('/categories', getUser, async (c) => {
    const user = c.var.user
    
    const categories = await db
      .select({
        category: expensesTable.category,
        count: count(),
      })
      .from(expensesTable)
      .where(eq(expensesTable.userId, user.id))
      .groupBy(expensesTable.category)
      .orderBy(desc(sql`count(*)`))

    return c.json({ categories })
  })
  // GET /expenses/:id - Returns single expense by ID
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
  // POST /expenses - Creates new expense
  .post('/', zValidator('json', createExpenseSchema), getUser, async (c) => {
    const expense = c.req.valid('json')
    const user = c.var.user
    const now = new Date()

    const result = await db.insert(expensesTable).values({ 
      ...expense,
      userId: user.id,
      date: expense.date || now,
      createdAt: now,
      updatedAt: now,
    })

    c.status(201)
    return c.json({ result }) 
  })
  // PUT /expenses/:id - Updates expense
  .put('/:id{[0-9]+}', zValidator('json', createExpenseSchema), getUser, async (c) => {
    const id = c.req.param('id')
    const updates = c.req.valid('json')
    const user = c.var.user

    const result = await db.update(expensesTable)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(expensesTable.id, Number(id)),
          eq(expensesTable.userId, user.id)
        )
      )
      .returning()

    if (!result.length) {
      return c.notFound()
    }
    return c.json({ expense: result[0] })
  })
  // DELETE /expenses/:id - Deletes expense
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
  // GET /expenses/total - Returns total sum of all expenses for authenticated user
  .get('/total', getUser, async (c) => {
    const user = c.var.user
    const [result] = await db
      .select({ 
        total: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)::text`
      })
      .from(expensesTable)
      .where(eq(expensesTable.userId, user.id))

    return c.json({ total: result.total || '0' })
  })