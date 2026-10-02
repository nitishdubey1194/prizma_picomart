ALTER TABLE "announcements" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "announcements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "categories" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "menus" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "menus_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "order_items" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "order_reviews" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "order_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "order_status_logs" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "order_status_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "order_status_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "orders" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "product_images" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "product_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "product_variants" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "product_variants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "products" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "provider_availability" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "provider_services" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "providers" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "services" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "tags" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "tenant_users" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "tenant_users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "themes" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "themes" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "themes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "themes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "user_addresses" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "user_addresses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "user_roles" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "id" SET GENERATED ALWAYS;