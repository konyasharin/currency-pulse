CREATE TABLE "rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"base" varchar(3) NOT NULL,
	"quote" varchar(3) NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rates_pair_idx" ON "rates" USING btree ("base","quote","fetched_at" DESC NULLS LAST);