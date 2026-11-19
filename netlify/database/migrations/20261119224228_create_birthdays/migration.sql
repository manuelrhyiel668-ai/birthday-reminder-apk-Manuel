CREATE TABLE "birthdays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"circle_id" text NOT NULL,
	"name" text NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"year" integer,
	"relationship" text DEFAULT 'Friends' NOT NULL,
	"favorite" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"reminder_days" integer DEFAULT 1 NOT NULL,
	"color" text DEFAULT 'peach' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "birthdays_circle_idx" ON "birthdays" ("circle_id");