ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_mobile_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fullname" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_email_unique_idx" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_mobile_unique_idx" ON "users" USING btree ("tenant_id","mobile");