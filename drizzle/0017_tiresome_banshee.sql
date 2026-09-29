DROP INDEX "idx_appointments_user_id";--> statement-breakpoint
DROP INDEX "one_appointment_per_provider_per_day";--> statement-breakpoint
DROP INDEX "refresh_tokens_user_id_idx";--> statement-breakpoint
DROP INDEX "idx_tenant_users_user_id";--> statement-breakpoint
DROP INDEX "idx_user_roles_user_id";--> statement-breakpoint
CREATE INDEX "idx_appointments_user_id" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_appointment_per_provider_per_day" ON "appointments" USING btree ("provider_id","user_id","local_date") WHERE (status <> 'cancelled'::booking_status);--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_users_user_id" ON "tenant_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id");