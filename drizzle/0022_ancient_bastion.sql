ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tenant_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mobile" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_mobile_unique" UNIQUE("mobile");--> statement-breakpoint
CREATE POLICY "Allow public user registration for tenant" ON "users" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("users"."tenant_id" = nullif(current_setting('request.tenant_id', true), '')::bigint);--> statement-breakpoint
CREATE POLICY "Allow user to read own profile" ON "users" AS PERMISSIVE FOR SELECT TO public USING ("users"."id" = nullif(current_setting('app.current_user_id', true), '')::uuid);