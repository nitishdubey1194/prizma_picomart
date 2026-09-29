ALTER TABLE "appointment_status_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "booking_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "menus" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "provider_availability" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "provider_services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "providers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "themes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX "idx_provider_exceptions_provider_id";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'announcements'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "announcements" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'appointment_status_logs'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "appointment_status_logs" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "appointment_status_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'appointments'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "appointments" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "appointments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "start_time" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "end_time" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "cancelled_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'booking_categories'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "booking_categories" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "booking_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "booking_categories" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'categories'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "categories" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'menus'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "menus" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "menus" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'order_items'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "order_items" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_image" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "discount_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'order_reviews'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "order_reviews" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "order_reviews" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'order_status_logs'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "order_status_logs" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "order_status_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "order_status_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'orders'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "orders" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "placed_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "placed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "delivered_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "cancelled_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'product_images'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "product_images" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'product_variants'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "product_variants" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'products'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "products" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'provider_availability'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "provider_availability" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "provider_availability_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "start_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "provider_availability" ALTER COLUMN "end_time" SET DATA TYPE time;--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'provider_availability_exceptions'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "provider_availability_exceptions" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "provider_availability_exceptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "start_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ALTER COLUMN "end_time" SET DATA TYPE time;--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'provider_services'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "provider_services" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "provider_services" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "provider_services" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "provider_services_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'providers'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "providers" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "providers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "providers" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (sequence name "role_permissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'services'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "services" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "services_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'stores'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "stores" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'tags'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "tags" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'tenant_users'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "tenant_users" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'tenants'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "tenants" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'user_addresses'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "user_addresses" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user_addresses" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'user_carts'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "user_carts" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "user_carts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user_carts" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (sequence name "user_roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "fk_announcement_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "fk_announcement_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_logs" ADD CONSTRAINT "appointment_status_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_categories" ADD CONSTRAINT "booking_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "fk_category_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "fk_category_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "fk_menu_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."menus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "fk_menu_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_item_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_item_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "fk_order_item_variant" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "fk_review_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "fk_order_status_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_address" FOREIGN KEY ("address_id") REFERENCES "public"."user_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_order_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "fk_product_image" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "fk_product_tag_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "fk_product_tag_tag" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "fk_product_category" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "fk_product_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "fk_product_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ADD CONSTRAINT "provider_availability_exceptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_availability_exceptions" ADD CONSTRAINT "provider_availability_exceptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "fk_store_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "fk_tag_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "fk_user_address_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_carts" ADD CONSTRAINT "fk_user_cart_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_carts" ADD CONSTRAINT "fk_user_cart_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_carts" ADD CONSTRAINT "fk_user_cart_variant" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_appointment_per_provider_per_day" ON "appointments" USING btree ("provider_id" uuid_ops,"user_id" uuid_ops,"local_date" int8_ops) WHERE (status <> 'cancelled'::booking_status);--> statement-breakpoint
CREATE UNIQUE INDEX "categories_tenant_slug_key" ON "categories" USING btree ("tenant_id" int8_ops,"slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_one_primary_per_product" ON "product_images" USING btree ("product_id" int8_ops) WHERE (is_primary = true);--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_slug_key" ON "products" USING btree ("tenant_id" int8_ops,"slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "provider_services_provider_service_key" ON "provider_services" USING btree ("provider_id" int8_ops,"service_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash" text_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "services_tenant_slug_key" ON "services" USING btree ("tenant_id" int8_ops,"slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_carts_user_variant_key" ON "user_carts" USING btree ("user_id" int8_ops,"variant_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_provider_exceptions_provider_id" ON "provider_availability_exceptions" USING btree ("provider_id" date_ops,"exception_date" int8_ops);--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "chk_appointment_time_order" CHECK (end_time > start_time);--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "order_reviews_rating_check" CHECK ((rating >= 1) AND (rating <= 5));--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_billing_cycle_check" CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text]));--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "chk_availability_time_order" CHECK (end_time > start_time);--> statement-breakpoint
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_weekday_check" CHECK ((weekday >= 0) AND (weekday <= 6));--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_duration_minutes_check" CHECK (duration_minutes > 0);--> statement-breakpoint
ALTER TABLE "user_carts" ADD CONSTRAINT "chk_user_cart_quantity" CHECK (quantity > 0);--> statement-breakpoint
CREATE VIEW "public"."product_ratings" WITH (security_invoker = true) AS (SELECT product_id, round(avg(rating), 1) AS average_rating, count(*) AS review_count FROM order_reviews GROUP BY product_id);--> statement-breakpoint
CREATE POLICY "appointment_status_logs_insert_customer" ON "appointment_status_logs" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM appointments a
  WHERE ((a.id = appointment_status_logs.appointment_id) AND (a.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "appointment_status_logs_insert_provider" ON "appointment_status_logs" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "appointment_status_logs_select_provider" ON "appointment_status_logs" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "appointment_status_logs_insert_staff" ON "appointment_status_logs" AS PERMISSIVE FOR INSERT TO "app_user";--> statement-breakpoint
CREATE POLICY "appointments_update_own" ON "appointments" AS PERMISSIVE FOR UPDATE TO public USING (((user_id = auth.uid()) OR has_permission('booking.manage'::app_permission))) WITH CHECK (((user_id = auth.uid()) OR has_permission('booking.manage'::app_permission)));--> statement-breakpoint
CREATE POLICY "appointments_select_own" ON "appointments" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "appointments_insert_customer" ON "appointments" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "appointments_insert_staff" ON "appointments" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "appointments_update_provider" ON "appointments" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "appointments_select_vendor" ON "appointments" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "appointments_select_provider" ON "appointments" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "booking_categories_public_select" ON "booking_categories" AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));--> statement-breakpoint
CREATE POLICY "booking_categories_manage" ON "booking_categories" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "public can view categories" ON "categories" AS PERMISSIVE FOR SELECT TO "app_user" USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "menus" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "order_reviews" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "plans_public_select" ON "plans" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "product_images" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "vendors can insert own product variants" ON "product_variants" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM ((products p
     JOIN tenants t ON ((t.id = p.tenant_id)))
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((p.id = product_variants.product_id) AND (t.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role)))));--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "product_variants" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "products" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "profiles_booking_manage_select" ON "profiles" AS PERMISSIVE FOR SELECT TO "app_user" USING ((has_role('super_admin'::app_role) OR has_role('admin'::app_role) OR has_role('vendor'::app_role)));--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "provider_availability_manage_own" ON "provider_availability" AS PERMISSIVE FOR ALL TO public USING (is_current_user_provider_for(provider_id)) WITH CHECK (is_current_user_provider_for(provider_id));--> statement-breakpoint
CREATE POLICY "provider_availability_public_select" ON "provider_availability" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "provider_availability_manage" ON "provider_availability" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "provider_exceptions_manage_own" ON "provider_availability_exceptions" AS PERMISSIVE FOR ALL TO public USING (is_current_user_provider_for(provider_id)) WITH CHECK (is_current_user_provider_for(provider_id));--> statement-breakpoint
CREATE POLICY "provider_exceptions_public_select" ON "provider_availability_exceptions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "provider_exceptions_manage" ON "provider_availability_exceptions" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "provider_services_public_select" ON "provider_services" AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));--> statement-breakpoint
CREATE POLICY "provider_services_manage" ON "provider_services" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "providers_manage" ON "providers" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "providers_public_select" ON "providers" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "super admin full access role_permissions" ON "role_permissions" AS PERMISSIVE FOR ALL TO public USING (has_role('super_admin'::app_role)) WITH CHECK (has_role('super_admin'::app_role));--> statement-breakpoint
CREATE POLICY "admin view role permissions" ON "role_permissions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "services_manage" ON "services" AS PERMISSIVE FOR ALL TO public USING (has_permission('booking.manage'::app_permission)) WITH CHECK (has_permission('booking.manage'::app_permission));--> statement-breakpoint
CREATE POLICY "services_public_select" ON "services" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Allow public read access to active stores" ON "stores" AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));--> statement-breakpoint
CREATE POLICY "tenant_users_select_vendor" ON "tenant_users" AS PERMISSIVE FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = COALESCE(auth.uid(), (NULLIF(current_setting('app.current_user_id'::text, true), ''::text))::uuid)) AND (ur.role = 'vendor'::app_role)))) OR has_permission('user.manage'::app_permission) OR true));--> statement-breakpoint
CREATE POLICY "tenant_users_insert_policy" ON "tenant_users" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Allow public read active tenants" ON "tenants" AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));--> statement-breakpoint
CREATE POLICY "themes_public_select" ON "themes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "user_roles_select_own_or_admin" ON "user_roles" AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR has_role('super_admin'::app_role)));--> statement-breakpoint
CREATE POLICY "user_roles_select_own" ON "user_roles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "super admin full access user_roles" ON "user_roles" AS PERMISSIVE FOR ALL TO public;