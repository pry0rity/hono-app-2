import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { getUser } from '../kinde'

import db from '../db'
import { expenses as expensesTable } from '../db/schema/expenses'
import { categories as categoriesTable } from '../db/schema/categories'
import { and, eq, desc, count, sum, sql, between, like, or, SQL, asc } from 'drizzle-orm'
import { expenseSchema, createExpenseSchema, filterSchema,  } from "../sharedTypes";

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
      conditions.push(eq(categoriesTable.name, category))
    }

    if (status) {
      conditions.push(eq(expensesTable.status, status))
    }

    // Get filtered expenses with category information
    const expenses = await db
      .select({
        id: expensesTable.id,
        userId: expensesTable.userId,
        title: expensesTable.title,
        description: expensesTable.description,
        amount: expensesTable.amount,
        type: expensesTable.type,
        date: expensesTable.date,
        categoryId: expensesTable.categoryId,
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          color: categoriesTable.color,
          icon: categoriesTable.icon,
        },
        notes: expensesTable.notes,
        status: expensesTable.status,
        createdAt: expensesTable.createdAt,
        updatedAt: expensesTable.updatedAt,
      })
      .from(expensesTable)
      .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
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
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          color: categoriesTable.color,
          icon: categoriesTable.icon,
        },
        total: sql<string>`CAST(SUM(CAST(amount AS DECIMAL)) AS TEXT)`,
        count: count(),
      })
      .from(expensesTable)
      .leftJoin(categoriesTable, eq(expensesTable.categoryId, categoriesTable.id))
      .where(
        and(
          eq(expensesTable.userId, user.id),
          eq(expensesTable.type, 'expense')
        )
      )
      .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.color, categoriesTable.icon)
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
  // GET /expenses/categories - Returns list of all categories
  .get('/categories', getUser, async (c) => {
    const categories = await db
      .select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.name))

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
      userId: user.id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      type: expense.type,
      date: expense.date || now,
      categoryId: expense.categoryId,
      notes: expense.notes,
      status: expense.status,
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