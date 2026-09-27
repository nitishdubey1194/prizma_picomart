ALTER TYPE "public"."app_permission" ADD VALUE 'user.manage';--> statement-breakpoint
ALTER TABLE "order_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_status_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_tags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_addresses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_carts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "fk_variant_product";
--> statement-breakpoint
DROP INDEX "idx_appointment_status_logs_appt_id";--> statement-breakpoint
DROP INDEX "idx_appointments_provider_time";--> statement-breakpoint
DROP INDEX "idx_appointments_tenant_id";--> statement-breakpoint
DROP INDEX "idx_appointments_user_id";--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
CREATE UNIQUE INDEX "one_appointment_per_provider_per_day" ON "appointments" USING btree ("provider_id" uuid_ops,"user_id" uuid_ops,"local_date" int8_ops) WHERE (status <> 'cancelled'::booking_status);--> statement-breakpoint
CREATE INDEX "idx_appointment_status_logs_appt_id" ON "appointment_status_logs" USING btree ("appointment_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_provider_time" ON "appointments" USING btree ("provider_id" int8_ops,"start_time" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_tenant_id" ON "appointments" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_user_id" ON "appointments" USING btree ("user_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "chk_appointment_time_order" CHECK (end_time > start_time);--> statement-breakpoint
DROP POLICY "appointment_status_logs_select" ON "appointment_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "vendor can do all on categories" ON "categories" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant staff can view order details" ON "order_items" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their own order items" ON "order_items" CASCADE;--> statement-breakpoint
DROP POLICY "Users can create their own reviews" ON "order_reviews" CASCADE;--> statement-breakpoint
DROP POLICY "Users can update their own reviews" ON "order_reviews" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their own reviews" ON "order_reviews" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant staff can insert order logs" ON "order_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant staff can view order status" ON "order_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their order status logs" ON "order_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant staff can update orders" ON "orders" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant staff can view orders" ON "orders" CASCADE;--> statement-breakpoint
DROP POLICY "Users can create their own orders" ON "orders" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their own orders" ON "orders" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their own tenant orders" ON "orders" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can delete own product images" ON "product_images" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can insert own product images" ON "product_images" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can update own product images" ON "product_images" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can delete own product tags" ON "product_tags" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can insert own product tags" ON "product_tags" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can update own product tags" ON "product_tags" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can delete own product variants" ON "product_variants" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can update own product variants" ON "product_variants" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for authenticated users only" ON "products" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can delete own tenant products" ON "products" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can update own tenant products" ON "products" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can view own tenant products" ON "products" CASCADE;--> statement-breakpoint
DROP POLICY "Allow tenant owners full access to their stores" ON "stores" CASCADE;--> statement-breakpoint
DROP POLICY "Enable users to view their own data only" ON "stores" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant owners can add members" ON "tenant_users" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant owners can delete members" ON "tenant_users" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant owners can update members" ON "tenant_users" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their memberships" ON "tenant_users" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant owner select access" ON "tenants" CASCADE;--> statement-breakpoint
DROP POLICY "Tenant staff can view customer details" ON "user_addresses" CASCADE;--> statement-breakpoint
DROP POLICY "Users can create their own addresses" ON "user_addresses" CASCADE;--> statement-breakpoint
DROP POLICY "Users can delete their own addresses" ON "user_addresses" CASCADE;--> statement-breakpoint
DROP POLICY "Users can update their own addresses" ON "user_addresses" CASCADE;--> statement-breakpoint
DROP POLICY "Users can view their own addresses" ON "user_addresses" CASCADE;--> statement-breakpoint
DROP POLICY "Enable delete for users based on user_id" ON "user_carts" CASCADE;--> statement-breakpoint
DROP POLICY "user_carts_update_own" ON "user_carts" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for users based on user_id" ON "user_carts" CASCADE;--> statement-breakpoint
DROP POLICY "Enable users to view their own data only" ON "user_carts" CASCADE;--> statement-breakpoint
DROP POLICY "insert own customer role" ON "user_roles" CASCADE;--> statement-breakpoint
CREATE POLICY "appointments_select_vendor" ON "appointments" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "tenant_users_select_vendor" ON "tenant_users" AS PERMISSIVE FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = COALESCE(auth.uid(), (NULLIF(current_setting('app.current_user_id'::text, true), ''::text))::uuid)) AND (ur.role = 'vendor'::app_role)))) OR has_permission('user.manage'::app_permission) OR true));--> statement-breakpoint
CREATE POLICY "tenant_users_insert_policy" ON "tenant_users" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "user_roles_select_own" ON "user_roles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
ALTER POLICY "appointment_status_logs_insert_customer" ON "appointment_status_logs" TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM appointments a
  WHERE ((a.id = appointment_status_logs.appointment_id) AND (a.user_id = auth.uid())))));--> statement-breakpoint
