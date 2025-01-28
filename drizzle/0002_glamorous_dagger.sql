DROP INDEX "name_idx";--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "type" varchar(20) DEFAULT 'expense' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "category" varchar(50) DEFAULT 'uncategorized' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "status" varchar(20) DEFAULT 'cleared' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "expenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "category_idx" ON "expenses" USING btree ("category");