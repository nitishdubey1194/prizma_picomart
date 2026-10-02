DROP INDEX "idx_appointment_status_logs_appt_id";--> statement-breakpoint
DROP INDEX "idx_appointments_provider_time";--> statement-breakpoint
DROP INDEX "idx_appointments_tenant_id";--> statement-breakpoint
DROP INDEX "one_appointment_per_provider_per_day";--> statement-breakpoint
DROP INDEX "idx_booking_categories_tenant_id";--> statement-breakpoint
DROP INDEX "categories_tenant_slug_key";--> statement-breakpoint
DROP INDEX "idx_menus_parent";--> statement-breakpoint
DROP INDEX "idx_order_items_tenant_id";--> statement-breakpoint
DROP INDEX "idx_order_reviews_product_id";--> statement-breakpoint
DROP INDEX "idx_order_reviews_tenant_product";--> statement-breakpoint
DROP INDEX "idx_order_status_logs_tenant_id";--> statement-breakpoint
DROP INDEX "idx_product_images_tenant_id";--> statement-breakpoint
DROP INDEX "product_images_one_primary_per_product";--> statement-breakpoint
DROP INDEX "idx_product_tags_tenant_id";--> statement-breakpoint
DROP INDEX "idx_product_variants_tenant_id";--> statement-breakpoint
DROP INDEX "products_tenant_slug_key";--> statement-breakpoint
DROP INDEX "idx_provider_exceptions_provider_id";--> statement-breakpoint
DROP INDEX "idx_provider_services_provider_id";--> statement-breakpoint
DROP INDEX "idx_provider_services_tenant_id";--> statement-breakpoint
DROP INDEX "provider_services_provider_service_key";--> statement-breakpoint
DROP INDEX "idx_providers_tenant_id";--> statement-breakpoint
DROP INDEX "providers_tenant_slug_key";--> statement-breakpoint
DROP INDEX "idx_services_tenant_id";--> statement-breakpoint
DROP INDEX "services_tenant_slug_key";--> statement-breakpoint
DROP INDEX "idx_tenant_users_tenant_id";--> statement-breakpoint
DROP INDEX "idx_user_carts_tenant_user";--> statement-breakpoint
DROP INDEX "user_carts_user_variant_key";--> statement-breakpoint
CREATE INDEX "idx_appointment_status_logs_appt_id" ON "appointment_status_logs" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_provider_time" ON "appointments" USING btree ("provider_id","start_time");--> statement-breakpoint
CREATE INDEX "idx_appointments_tenant_id" ON "appointments" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_appointment_per_provider_per_day" ON "appointments" USING btree ("provider_id" uuid_ops,"user_id" uuid_ops,"local_date") WHERE (status <> 'cancelled'::booking_status);--> statement-breakpoint
CREATE INDEX "idx_booking_categories_tenant_id" ON "booking_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_tenant_slug_key" ON "categories" USING btree ("tenant_id","slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_menus_parent" ON "menus" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_tenant_id" ON "order_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_order_reviews_product_id" ON "order_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_reviews_tenant_product" ON "order_reviews" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_order_status_logs_tenant_id" ON "order_status_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_images_tenant_id" ON "product_images" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_one_primary_per_product" ON "product_images" USING btree ("product_id") WHERE (is_primary = true);--> statement-breakpoint
CREATE INDEX "idx_product_tags_tenant_id" ON "product_tags" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_product_variants_tenant_id" ON "product_variants" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_slug_key" ON "products" USING btree ("tenant_id","slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_provider_exceptions_provider_id" ON "provider_availability_exceptions" USING btree ("provider_id" date_ops,"exception_date");--> statement-breakpoint
CREATE INDEX "idx_provider_services_provider_id" ON "provider_services" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_provider_services_tenant_id" ON "provider_services" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_services_provider_service_key" ON "provider_services" USING btree ("provider_id","service_id");--> statement-breakpoint
CREATE INDEX "idx_providers_tenant_id" ON "providers" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_tenant_slug_key" ON "providers" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_services_tenant_id" ON "services" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "services_tenant_slug_key" ON "services" USING btree ("tenant_id","slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tenant_users_tenant_id" ON "tenant_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_user_carts_tenant_user" ON "user_carts" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_carts_user_variant_key" ON "user_carts" USING btree ("user_id","variant_id");