ALTER POLICY "appointment_status_logs_insert_staff" ON "appointment_status_logs" TO app_user WITH CHECK  ((
        has_permission('booking.manage'::app_permission) AND EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id = "appointment_status_logs"."appointment_id" AND a.tenant_id = "appointment_status_logs"."tenant_id"
        )
      ));--> statement-breakpoint
ALTER POLICY "appointment_status_logs_insert_provider" ON "appointment_status_logs" TO public WITH CHECK  (EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.id = "appointment_status_logs"."appointment_id" AND is_current_user_provider_for(a.provider_id)
      ));--> statement-breakpoint
ALTER POLICY "appointment_status_logs_select_provider" ON "appointment_status_logs" TO public USING (EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.id = "appointment_status_logs"."appointment_id" AND is_current_user_provider_for(a.provider_id)
      ));--> statement-breakpoint
ALTER POLICY "appointments_insert_customer" ON "appointments" TO public WITH CHECK  ("appointments"."user_id" = auth.uid());--> statement-breakpoint
ALTER POLICY "appointments_insert_staff" ON "appointments" TO public WITH CHECK  (has_permission('booking.create'::app_permission));--> statement-breakpoint
ALTER POLICY "appointments_select_own" ON "appointments" TO public USING (("appointments"."user_id" = auth.uid() OR has_permission('booking.view_all'::app_permission)));--> statement-breakpoint
ALTER POLICY "appointments_select_provider" ON "appointments" TO public USING (is_current_user_provider_for("appointments"."provider_id"));--> statement-breakpoint
ALTER POLICY "appointments_update_own" ON "appointments" TO public USING (((user_id = auth.uid()) OR has_permission('booking.manage'::app_permission))) WITH CHECK (((user_id = auth.uid()) OR has_permission('booking.manage'::app_permission)));--> statement-breakpoint
ALTER POLICY "appointments_update_provider" ON "appointments" TO public USING (is_current_user_provider_for("appointments"."provider_id")) WITH CHECK  (is_current_user_provider_for("appointments"."provider_id"));--> statement-breakpoint
ALTER POLICY "booking_categories_manage" ON "booking_categories" TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK  (has_permission('booking.manage'::app_permission));--> statement-breakpoint
ALTER POLICY "booking_categories_public_select" ON "booking_categories" TO public USING ((is_active = true));--> statement-breakpoint
ALTER POLICY "public can view categories" ON "categories" TO app_user USING (true);--> statement-breakpoint
ALTER POLICY "Enable read access for all users" ON "product_images" TO public USING (true);--> statement-breakpoint
ALTER POLICY "vendors can insert own product variants" ON "product_variants" TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM ((products p
     JOIN tenants t ON ((t.id = p.tenant_id)))
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((p.id = product_variants.product_id) AND (t.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role)))));--> statement-breakpoint
ALTER POLICY "Enable read access for all users" ON "products" TO public USING (true);--> statement-breakpoint
ALTER POLICY "Enable read access for all users" ON "profiles" TO public USING (true);--> statement-breakpoint
ALTER POLICY "profiles_booking_manage_select" ON "profiles" TO app_user USING ((has_role('super_admin'::app_role) OR has_role('admin'::app_role) OR has_role('vendor'::app_role)));--> statement-breakpoint
ALTER POLICY "provider_availability_manage" ON "provider_availability" TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK  (has_permission('booking.manage'::app_permission));--> statement-breakpoint
ALTER POLICY "provider_availability_manage_own" ON "provider_availability" TO public USING (is_current_user_provider_for(provider_id)) WITH CHECK (is_current_user_provider_for(provider_id));--> statement-breakpoint
ALTER POLICY "provider_exceptions_manage" ON "provider_availability_exceptions" TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK  (has_permission('booking.manage'::app_permission));--> statement-breakpoint
ALTER POLICY "provider_exceptions_manage_own" ON "provider_availability_exceptions" TO public USING (is_current_user_provider_for(provider_id)) WITH CHECK (is_current_user_provider_for(provider_id));--> statement-breakpoint
ALTER POLICY "provider_services_manage" ON "provider_services" TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK  (has_permission('booking.manage'::app_permission));--> statement-breakpoint
ALTER POLICY "provider_services_public_select" ON "provider_services" TO public USING ((is_active = true));--> statement-breakpoint
ALTER POLICY "admin view role permissions" ON "role_permissions" TO public USING (has_role('admin'::app_role));--> statement-breakpoint
ALTER POLICY "super admin full access role_permissions" ON "role_permissions" TO public USING (has_role('super_admin'::app_role)) WITH CHECK (has_role('super_admin'::app_role));--> statement-breakpoint
ALTER POLICY "super admin full access user_roles" ON "user_roles" TO public USING (has_role('super_admin'::app_role)) WITH CHECK  (has_role('super_admin'::app_role));--> statement-breakpoint
ALTER POLICY "user_roles_select_own_or_admin" ON "user_roles" TO public USING (((user_id = auth.uid()) OR has_role('super_admin'::app_role)));