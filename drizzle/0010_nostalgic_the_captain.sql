ALTER TABLE "appointment_status_logs" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "provider_services" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;