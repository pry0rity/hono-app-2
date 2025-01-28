import { index, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default('expense'), // 'expense' or 'income'
  date: timestamp("date").notNull().defaultNow(),
  category: varchar("category", { length: 50 }).notNull().default('uncategorized'),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default('cleared'), // 'cleared', 'pending', 'reconciled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
},
  (expenses) => ({
    userIdIdx: index("user_id_idx").on(expenses.userId),
    dateIdx: index("date_idx").on(expenses.date),
    categoryIdx: index("category_idx").on(expenses.category),
  })
);
