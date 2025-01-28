CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(20) DEFAULT 'expense' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"category" varchar(50) DEFAULT 'uncategorized' NOT NULL,
	"notes" text,
	"status" varchar(20) DEFAULT 'cleared' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "expenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "category_idx" ON "expenses" USING btree ("category");