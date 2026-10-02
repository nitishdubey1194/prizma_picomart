ALTER TABLE "tenants" DROP CONSTRAINT "tenants_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "user_id";