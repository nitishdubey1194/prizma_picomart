-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."announcement_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."app_permission" AS ENUM('dashboard.view', 'user.view', 'user.block', 'user.verify', 'seller.view', 'seller.approve', 'seller.block', 'category.view', 'category.create', 'category.update', 'category.delete', 'product.view', 'product.create', 'product.update', 'product.delete', 'product.approve', 'product.view_own', 'product.update_own', 'product.delete_own', 'inventory.view', 'inventory.update', 'cart.add', 'cart.update', 'cart.remove', 'order.view_all', 'order.update_status', 'order.cancel', 'order.refund', 'order.view_own', 'order.update_status_own', 'order.create', 'order.cancel_own', 'payment.create', 'payment.view', 'payment.view_own', 'profile.view', 'profile.update', 'address.manage', 'report.sales', 'report.orders', 'report.users', 'payout.view', 'booking.view_all', 'booking.manage', 'booking.view_own', 'booking.cancel_own', 'booking.create');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('super_admin', 'admin', 'vendor', 'customer');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."delivery_type" AS ENUM('radius', 'pincode');--> statement-breakpoint
CREATE TYPE "public"."delivery_types" AS ENUM('pickup', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."fee_value_type" AS ENUM('fixed', 'per_km');--> statement-breakpoint
CREATE TYPE "public"."menu_type" AS ENUM('header', 'footer_1', 'footer_2', 'footer_3', 'footer_4');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'failed', 'out_for_delivery');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cod', 'upi', 'card', 'wallet', 'netbanking');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded', 'failed');--> statement-breakpoint
CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"name" varchar(150) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'India',
	"pincode" varchar(10),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"delivery_mode" "delivery_type" DEFAULT 'radius',
	"delivery_radius_km" numeric(5, 2),
	"handling_fee" numeric(10, 2) DEFAULT '0',
	"min_order_price" integer DEFAULT 100,
	"delivery_fee_value_type" "fee_value_type" DEFAULT 'fixed' NOT NULL,
	"base_distance_km" numeric(10, 2) DEFAULT '0' NOT NULL,
	"delivery_fee_base_price" numeric(10, 2) DEFAULT '0',
	"delivery_fee_perkm" numeric(10, 2) DEFAULT '0' NOT NULL,
	"delivery_fee_fixed" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "services" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "services_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "services_duration_minutes_check" CHECK (duration_minutes > 0)
);
--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "provider_services" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "provider_services_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"provider_id" bigint NOT NULL,
	"service_id" bigint NOT NULL,
	"price_override" numeric(10, 2),
	"duration_override_minutes" integer,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "provider_services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "provider_availability" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "provider_availability_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"provider_id" bigint NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "chk_availability_time_order" CHECK (end_time > start_time),
	CONSTRAINT "provider_availability_weekday_check" CHECK ((weekday >= 0) AND (weekday <= 6))
);
--> statement-breakpoint
ALTER TABLE "provider_availability" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "provider_availability_exceptions" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "provider_availability_exceptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"provider_id" bigint NOT NULL,
	"exception_date" date NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"start_time" time,
	"end_time" time,
	"reason" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100),
	"phone" varchar(15),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"country" varchar(100) DEFAULT 'India',
	"is_default" boolean DEFAULT false,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "themes" (
	"id" serial NOT NULL,
	"name" text NOT NULL,
	"theme_json" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "themes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" bigserial NOT NULL,
	"user_id" uuid NOT NULL,
	"subdomain" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan_id" integer NOT NULL,
	"theme_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" bigint GENERATED BY DEFAULT AS IDENTITY (sequence name "user_roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"role" "app_role" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" bigserial NOT NULL,
	"order_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"variant_id" bigint NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"product_image" varchar(255),
	"variant_name" varchar(100) NOT NULL,
	"attributes_json" jsonb,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_price" numeric(10, 2),
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"tenant_id" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_reviews" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"order_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"product_id" bigint,
	CONSTRAINT "order_reviews_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);
--> statement-breakpoint
ALTER TABLE "order_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" varchar(255),
	"parent_id" bigint,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"store_id" bigint,
	"title" varchar(255) NOT NULL,
	"status" "announcement_status" DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "booking_categories" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "booking_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" bigserial NOT NULL,
	"product_id" bigint NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"tenant_id" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" bigserial NOT NULL,
	"product_id" bigint NOT NULL,
	"variant_name" varchar(100) NOT NULL,
	"sku" varchar(100),
	"price" numeric(10, 2) NOT NULL,
	"discount_price" numeric(10, 2),
	"stock_qty" integer DEFAULT 0,
	"max_buy_qty" integer,
	"attributes_json" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tenant_id" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_tags" (
	"product_id" bigint NOT NULL,
	"tag_id" bigint NOT NULL,
	"tenant_id" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"billing_cycle" text DEFAULT 'monthly',
	"max_products" integer DEFAULT 100,
	"max_customers" integer DEFAULT 1000,
	"max_storage_mb" integer DEFAULT 500,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plans_billing_cycle_check" CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]))
);
--> statement-breakpoint
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" bigint,
	"order_number" varchar(50) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"shipping_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payable_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"handling_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cod' NOT NULL,
	"address_id" bigint NOT NULL,
	"delivery_type" "delivery_types" DEFAULT 'delivery' NOT NULL,
	"delivery_notes" varchar(255),
	"order_data_json" jsonb,
	"placed_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_carts" (
	"tenant_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"variant_id" bigint NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "user_carts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	CONSTRAINT "chk_user_cart_quantity" CHECK (quantity > 0)
);
--> statement-breakpoint
ALTER TABLE "user_carts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "providers" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "providers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"user_id" uuid,
	"name" varchar(150) NOT NULL,
	"title" varchar(150),
	"bio" text,
	"avatar_url" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"slug" varchar(150) NOT NULL,
	"category" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "providers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "menus" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"menu_type" "menu_type" NOT NULL,
	"parent_id" bigint,
	"title" varchar(150) NOT NULL,
	"href" varchar(255),
	"icon" varchar(100),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "menus" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_status_logs" (
	"id" bigserial NOT NULL,
	"order_id" bigint NOT NULL,
	"status" varchar(50) NOT NULL,
	"remarks" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" bigint NOT NULL,
	"changed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "order_status_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"category_id" bigint,
	"store_id" bigint,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"sku" varchar(100),
	"description" text,
	"is_active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid NOT NULL,
	"full_name" text,
	"role" text DEFAULT 'merchant',
	"tenant_id" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"email" text
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" bigint GENERATED BY DEFAULT AS IDENTITY (sequence name "role_permissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"role" "app_role" NOT NULL,
	"permission" "app_permission" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" bigserial NOT NULL,
	"tenant_id" bigint NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "appointment_status_logs" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "appointment_status_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"appointment_id" bigint NOT NULL,
	"status" "booking_status" NOT NULL,
	"remarks" varchar(255),
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "appointments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" bigint NOT NULL,
	"provider_id" bigint NOT NULL,
	"service_id" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"customer_notes" text,
	"internal_notes" text,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"local_date" date NOT NULL,
	CONSTRAINT "chk_appointment_time_order" CHECK (end_time > start_time)
);
--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "fk_store_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ADD CONSTRAINT "provider_availability_exceptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ADD CONSTRAINT "provider_availability_exceptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "fk_user_address_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_item_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_item_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_item_variant" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "fk_category_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "fk_category_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "fk_announcement_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "fk_announcement_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_categories" ADD CONSTRAINT "booking_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "fk_product_image" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "fk_variant_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "fk_product_tag_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "fk_product_tag_tag" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_address" FOREIGN KEY ("address_id") REFERENCES "public"."user_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_carts" ADD CONSTRAINT "fk_user_cart_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_carts" ADD CONSTRAINT "fk_user_cart_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_carts" ADD CONSTRAINT "fk_user_cart_variant" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "fk_menu_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."menus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "fk_menu_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "fk_order_status_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "fk_product_category" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "fk_product_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "fk_product_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "fk_tag_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash" text_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_services_tenant_id" ON "services" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "services_tenant_slug_key" ON "services" USING btree ("tenant_id" int8_ops,"slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_provider_services_provider_id" ON "provider_services" USING btree ("provider_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_provider_services_tenant_id" ON "provider_services" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "provider_services_provider_service_key" ON "provider_services" USING btree ("provider_id" int8_ops,"service_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_tenant_users_role" ON "tenant_users" USING btree ("role" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_tenant_users_tenant_id" ON "tenant_users" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_tenant_users_user_id" ON "tenant_users" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_provider_availability_provider_id" ON "provider_availability" USING btree ("provider_id" int2_ops,"weekday" int2_ops);--> statement-breakpoint
CREATE INDEX "idx_provider_exceptions_provider_id" ON "provider_availability_exceptions" USING btree ("provider_id" date_ops,"exception_date" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_order_items_tenant_id" ON "order_items" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_order_reviews_product_id" ON "order_reviews" USING btree ("product_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_order_reviews_tenant_product" ON "order_reviews" USING btree ("tenant_id" int8_ops,"product_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "categories_tenant_slug_key" ON "categories" USING btree ("tenant_id" int8_ops,"slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_booking_categories_tenant_id" ON "booking_categories" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_product_images_tenant_id" ON "product_images" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_one_primary_per_product" ON "product_images" USING btree ("product_id" int8_ops) WHERE (is_primary = true);--> statement-breakpoint
CREATE INDEX "idx_product_variants_tenant_id" ON "product_variants" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_product_tags_tenant_id" ON "product_tags" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_user_carts_tenant_user" ON "user_carts" USING btree ("tenant_id" int8_ops,"user_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_carts_user_variant_key" ON "user_carts" USING btree ("user_id" int8_ops,"variant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_providers_tenant_id" ON "providers" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "providers_tenant_slug_key" ON "providers" USING btree ("tenant_id" int8_ops,"slug" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_menus_parent" ON "menus" USING btree ("parent_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_navigation_menus_active_position" ON "menus" USING btree ("is_active" int4_ops,"sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_order_status_logs_tenant_id" ON "order_status_logs" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_slug_key" ON "products" USING btree ("tenant_id" int8_ops,"slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" USING btree ("role" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_appointment_status_logs_appt_id" ON "appointment_status_logs" USING btree ("appointment_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_provider_time" ON "appointments" USING btree ("provider_id" int8_ops,"start_time" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_tenant_id" ON "appointments" USING btree ("tenant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_appointments_user_id" ON "appointments" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "one_appointment_per_provider_per_day" ON "appointments" USING btree ("provider_id" uuid_ops,"user_id" uuid_ops,"local_date" int8_ops) WHERE (status <> 'cancelled'::booking_status);--> statement-breakpoint
CREATE VIEW "public"."product_ratings" WITH (security_invoker = true) AS (SELECT product_id, round(avg(rating), 1) AS average_rating, count(*) AS review_count FROM order_reviews GROUP BY product_id);--> statement-breakpoint
CREATE POLICY "Allow public read access to active stores" ON "stores" AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));--> statement-breakpoint
CREATE POLICY "Allow tenant owners full access to their stores" ON "stores" AS PERMISSIVE FOR ALL TO "app_user";--> statement-breakpoint
CREATE POLICY "Enable users to view their own data only" ON "stores" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "services_manage" ON "services" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "services_public_select" ON "services" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "provider_services_manage" ON "provider_services" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "provider_services_public_select" ON "provider_services" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Tenant owners can add members" ON "tenant_users" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK ((EXISTS ( SELECT 1
   FROM tenants t
  WHERE ((t.id = tenant_users.tenant_id) AND (t.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Tenant owners can delete members" ON "tenant_users" AS PERMISSIVE FOR DELETE TO "app_user";--> statement-breakpoint
CREATE POLICY "Tenant owners can update members" ON "tenant_users" AS PERMISSIVE FOR UPDATE TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can view their memberships" ON "tenant_users" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "provider_availability_manage" ON "provider_availability" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "provider_availability_public_select" ON "provider_availability" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "provider_availability_manage_own" ON "provider_availability" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "provider_exceptions_manage" ON "provider_availability_exceptions" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "provider_exceptions_public_select" ON "provider_availability_exceptions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "provider_exceptions_manage_own" ON "provider_availability_exceptions" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Tenant staff can view customer details" ON "user_addresses" AS PERMISSIVE FOR SELECT TO "app_user" USING ((EXISTS ( SELECT 1
   FROM tenant_users tu
  WHERE ((tu.tenant_id = user_addresses.tenant_id) AND (tu.user_id = auth.uid()) AND (tu.is_active = true) AND (tu.role = ANY (ARRAY['admin'::app_role, 'vendor'::app_role]))))));--> statement-breakpoint
CREATE POLICY "Users can create their own addresses" ON "user_addresses" AS PERMISSIVE FOR INSERT TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can delete their own addresses" ON "user_addresses" AS PERMISSIVE FOR DELETE TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can update their own addresses" ON "user_addresses" AS PERMISSIVE FOR UPDATE TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can view their own addresses" ON "user_addresses" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "themes_public_select" ON "themes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Allow public read active tenants" ON "tenants" AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));--> statement-breakpoint
CREATE POLICY "Tenant owner select access" ON "tenants" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "super admin full access user_roles" ON "user_roles" AS PERMISSIVE FOR ALL TO public USING (has_role('super_admin'::app_role)) WITH CHECK (has_role('super_admin'::app_role));--> statement-breakpoint
CREATE POLICY "insert own customer role" ON "user_roles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "user_roles_select_own_or_admin" ON "user_roles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Tenant staff can view order details" ON "order_items" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM tenant_users tu
  WHERE ((tu.tenant_id = order_items.tenant_id) AND (tu.user_id = auth.uid()) AND (tu.is_active = true) AND (tu.role = ANY (ARRAY['admin'::app_role, 'vendor'::app_role]))))));--> statement-breakpoint
CREATE POLICY "Users can view their own order items" ON "order_items" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "order_reviews" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can create their own reviews" ON "order_reviews" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their own reviews" ON "order_reviews" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own reviews" ON "order_reviews" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "vendor can do all on categories" ON "categories" AS PERMISSIVE FOR ALL TO "app_user" USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role)))));--> statement-breakpoint
CREATE POLICY "public can view categories" ON "categories" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "booking_categories_manage" ON "booking_categories" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "booking_categories_public_select" ON "booking_categories" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "vendors can delete own product images" ON "product_images" AS PERMISSIVE FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM ((products p
     JOIN tenants t ON ((t.id = p.tenant_id)))
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((p.id = product_images.product_id) AND (t.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role)))));--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "product_images" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "vendors can insert own product images" ON "product_images" AS PERMISSIVE FOR INSERT TO "app_user";--> statement-breakpoint
CREATE POLICY "vendors can update own product images" ON "product_images" AS PERMISSIVE FOR UPDATE TO "app_user";--> statement-breakpoint
CREATE POLICY "vendors can delete own product variants" ON "product_variants" AS PERMISSIVE FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM ((products p
     JOIN tenants t ON ((t.id = p.tenant_id)))
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((p.id = product_variants.product_id) AND (t.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role)))));--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "product_variants" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "vendors can insert own product variants" ON "product_variants" AS PERMISSIVE FOR INSERT TO "app_user";--> statement-breakpoint
CREATE POLICY "vendors can update own product variants" ON "product_variants" AS PERMISSIVE FOR UPDATE TO "app_user";--> statement-breakpoint
CREATE POLICY "vendors can delete own product tags" ON "product_tags" AS PERMISSIVE FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM ((products p
     JOIN tenants t ON ((t.id = p.tenant_id)))
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((p.id = product_tags.product_id) AND (t.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role)))));--> statement-breakpoint
CREATE POLICY "vendors can insert own product tags" ON "product_tags" AS PERMISSIVE FOR INSERT TO "app_user";--> statement-breakpoint
CREATE POLICY "vendors can update own product tags" ON "product_tags" AS PERMISSIVE FOR UPDATE TO "app_user";--> statement-breakpoint
CREATE POLICY "plans_public_select" ON "plans" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Tenant staff can update orders" ON "orders" AS PERMISSIVE FOR UPDATE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM tenant_users tu
  WHERE ((tu.tenant_id = orders.tenant_id) AND (tu.user_id = auth.uid()) AND (tu.is_active = true) AND (tu.role = ANY (ARRAY['admin'::app_role, 'vendor'::app_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tenant_users tu
  WHERE ((tu.tenant_id = orders.tenant_id) AND (tu.user_id = auth.uid()) AND (tu.is_active = true) AND (tu.role = ANY (ARRAY['admin'::app_role, 'vendor'::app_role]))))));--> statement-breakpoint
CREATE POLICY "Tenant staff can view orders" ON "orders" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can create their own orders" ON "orders" AS PERMISSIVE FOR INSERT TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can view their own orders" ON "orders" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can view their own tenant orders" ON "orders" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "Enable delete for users based on user_id" ON "user_carts" AS PERMISSIVE FOR DELETE TO public USING ((( SELECT auth.uid() AS uid) = user_id));--> statement-breakpoint
CREATE POLICY "user_carts_update_own" ON "user_carts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Enable insert for users based on user_id" ON "user_carts" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable users to view their own data only" ON "user_carts" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "providers_manage" ON "providers" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "providers_public_select" ON "providers" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "menus" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Tenant staff can insert order logs" ON "order_status_logs" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK ((EXISTS ( SELECT 1
   FROM tenant_users tu
  WHERE ((tu.tenant_id = order_status_logs.tenant_id) AND (tu.user_id = auth.uid()) AND (tu.is_active = true) AND (tu.role = ANY (ARRAY['admin'::app_role, 'vendor'::app_role, 'super_admin'::app_role]))))));--> statement-breakpoint
CREATE POLICY "Tenant staff can view order status" ON "order_status_logs" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "Users can view their order status logs" ON "order_status_logs" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "products" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK (((EXISTS ( SELECT 1
   FROM tenants t
  WHERE ((t.id = products.tenant_id) AND (t.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role))))));--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "products" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "vendors can delete own tenant products" ON "products" AS PERMISSIVE FOR DELETE TO "app_user";--> statement-breakpoint
CREATE POLICY "vendors can update own tenant products" ON "products" AS PERMISSIVE FOR UPDATE TO "app_user";--> statement-breakpoint
CREATE POLICY "vendors can view own tenant products" ON "products" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "profiles" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "profiles_booking_manage_select" ON "profiles" AS PERMISSIVE FOR SELECT TO "app_user";--> statement-breakpoint
CREATE POLICY "admin view role permissions" ON "role_permissions" AS PERMISSIVE FOR SELECT TO public USING (has_role('admin'::app_role));--> statement-breakpoint
CREATE POLICY "super admin full access role_permissions" ON "role_permissions" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "appointment_status_logs_insert_staff" ON "appointment_status_logs" AS PERMISSIVE FOR INSERT TO "app_user" WITH CHECK ((has_permission('booking.manage'::app_permission) AND (EXISTS ( SELECT 1
   FROM appointments a
  WHERE ((a.id = appointment_status_logs.appointment_id) AND (a.tenant_id = appointment_status_logs.tenant_id))))));--> statement-breakpoint
CREATE POLICY "appointment_status_logs_select" ON "appointment_status_logs" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "appointment_status_logs_select_provider" ON "appointment_status_logs" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "appointment_status_logs_insert_provider" ON "appointment_status_logs" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "appointments_update_provider" ON "appointments" AS PERMISSIVE FOR UPDATE TO public USING (is_current_user_provider_for(provider_id)) WITH CHECK (is_current_user_provider_for(provider_id));--> statement-breakpoint
CREATE POLICY "appointments_insert_staff" ON "appointments" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "appointments_select_own" ON "appointments" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "appointments_select_provider" ON "appointments" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "appointments_update_own" ON "appointments" AS PERMISSIVE FOR UPDATE TO public;
*/