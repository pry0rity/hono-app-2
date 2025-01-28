import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull().default('expense'), // 'expense' or 'income'
  icon: varchar("icon", { length: 50 }), // Optional icon identifier
  color: varchar("color", { length: 50 }), // Color code for UI
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});