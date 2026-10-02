ALTER TABLE "appointment_status_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "appointments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "booking_categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "menus" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_reviews" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "plans" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "provider_availability" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "provider_services" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "providers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "role_permissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stores" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "themes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP VIEW "public"."product_ratings";--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "chk_appointment_time_order";--> statement-breakpoint
ALTER TABLE "order_reviews" DROP CONSTRAINT "order_reviews_rating_check";--> statement-breakpoint
ALTER TABLE "plans" DROP CONSTRAINT "plans_billing_cycle_check";--> statement-breakpoint
ALTER TABLE "provider_availability" DROP CONSTRAINT "chk_availability_time_order";--> statement-breakpoint
ALTER TABLE "provider_availability" DROP CONSTRAINT "provider_availability_weekday_check";--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_duration_minutes_check";--> statement-breakpoint
ALTER TABLE "user_carts" DROP CONSTRAINT "chk_user_cart_quantity";--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "fk_announcement_store";
--> statement-breakpoint
ALTER TABLE "announcements" DROP CONSTRAINT "fk_announcement_tenant";
--> statement-breakpoint
ALTER TABLE "appointment_status_logs" DROP CONSTRAINT "appointment_status_logs_appointment_id_fkey";
--> statement-breakpoint
ALTER TABLE "appointment_status_logs" DROP CONSTRAINT "appointment_status_logs_changed_by_fkey";
--> statement-breakpoint
ALTER TABLE "appointment_status_logs" DROP CONSTRAINT "appointment_status_logs_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_provider_id_fkey";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_service_id_fkey";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "booking_categories" DROP CONSTRAINT "booking_categories_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "fk_category_parent";
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "fk_category_tenant";
--> statement-breakpoint
ALTER TABLE "menus" DROP CONSTRAINT "fk_menu_parent";
--> statement-breakpoint
ALTER TABLE "menus" DROP CONSTRAINT "fk_menu_tenant";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "fk_order_item_order";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "fk_order_item_product";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "fk_order_item_variant";
--> statement-breakpoint
ALTER TABLE "order_reviews" DROP CONSTRAINT "fk_review_order";
--> statement-breakpoint
ALTER TABLE "order_reviews" DROP CONSTRAINT "fk_review_product";
--> statement-breakpoint
ALTER TABLE "order_reviews" DROP CONSTRAINT "fk_review_tenant";
--> statement-breakpoint
ALTER TABLE "order_reviews" DROP CONSTRAINT "fk_review_user";
--> statement-breakpoint
ALTER TABLE "order_status_logs" DROP CONSTRAINT "fk_order_status_order";
--> statement-breakpoint
ALTER TABLE "order_status_logs" DROP CONSTRAINT "order_status_logs_changed_by_fkey";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "fk_order_address";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "fk_order_store";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "fk_order_tenant";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "fk_order_user";
--> statement-breakpoint
ALTER TABLE "product_images" DROP CONSTRAINT "fk_product_image";
--> statement-breakpoint
ALTER TABLE "product_tags" DROP CONSTRAINT "fk_product_tag_product";
--> statement-breakpoint
ALTER TABLE "product_tags" DROP CONSTRAINT "fk_product_tag_tag";
--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_product_id_fkey";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "fk_product_category";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "fk_product_store";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "fk_product_tenant";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_fkey";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "provider_availability" DROP CONSTRAINT "provider_availability_provider_id_fkey";
--> statement-breakpoint
ALTER TABLE "provider_availability" DROP CONSTRAINT "provider_availability_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" DROP CONSTRAINT "provider_availability_exceptions_provider_id_fkey";
--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" DROP CONSTRAINT "provider_availability_exceptions_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "provider_services" DROP CONSTRAINT "provider_services_provider_id_fkey";
--> statement-breakpoint
ALTER TABLE "provider_services" DROP CONSTRAINT "provider_services_service_id_fkey";
--> statement-breakpoint
ALTER TABLE "provider_services" DROP CONSTRAINT "provider_services_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "providers" DROP CONSTRAINT "providers_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "providers" DROP CONSTRAINT "providers_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "stores" DROP CONSTRAINT "fk_store_tenant";
--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "fk_tag_tenant";
--> statement-breakpoint
ALTER TABLE "tenant_users" DROP CONSTRAINT "tenant_users_tenant_id_fkey";
--> statement-breakpoint
ALTER TABLE "tenant_users" DROP CONSTRAINT "tenant_users_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_addresses" DROP CONSTRAINT "fk_user_address_user";
--> statement-breakpoint
ALTER TABLE "user_carts" DROP CONSTRAINT "fk_user_cart_tenant";
--> statement-breakpoint
ALTER TABLE "user_carts" DROP CONSTRAINT "fk_user_cart_user";
--> statement-breakpoint
ALTER TABLE "user_carts" DROP CONSTRAINT "fk_user_cart_variant";
--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";
--> statement-breakpoint
DROP INDEX "one_appointment_per_provider_per_day";--> statement-breakpoint
DROP INDEX "categories_tenant_slug_key";--> statement-breakpoint
DROP INDEX "product_images_one_primary_per_product";--> statement-breakpoint
DROP INDEX "products_tenant_slug_key";--> statement-breakpoint
DROP INDEX "provider_services_provider_service_key";--> statement-breakpoint
DROP INDEX "refresh_tokens_token_hash_idx";--> statement-breakpoint
DROP INDEX "refresh_tokens_user_id_idx";--> statement-breakpoint
DROP INDEX "services_tenant_slug_key";--> statement-breakpoint
DROP INDEX "user_carts_user_variant_key";--> statement-breakpoint
DROP INDEX "idx_provider_exceptions_provider_id";--> statement-breakpoint
ALTER TABLE "announcements" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "appointments" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "start_time" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "end_time" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "cancelled_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "booking_categories" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "categories" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "menus" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "order_items" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_image" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "discount_price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "order_status_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "order_status_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "orders" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "placed_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "placed_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivered_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "cancelled_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "product_images" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "product_variants" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "products" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "provider_availability" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "start_time" SET DATA TYPE time(6);--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "end_time" SET DATA TYPE time(6);--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "start_time" SET DATA TYPE time(6);--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "end_time" SET DATA TYPE time(6);--> statement-breakpoint
ALTER TABLE "provider_services" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "provider_services" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "provider_services" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "providers" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "services" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "stores" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "tags" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "created_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(6) with time zone;--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "user_carts" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "created_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "updated_at" SET DATA TYPE timestamp(3);--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "id" SET DATA TYPE bigserial;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
CREATE INDEX "idx_provider_exceptions_provider_id" ON "provider_availability_exceptions" USING btree ("provider_id" date_ops,"exception_date" date_ops);--> statement-breakpoint
DROP POLICY "appointment_status_logs_insert_customer" ON "appointment_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "appointment_status_logs_insert_provider" ON "appointment_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "appointment_status_logs_select_provider" ON "appointment_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "appointment_status_logs_insert_staff" ON "appointment_status_logs" CASCADE;--> statement-breakpoint
DROP POLICY "appointments_update_own" ON "appointments" CASCADE;--> statement-breakpoint
DROP POLICY "appointments_select_own" ON "appointments" CASCADE;--> statement-breakpoint
DROP POLICY "appointments_insert_customer" ON "appointments" CASCADE;--> statement-breakpoint
DROP POLICY "appointments_insert_staff" ON "appointments" CASCADE;--> statement-breakpoint
DROP POLICY "appointments_update_provider" ON "appointments" CASCADE;--> statement-breakpoint
DROP POLICY "appointments_select_vendor" ON "appointments" CASCADE;--> statement-breakpoint
DROP POLICY "appointments_select_provider" ON "appointments" CASCADE;--> statement-breakpoint
DROP POLICY "booking_categories_public_select" ON "booking_categories" CASCADE;--> statement-breakpoint
DROP POLICY "booking_categories_manage" ON "booking_categories" CASCADE;--> statement-breakpoint
DROP POLICY "public can view categories" ON "categories" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "menus" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "order_reviews" CASCADE;--> statement-breakpoint
DROP POLICY "plans_public_select" ON "plans" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "product_images" CASCADE;--> statement-breakpoint
DROP POLICY "vendors can insert own product variants" ON "product_variants" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "product_variants" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "products" CASCADE;--> statement-breakpoint
DROP POLICY "profiles_booking_manage_select" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "profiles_insert_own" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "provider_availability_manage_own" ON "provider_availability" CASCADE;--> statement-breakpoint
DROP POLICY "provider_availability_public_select" ON "provider_availability" CASCADE;--> statement-breakpoint
DROP POLICY "provider_availability_manage" ON "provider_availability" CASCADE;--> statement-breakpoint
DROP POLICY "provider_exceptions_manage_own" ON "provider_availability_exceptions" CASCADE;--> statement-breakpoint
DROP POLICY "provider_exceptions_public_select" ON "provider_availability_exceptions" CASCADE;--> statement-breakpoint
DROP POLICY "provider_exceptions_manage" ON "provider_availability_exceptions" CASCADE;--> statement-breakpoint
DROP POLICY "provider_services_public_select" ON "provider_services" CASCADE;--> statement-breakpoint
DROP POLICY "provider_services_manage" ON "provider_services" CASCADE;--> statement-breakpoint
DROP POLICY "providers_manage" ON "providers" CASCADE;--> statement-breakpoint
DROP POLICY "providers_public_select" ON "providers" CASCADE;--> statement-breakpoint
DROP POLICY "super admin full access role_permissions" ON "role_permissions" CASCADE;--> statement-breakpoint
DROP POLICY "admin view role permissions" ON "role_permissions" CASCADE;--> statement-breakpoint
DROP POLICY "services_manage" ON "services" CASCADE;--> statement-breakpoint
DROP POLICY "services_public_select" ON "services" CASCADE;--> statement-breakpoint
DROP POLICY "Allow public read access to active stores" ON "stores" CASCADE;--> statement-breakpoint
DROP POLICY "tenant_users_select_vendor" ON "tenant_users" CASCADE;--> statement-breakpoint
DROP POLICY "tenant_users_insert_policy" ON "tenant_users" CASCADE;--> statement-breakpoint
DROP POLICY "Allow public read active tenants" ON "tenants" CASCADE;--> statement-breakpoint
DROP POLICY "themes_public_select" ON "themes" CASCADE;--> statement-breakpoint
DROP POLICY "user_roles_select_own_or_admin" ON "user_roles" CASCADE;--> statement-breakpoint
DROP POLICY "user_roles_select_own" ON "user_roles" CASCADE;--> statement-breakpoint
DROP POLICY "super admin full access user_roles" ON "user_roles" CASCADE;