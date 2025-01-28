ALTER TABLE "expenses" 
  ADD COLUMN "description" text,
  ADD COLUMN "type" varchar(20) NOT NULL DEFAULT 'expense',
  ADD COLUMN "date" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "category" varchar(50) NOT NULL DEFAULT 'uncategorized',
  ADD COLUMN "notes" text,
  ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'cleared',
  ADD COLUMN "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "date_idx" ON "expenses" ("date");
CREATE INDEX IF NOT EXISTS "category_idx" ON "expenses" ("category");

DROP INDEX IF EXISTS "name_idx";
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "expenses" ("user_id"); 