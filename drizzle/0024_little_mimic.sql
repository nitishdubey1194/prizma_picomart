DROP INDEX "users_tenant_email_unique_idx";--> statement-breakpoint
DROP INDEX "users_tenant_mobile_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_email_mobile_unique_idx" ON "users" USING btree ("tenant_id","email","mobile");