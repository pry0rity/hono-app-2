CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"type" varchar(20) DEFAULT 'expense' NOT NULL,
	"icon" varchar(50),
	"color" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DROP INDEX "category_idx";--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "category_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "category";