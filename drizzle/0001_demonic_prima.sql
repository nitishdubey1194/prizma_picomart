ALTER TABLE "announcements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "chk_appointment_time_order";--> statement-breakpoint
DROP INDEX "one_appointment_per_provider_per_day";--> statement-breakpoint
DROP INDEX "idx_appointment_status_logs_appt_id";--> statement-breakpoint
DROP INDEX "idx_appointments_provider_time";--> statement-breakpoint
DROP INDEX "idx_appointments_tenant_id";--> statement-breakpoint
DROP INDEX "idx_appointments_user_id";--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "provider_services" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
CREATE INDEX "idx_appointment_status_logs_appt_id" ON "appointment_status_logs" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_provider_time" ON "appointments" USING btree ("provider_id","start_time");--> statement-breakpoint
CREATE INDEX "idx_appointments_tenant_id" ON "appointments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_user_id" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "appointment_status_logs_insert_customer" ON "appointment_status_logs" AS PERMISSIVE FOR INSERT TO public WITH CHECK (EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.id = "appointment_status_logs"."appointment_id" AND a.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "appointments_insert_customer" ON "appointments" AS PERMISSIVE FOR INSERT TO public WITH CHECK ("appointments"."user_id" = auth.uid());--> statement-breakpoint
ALTER POLICY "appointment_status_logs_insert_staff" ON "appointment_status_logs" TO app_user WITH CHECK ((
        has_permission('booking.manage'::app_permission) AND EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id = "appointment_status_logs"."appointment_id" AND a.tenant_id = "appointment_status_logs"."tenant_id"
        )
      ));--> statement-breakpoint
ALTER POLICY "appointment_status_logs_select" ON "appointment_status_logs" TO public USING (EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.id = "appointment_status_logs"."appointment_id" AND (a.user_id = auth.uid() OR has_permission('booking.view_all'::app_permission))
      ));--> statement-breakpoint
ALTER POLICY "appointment_status_logs_select_provider" ON "appointment_status_logs" TO public USING (EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.id = "appointment_status_logs"."appointment_id" AND is_current_user_provider_for(a.provider_id)
      ));--> statement-breakpoint
ALTER POLICY "appointment_status_logs_insert_provider" ON "appointment_status_logs" TO public WITH CHECK (EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.id = "appointment_status_logs"."appointment_id" AND is_current_user_provider_for(a.provider_id)
      ));--> statement-breakpoint
ALTER POLICY "appointments_update_provider" ON "appointments" TO public USING (is_current_user_provider_for("appointments"."provider_id")) WITH CHECK (is_current_user_provider_for("appointments"."provider_id"));--> statement-breakpoint
ALTER POLICY "appointments_insert_staff" ON "appointments" TO public WITH CHECK (has_permission('booking.create'::app_permission));--> statement-breakpoint
ALTER POLICY "appointments_select_own" ON "appointments" TO public USING (("appointments"."user_id" = auth.uid() OR has_permission('booking.view_all'::app_permission)));--> statement-breakpoint
ALTER POLICY "appointments_select_provider" ON "appointments" TO public USING (is_current_user_provider_for("appointments"."provider_id"));--> statement-breakpoint
ALTER POLICY "appointments_update_own" ON "appointments" TO public USING (("appointments"."user_id" = auth.uid() OR has_permission('booking.manage'::app_permission))) WITH CHECK (("appointments"."user_id" = auth.uid() OR has_permission('booking.manage'::app_permission)));