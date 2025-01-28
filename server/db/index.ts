import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema/expenses'
import * as categoriesSchema from './schema/categories'

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client: queryClient, schema: { ...schema, ...categoriesSchema } });

export default db;
