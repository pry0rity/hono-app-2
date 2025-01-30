import { z } from "zod";

// Define schema for expense validation
export const expenseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  amount: z.string(),
  type: z.enum(['expense', 'income']),
  date: z.date(),
  categoryId: z.number().int().positive(),
  notes: z.string().optional(),
  status: z.enum(['cleared', 'pending', 'reconciled']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
export type Expense = z.infer<typeof expenseSchema>

// Create expense schema
export const createExpenseSchema = expenseSchema.omit({ id: true })
export type CreateExpense = z.infer<typeof createExpenseSchema>

// Filter schema
export const filterSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['expense', 'income', 'all']).default('all'),
  category: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})
export type Filter = z.infer<typeof filterSchema>

// Category schema
export const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['expense', 'income']),
  icon: z.string().optional(),
  color: z.string().optional(),
})
export type Category = z.infer<typeof categorySchema>