import { index, numeric, pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { relations } from "drizzle-orm";

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default('expense'), // 'expense' or 'income'
  date: timestamp("date").notNull().defaultNow(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default('cleared'), // 'cleared', 'pending', 'reconciled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (expenses) => ({
    userIdIdx: index("user_id_idx").on(expenses.userId),
    dateIdx: index("date_idx").on(expenses.date),
    categoryIdx: index("category_idx").on(expenses.categoryId),
  }));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));
