


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";
-- pg_graphql, pg_stat_statements, supabase_vault: Supabase-platform-only, not needed self-hosted






-- removed: pg_graphql (Supabase-only)






-- removed: pg_stat_statements (needs shared_preload_libraries, optional)






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";






-- removed: supabase_vault (Supabase-only)






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "public";






CREATE TYPE "public"."announcement_status" AS ENUM (
    'draft',
    'published'
);


ALTER TYPE "public"."announcement_status" OWNER TO "picomart";


CREATE TYPE "public"."app_permission" AS ENUM (
    'dashboard.view',
    'user.view',
    'user.block',
    'user.verify',
    'seller.view',
    'seller.approve',
    'seller.block',
    'category.view',
    'category.create',
    'category.update',
    'category.delete',
    'product.view',
    'product.create',
    'product.update',
    'product.delete',
    'product.approve',
    'product.view_own',
    'product.update_own',
    'product.delete_own',
    'inventory.view',
    'inventory.update',
    'cart.add',
    'cart.update',
    'cart.remove',
    'order.view_all',
    'order.update_status',
    'order.cancel',
    'order.refund',
    'order.view_own',
    'order.update_status_own',
    'order.create',
    'order.cancel_own',
    'payment.create',
    'payment.view',
    'payment.view_own',
    'profile.view',
    'profile.update',
    'address.manage',
    'report.sales',
    'report.orders',
    'report.users',
    'payout.view',
    'booking.view_all',
    'booking.manage',
    'booking.view_own',
    'booking.cancel_own',
    'booking.create'
);


ALTER TYPE "public"."app_permission" OWNER TO "picomart";


CREATE TYPE "public"."app_role" AS ENUM (
    'super_admin',
    'admin',
    'vendor',
    'customer'
);


ALTER TYPE "public"."app_role" OWNER TO "picomart";


CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    -- 'no_show'
);


ALTER TYPE "public"."booking_status" OWNER TO "picomart";


CREATE TYPE "public"."delivery_type" AS ENUM (
    'radius',
    'pincode'
);


ALTER TYPE "public"."delivery_type" OWNER TO "picomart";


CREATE TYPE "public"."delivery_types" AS ENUM (
    'pickup',
    'delivery'
);


ALTER TYPE "public"."delivery_types" OWNER TO "picomart";


CREATE TYPE "public"."fee_value_type" AS ENUM (
    'fixed',
    'per_km'
);


ALTER TYPE "public"."fee_value_type" OWNER TO "picomart";


CREATE TYPE "public"."menu_type" AS ENUM (
    'header',
    'footer_1',
    'footer_2',
    'footer_3',
    'footer_4'
);


ALTER TYPE "public"."menu_type" OWNER TO "picomart";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
    'failed',
    'out_for_delivery'
);


ALTER TYPE "public"."order_status" OWNER TO "picomart";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cod',
    'upi',
    'card',
    'wallet',
    'netbanking'
);


ALTER TYPE "public"."payment_method" OWNER TO "picomart";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'refunded',
    'failed'
);


ALTER TYPE "public"."payment_status" OWNER TO "picomart";


CREATE TYPE "public"."timerange" AS RANGE (
    subtype = time without time zone,
    multirange_type_name = "public"."timemultirange"
);


ALTER TYPE "public"."timerange" OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."add_to_cart"("p_tenant_id" bigint, "p_user_id" "uuid", "p_variant_id" bigint, "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.user_carts (
    tenant_id,
    user_id,
    variant_id,
    quantity
  )
  values (
    p_tenant_id,
    p_user_id,
    p_variant_id,
    p_quantity
  )
  on conflict (
    tenant_id,
    user_id,
    variant_id
  )
  do update
  set quantity =
    user_carts.quantity +
    excluded.quantity,
    updated_at = now();
end;
$$;


ALTER FUNCTION "public"."add_to_cart"("p_tenant_id" bigint, "p_user_id" "uuid", "p_variant_id" bigint, "p_quantity" integer) OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."assign_default_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_default_role"() OWNER TO "picomart";


-- removed: public.authorize() - dead Supabase-JWT-claim-based function, never called, superseded by has_permission()/has_role()


CREATE OR REPLACE FUNCTION "public"."book_appointment"("p_tenant_id" bigint, "p_provider_id" bigint, "p_service_id" bigint, "p_start_time" timestamp with time zone, "p_customer_notes" "text" DEFAULT NULL::"text") RETURNS TABLE("appointment_id" bigint, "start_time" timestamp with time zone, "end_time" timestamp with time zone, "status" "public"."booking_status", "price" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
    v_user_id uuid;
    v_duration int;
    v_price numeric;
    v_end_time timestamptz;
    v_weekday int;
    v_slot_ok boolean;
    v_appointment_id bigint;
    v_local_tz text := 'Asia/Kolkata';
    v_local_date date;
    v_constraint_name text;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Unauthorized';
    end if;

    select
        coalesce(ps.duration_override_minutes, s.duration_minutes),
        coalesce(ps.price_override, s.price)
    into v_duration, v_price
    from public.services s
    left join public.provider_services ps
        on ps.service_id = s.id and ps.provider_id = p_provider_id and ps.is_active = true
    where s.id = p_service_id
      and s.tenant_id = p_tenant_id
      and s.is_active = true;

    if not found then
        raise exception 'Service not available.';
    end if;

    v_end_time := p_start_time + (v_duration || ' minutes')::interval;
    v_local_date := (p_start_time at time zone v_local_tz)::date;
    v_weekday := extract(dow from p_start_time at time zone v_local_tz);

    if p_start_time < now() then
        raise exception 'Cannot book an appointment in the past.';
    end if;

    if exists (
        select 1 from public.provider_availability_exceptions e
        where e.provider_id = p_provider_id
          and e.exception_date = v_local_date
          and e.is_available = false
    ) then
        raise exception 'Provider is unavailable on this date.';
    end if;

    select exists (
        select 1 from public.provider_availability a
        where a.provider_id = p_provider_id
          and a.weekday = v_weekday
          and a.is_active = true
          and (p_start_time at time zone v_local_tz)::time >= a.start_time
          and (v_end_time at time zone v_local_tz)::time <= a.end_time
    ) into v_slot_ok;

    if not v_slot_ok then
        raise exception 'Selected time is outside provider availability.';
    end if;

    ------------------------------------------------------------------
    -- Friendly pre-checks (fast path). Constraints below are the final
    -- race-condition guard for all three.
    ------------------------------------------------------------------
    if exists (
        select 1 from public.appointments existing
        where existing.provider_id = p_provider_id
          and existing.user_id = v_user_id
          and existing.local_date = v_local_date
          and existing.status not in ('cancelled', 'no_show')
    ) then
        raise exception 'You already have an appointment with this provider today.';
    end if;

    if exists (
        select 1 from public.appointments existing
        where existing.user_id = v_user_id
          and existing.status not in ('cancelled', 'no_show')
          and existing.start_time < v_end_time
          and p_start_time < existing.end_time
    ) then
        raise exception 'You already have another appointment during this time.';
    end if;

    insert into public.appointments (
        tenant_id, provider_id, service_id, user_id,
        start_time, end_time, local_date, status, price, customer_notes
    ) values (
        p_tenant_id, p_provider_id, p_service_id, v_user_id,
        p_start_time, v_end_time, v_local_date, 'pending', v_price, p_customer_notes
    )
    returning id into v_appointment_id;

    insert into public.appointment_status_logs (
        tenant_id, appointment_id, status, remarks, changed_by
    ) values (
        p_tenant_id, v_appointment_id, 'pending', 'Appointment requested', v_user_id
    );

    return query
    select v_appointment_id, p_start_time, v_end_time, 'pending'::public.booking_status, v_price;
exception
    when unique_violation then
        raise exception 'You already have an appointment with this provider today.';
    when exclusion_violation then
        get stacked diagnostics v_constraint_name = constraint_name;
        if v_constraint_name = 'no_overlapping_appointments_per_user' then
            raise exception 'You already have another appointment during this time.';
        else
            raise exception 'This time slot was just booked by someone else. Please pick another slot.';
        end if;
end;$$;


ALTER FUNCTION "public"."book_appointment"("p_tenant_id" bigint, "p_provider_id" bigint, "p_service_id" bigint, "p_start_time" timestamp with time zone, "p_customer_notes" "text") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."cancel_appointment"("p_appointment_id" bigint, "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_appt record;
    v_cutoff_hours int := 2;  -- adjust to your policy
begin
    select * into v_appt
    from public.appointments
    where id = p_appointment_id
      and user_id = auth.uid()
    for update;

    if not found then
        raise exception 'Appointment not found.';
    end if;

    if v_appt.status in ('cancelled', 'completed', 'no_show') then
        raise exception 'This appointment can no longer be cancelled.';
    end if;

    if v_appt.start_time < now() + (v_cutoff_hours || ' hours')::interval then
        raise exception 'Cancellations must be made at least % hours in advance.', v_cutoff_hours;
    end if;

    update public.appointments
    set status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = p_reason
    where id = p_appointment_id;

    insert into public.appointment_status_logs (
        tenant_id, appointment_id, status, remarks, changed_by
    ) values (
        v_appt.tenant_id, p_appointment_id, 'cancelled', coalesce(p_reason, 'Cancelled by customer'), auth.uid()
    );
end;
$$;


ALTER FUNCTION "public"."cancel_appointment"("p_appointment_id" bigint, "p_reason" "text") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."checkout"("p_tenant_id" bigint, "p_address_id" bigint, "p_payment_method" "public"."payment_method", "p_delivery_notes" "text" DEFAULT NULL::"text") RETURNS TABLE("order_id" bigint, "order_number" "text", "payable_amount" numeric, "payment_status" "public"."payment_status", "order_status" "public"."order_status")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_validation record;

    v_order_id bigint;
    v_order_number text;
begin

    ----------------------------------------------------
    -- Validate cart and lock inventory
    ----------------------------------------------------

    select *
    into v_validation
    from public.checkout_validate_cart(
        p_tenant_id,
        p_address_id
    );

    ----------------------------------------------------
    -- Generate order number
    ----------------------------------------------------

    v_order_number := public.generate_order_number();

    ----------------------------------------------------
    -- Create Order
    ----------------------------------------------------

    insert into public.orders (
        tenant_id,
        user_id,
        order_number,

        status,

        total_amount,
        discount_amount,
        tax_amount,
        shipping_fee,
        handling_amount,
        payable_amount,

        payment_status,
        payment_method,

        address_id,
        delivery_notes
    )
    values (
        p_tenant_id,

        v_validation.out_user_id,

        v_order_number,

        'pending',

        v_validation.out_subtotal,

        v_validation.out_discount,

        v_validation.out_tax,

        v_validation.out_shipping,

        v_validation.out_handling,

        v_validation.out_payable,

        'pending',

        p_payment_method,

        p_address_id,

        p_delivery_notes
    )
    returning id
    into v_order_id;

    ----------------------------------------------------
    -- Snapshot Order Items
    ----------------------------------------------------

    perform public.create_order_items(
        v_order_id,
        p_tenant_id,
        v_validation.out_user_id
    );

    ----------------------------------------------------
    -- Initial Status Log
    ----------------------------------------------------

    perform public.create_order_status_log(
        v_order_id,
        p_tenant_id
    );

    ----------------------------------------------------
    -- Deduct Inventory
    ----------------------------------------------------

    perform public.deduct_inventory(
        p_tenant_id,
        v_validation.out_user_id
    );

    ----------------------------------------------------
    -- Clear Cart
    ----------------------------------------------------

    perform public.clear_user_cart(
        p_tenant_id,
        v_validation.out_user_id
    );

    ----------------------------------------------------
    -- Return
    ----------------------------------------------------

    return query
    select
        v_order_id,
        v_order_number,
        v_validation.out_payable,
        'pending'::payment_status,
        'pending'::order_status;

end;
$$;


ALTER FUNCTION "public"."checkout"("p_tenant_id" bigint, "p_address_id" bigint, "p_payment_method" "public"."payment_method", "p_delivery_notes" "text") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."checkout_validate_cart"("p_tenant_id" bigint, "p_address_id" bigint) RETURNS TABLE("out_user_id" "uuid", "out_subtotal" numeric, "out_shipping" numeric, "out_handling" numeric, "out_tax" numeric, "out_discount" numeric, "out_payable" numeric)
    LANGUAGE "plpgsql"
    AS $$declare
    v_user_id uuid;
    v_item record;
    v_store record;
    v_subtotal numeric := 0;
    v_shipping numeric := 0;
    v_handling numeric := 7;
    v_tax numeric := 0;
    v_discount numeric := 0;
begin

    ------------------------------------------------------------------
    -- Current User
    ------------------------------------------------------------------

    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'Unauthorized';
    end if;

    ---------------------------
    --fetch store details
    ---------------------------
    select 
        coalesce(s.handling_fee, 0) as handling_fee,
        coalesce(s.delivery_fee_fixed, 0) as shipping_fee,
        coalesce(s.min_order_price, 0) as min_order_price
    into v_store
    from public.stores s
    where s.tenant_id = p_tenant_id
      and s.is_active = true
      -- Prefers default store if multiple stores exist for a tenant
    order by s.is_default desc, s.id asc
    limit 1;

    if not found then
        raise exception 'Active store not found for this tenant.';
    end if;

    v_handling := v_store.handling_fee;
    v_shipping := v_store.shipping_fee;
    ------------------------------------------------------------------
    -- Validate Address
    ------------------------------------------------------------------

    if not exists (
        select 1
        from public.user_addresses ua
        where ua.id = p_address_id
          and ua.tenant_id = p_tenant_id
          and ua.user_id = v_user_id
    ) then
        raise exception 'Invalid address.';
    end if;

    ------------------------------------------------------------------
    -- Validate Cart & Lock Inventory
    ------------------------------------------------------------------

    for v_item in

        select
            uc.quantity,

            p.name,
            p.is_active,

            pv.id,
            pv.price,
            pv.discount_price,
            pv.stock_qty,
            pv.max_buy_qty

        from public.user_carts uc

        inner join public.product_variants pv
            on pv.id = uc.variant_id

        inner join public.products p
            on p.id = pv.product_id

        where uc.tenant_id = p_tenant_id
          and uc.user_id = v_user_id

        for update of pv

    loop

        if not v_item.is_active then
            raise exception
                'Product "%" is inactive.',
                v_item.name;
        end if;

        if v_item.stock_qty < v_item.quantity then
            raise exception
                'Insufficient stock for "%".',
                v_item.name;
        end if;

        if v_item.max_buy_qty is not null
           and v_item.quantity > v_item.max_buy_qty then
            raise exception
                'Maximum purchase quantity exceeded for "%".',
                v_item.name;
        end if;

        v_subtotal :=
            v_subtotal +
            (
                v_item.quantity *
                coalesce(
                    v_item.discount_price,
                    v_item.price
                )
            );

    end loop;

    ------------------------------------------------------------------
    -- Cart Empty & Min Order Price Checks
    ------------------------------------------------------------------

    if v_subtotal <= 0 then
        raise exception 'Cart is empty.';
    end if;

    if v_subtotal <= 0 then
        raise exception 'Cart is empty.';
    end if;

    if v_subtotal < v_store.min_order_price then
        raise exception 
            'Minimum order price is %. Current subtotal is %.', 
            v_store.min_order_price, 
            v_subtotal;
    end if;
    ------------------------------------------------------------------
    -- Return Summary
    ------------------------------------------------------------------

    return query
    select
        v_user_id,
        v_subtotal,
        v_shipping,
        v_handling,
        v_tax,
        v_discount,
        (
            v_subtotal +
            v_shipping +
            v_handling +
            v_tax -
            v_discount
        );

end;$$;


ALTER FUNCTION "public"."checkout_validate_cart"("p_tenant_id" bigint, "p_address_id" bigint) OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."clear_user_cart"("p_tenant_id" bigint, "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$

delete
from public.user_carts

where tenant_id = p_tenant_id
and user_id = p_user_id;

$$;


ALTER FUNCTION "public"."clear_user_cart"("p_tenant_id" bigint, "p_user_id" "uuid") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."create_order_items"("p_order_id" bigint, "p_tenant_id" bigint, "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
insert into public.order_items (
    order_id,
    tenant_id,
    product_id,
    variant_id,
    product_name,
    product_image,
    variant_name,
    attributes_json,
    price,
    discount_price,
    tax_amount,
    quantity,
    subtotal
)
select
    p_order_id,
    p_tenant_id,

    p.id,
    pv.id,

    p.name,

    (
        select pi.image_url
        from public.product_images pi
        where pi.product_id = p.id
        order by
            pi.is_primary desc,
            pi.id asc
        limit 1
    ),

    pv.variant_name,

    pv.attributes_json,

    pv.price,

    pv.discount_price,

    0,

    uc.quantity,

    uc.quantity *
    coalesce(
        pv.discount_price,
        pv.price
    )

from public.user_carts uc

join public.product_variants pv
    on pv.id = uc.variant_id

join public.products p
    on p.id = pv.product_id

where uc.tenant_id = p_tenant_id
and uc.user_id = p_user_id;

$$;


ALTER FUNCTION "public"."create_order_items"("p_order_id" bigint, "p_tenant_id" bigint, "p_user_id" "uuid") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."create_order_status_log"("p_order_id" bigint, "p_tenant_id" bigint) RETURNS "void"
    LANGUAGE "sql"
    AS $$

insert into public.order_status_logs (

    order_id,
    tenant_id,
    status,
    remarks

)

values (

    p_order_id,
    p_tenant_id,
    'pending',
    'Order placed'

);

$$;


ALTER FUNCTION "public"."create_order_status_log"("p_order_id" bigint, "p_tenant_id" bigint) OWNER TO "picomart";


-- removed: public.custom_access_token_hook() - Supabase Auth Hook infrastructure, no equivalent self-hosted, unused


CREATE OR REPLACE FUNCTION "public"."deduct_inventory"("p_tenant_id" bigint, "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$

declare
    v_item record;

begin

    for v_item in

        select
            uc.variant_id,
            uc.quantity

        from public.user_carts uc

        where uc.tenant_id = p_tenant_id
        and uc.user_id = p_user_id

    loop

        update public.product_variants

        set stock_qty = stock_qty - v_item.quantity

        where id = v_item.variant_id;

    end loop;

end;

$$;


ALTER FUNCTION "public"."deduct_inventory"("p_tenant_id" bigint, "p_user_id" "uuid") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "sql"
    AS $$
    select
        'ORD-' ||
        to_char(current_date, 'YYYYMMDD') ||
        '-' ||
        lpad(nextval('public.order_number_seq')::text, 6, '0');
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."has_permission"("p" "public"."app_permission") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      has_role('super_admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp
          ON rp.role = ur.role
        WHERE ur.user_id = auth.uid()
          AND rp.permission = p
      )
    );
$$;


ALTER FUNCTION "public"."has_permission"("p" "public"."app_permission") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."has_role"("r" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = r
    );
$$;


ALTER FUNCTION "public"."has_role"("r" "public"."app_role") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."insert_own_role"("p_role" "public"."app_role") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  INSERT INTO public.user_roles(user_id, role)
  VALUES ((SELECT auth.uid())::uuid, p_role);
$$;


ALTER FUNCTION "public"."insert_own_role"("p_role" "public"."app_role") OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."is_current_user_provider_for"("p_provider_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1 from public.providers p
        where p.id = p_provider_id
          and p.user_id = auth.uid()
    );
$$;


ALTER FUNCTION "public"."is_current_user_provider_for"("p_provider_id" bigint) OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."is_vendor"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'vendor'::public.app_role
  );
$$;


ALTER FUNCTION "public"."is_vendor"() OWNER TO "picomart";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "picomart";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "store_id" bigint,
    "title" character varying(255) NOT NULL,
    "status" "public"."announcement_status" DEFAULT 'draft'::"public"."announcement_status",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcements" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."announcements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."announcements_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."announcements_id_seq" OWNED BY "public"."announcements"."id";



CREATE TABLE IF NOT EXISTS "public"."appointment_status_logs" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "appointment_id" bigint NOT NULL,
    "status" "public"."booking_status" NOT NULL,
    "remarks" character varying(255),
    "changed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appointment_status_logs" OWNER TO "picomart";


ALTER TABLE "public"."appointment_status_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."appointment_status_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "provider_id" bigint NOT NULL,
    "service_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "public"."booking_status" DEFAULT 'pending'::"public"."booking_status" NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "customer_notes" "text",
    "internal_notes" "text",
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "local_date" "date" NOT NULL,
    CONSTRAINT "chk_appointment_time_order" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."appointments" OWNER TO "picomart";


ALTER TABLE "public"."appointments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."appointments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."booking_categories" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" character varying(255),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."booking_categories" OWNER TO "picomart";


ALTER TABLE "public"."booking_categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."booking_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "name" character varying(150) NOT NULL,
    "slug" character varying(150) NOT NULL,
    "description" character varying(255),
    "parent_id" bigint,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categories_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."categories_id_seq" OWNED BY "public"."categories"."id";



CREATE TABLE IF NOT EXISTS "public"."menus" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "menu_type" "public"."menu_type" NOT NULL,
    "parent_id" bigint,
    "title" character varying(150) NOT NULL,
    "href" character varying(255),
    "icon" character varying(100),
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."menus" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."menus_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."menus_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."menus_id_seq" OWNED BY "public"."menus"."id";



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "variant_id" bigint NOT NULL,
    "product_name" character varying(255) NOT NULL,
    "product_image" character varying(255) NOT NULL,
    "variant_name" character varying(100) NOT NULL,
    "attributes_json" "jsonb",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "discount_price" numeric(10,2) NOT NULL,
    "tax_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "tenant_id" bigint NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."order_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_items_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."order_items_id_seq" OWNED BY "public"."order_items"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_number_seq" OWNER TO "picomart";


CREATE TABLE IF NOT EXISTS "public"."order_reviews" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "review" "text",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "product_id" bigint,
    CONSTRAINT "order_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."order_reviews" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."order_reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_reviews_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."order_reviews_id_seq" OWNED BY "public"."order_reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."order_status_logs" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "status" character varying(50) NOT NULL,
    "remarks" character varying(255) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "tenant_id" bigint NOT NULL,
    "changed_by" "uuid"
);


ALTER TABLE "public"."order_status_logs" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."order_status_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_status_logs_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."order_status_logs_id_seq" OWNED BY "public"."order_status_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "store_id" bigint,
    "order_number" character varying(50) NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "discount_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "shipping_fee" numeric(10,2) DEFAULT 0 NOT NULL,
    "payable_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "handling_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "payment_method" "public"."payment_method" DEFAULT 'cod'::"public"."payment_method" NOT NULL,
    "address_id" bigint NOT NULL,
    "delivery_type" "public"."delivery_types" DEFAULT 'delivery'::"public"."delivery_types" NOT NULL,
    "delivery_notes" character varying(255),
    "order_data_json" "jsonb",
    "placed_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "delivered_at" timestamp without time zone,
    "cancelled_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."orders_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."orders_id_seq" OWNED BY "public"."orders"."id";



CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "billing_cycle" "text" DEFAULT 'monthly'::"text",
    "max_products" integer DEFAULT 100,
    "max_customers" integer DEFAULT 1000,
    "max_storage_mb" integer DEFAULT 500,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "plans_billing_cycle_check" CHECK (("billing_cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"])))
);


ALTER TABLE "public"."plans" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."plans_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."plans_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."plans_id_seq" OWNED BY "public"."plans"."id";



CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "image_url" character varying(255) NOT NULL,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "tenant_id" bigint NOT NULL
);


ALTER TABLE "public"."product_images" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."product_images_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_images_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."product_images_id_seq" OWNED BY "public"."product_images"."id";



CREATE OR REPLACE VIEW "public"."product_ratings" WITH ("security_invoker"='true') AS
 SELECT "product_id",
    "round"("avg"("rating"), 1) AS "average_rating",
    "count"(*) AS "review_count"
   FROM "public"."order_reviews"
  GROUP BY "product_id";


ALTER VIEW "public"."product_ratings" OWNER TO "picomart";


CREATE TABLE IF NOT EXISTS "public"."product_tags" (
    "product_id" bigint NOT NULL,
    "tag_id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL
);


ALTER TABLE "public"."product_tags" OWNER TO "picomart";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "variant_name" character varying(100) NOT NULL,
    "sku" character varying(100),
    "price" numeric(10,2) NOT NULL,
    "discount_price" numeric(10,2),
    "stock_qty" integer DEFAULT 0,
    "max_buy_qty" integer,
    "attributes_json" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "tenant_id" bigint NOT NULL
);


ALTER TABLE "public"."product_variants" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."product_variants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_variants_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."product_variants_id_seq" OWNED BY "public"."product_variants"."id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "category_id" bigint,
    "store_id" bigint,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "sku" character varying(100),
    "description" "text",
    "is_active" boolean DEFAULT true,
    "featured" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."products_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."products_id_seq" OWNED BY "public"."products"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'merchant'::"text",
    "tenant_id" bigint,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "picomart";


CREATE TABLE IF NOT EXISTS "public"."provider_availability" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "provider_id" bigint NOT NULL,
    "weekday" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "chk_availability_time_order" CHECK (("end_time" > "start_time")),
    CONSTRAINT "provider_availability_weekday_check" CHECK ((("weekday" >= 0) AND ("weekday" <= 6)))
);


ALTER TABLE "public"."provider_availability" OWNER TO "picomart";


CREATE TABLE IF NOT EXISTS "public"."provider_availability_exceptions" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "provider_id" bigint NOT NULL,
    "exception_date" "date" NOT NULL,
    "is_available" boolean DEFAULT false NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "reason" character varying(255)
);


ALTER TABLE "public"."provider_availability_exceptions" OWNER TO "picomart";


ALTER TABLE "public"."provider_availability_exceptions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."provider_availability_exceptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."provider_availability" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."provider_availability_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."provider_services" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "provider_id" bigint NOT NULL,
    "service_id" bigint NOT NULL,
    "price_override" numeric(10,2),
    "duration_override_minutes" integer,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."provider_services" OWNER TO "picomart";


ALTER TABLE "public"."provider_services" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."provider_services_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."providers" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "user_id" "uuid",
    "name" character varying(150) NOT NULL,
    "title" character varying(150),
    "bio" "text",
    "avatar_url" character varying(255),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" character varying(150) NOT NULL,
    "category" character varying(100) NOT NULL
);


ALTER TABLE "public"."providers" OWNER TO "picomart";


ALTER TABLE "public"."providers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."providers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" bigint NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "permission" "public"."app_permission" NOT NULL
);

ALTER TABLE ONLY "public"."role_permissions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" OWNER TO "picomart";


COMMENT ON TABLE "public"."role_permissions" IS 'Application permissions for each role.';



ALTER TABLE "public"."role_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."role_permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "name" character varying(150) NOT NULL,
    "slug" character varying(150) NOT NULL,
    "description" "text",
    "duration_minutes" integer NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "buffer_minutes" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "services_duration_minutes_check" CHECK (("duration_minutes" > 0))
);


ALTER TABLE "public"."services" OWNER TO "picomart";


ALTER TABLE "public"."services" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."services_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "name" character varying(150) NOT NULL,
    "address_line1" character varying(255) NOT NULL,
    "address_line2" character varying(255),
    "city" character varying(100),
    "state" character varying(100),
    "country" character varying(100) DEFAULT 'India'::character varying,
    "pincode" character varying(10),
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "delivery_mode" "public"."delivery_type" DEFAULT 'radius'::"public"."delivery_type",
    "delivery_radius_km" numeric(5,2),
    "handling_fee" numeric(10,2) DEFAULT 0,
    "min_order_price" integer DEFAULT 100,
    "delivery_fee_value_type" "public"."fee_value_type" DEFAULT 'fixed'::"public"."fee_value_type" NOT NULL,
    "base_distance_km" numeric(10,2) DEFAULT 0 NOT NULL,
    "delivery_fee_base_price" numeric(10,2) DEFAULT 0,
    "delivery_fee_perkm" numeric(10,2) DEFAULT 0 NOT NULL,
    "delivery_fee_fixed" numeric(10,2) DEFAULT 0 NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."stores" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."stores_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."stores_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."stores_id_seq" OWNED BY "public"."stores"."id";



CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tags_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."tags_id_seq" OWNED BY "public"."tags"."id";



CREATE TABLE IF NOT EXISTS "public"."tenant_users" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenant_users" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."tenant_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tenant_users_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."tenant_users_id_seq" OWNED BY "public"."tenant_users"."id";



CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subdomain" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "plan_id" integer NOT NULL,
    "theme_id" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."tenants" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."tenants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tenants_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."tenants_id_seq" OWNED BY "public"."tenants"."id";



CREATE TABLE IF NOT EXISTS "public"."themes" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "theme_json" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."themes" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."themes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."themes_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."themes_id_seq" OWNED BY "public"."themes"."id";



CREATE TABLE IF NOT EXISTS "public"."user_addresses" (
    "id" bigint NOT NULL,
    "tenant_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100),
    "phone" character varying(15),
    "address_line1" character varying(255) NOT NULL,
    "address_line2" character varying(255),
    "city" character varying(100) NOT NULL,
    "state" character varying(100) NOT NULL,
    "pincode" character varying(10) NOT NULL,
    "country" character varying(100) DEFAULT 'India'::character varying,
    "is_default" boolean DEFAULT false,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_addresses" OWNER TO "picomart";


CREATE SEQUENCE IF NOT EXISTS "public"."user_addresses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_addresses_id_seq" OWNER TO "picomart";


ALTER SEQUENCE "public"."user_addresses_id_seq" OWNED BY "public"."user_addresses"."id";



CREATE TABLE IF NOT EXISTS "public"."user_carts" (
    "tenant_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "variant_id" bigint NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "id" bigint NOT NULL,
    CONSTRAINT "chk_user_cart_quantity" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."user_carts" OWNER TO "picomart";


ALTER TABLE "public"."user_carts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_carts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL
);

ALTER TABLE ONLY "public"."user_roles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" OWNER TO "picomart";


COMMENT ON TABLE "public"."user_roles" IS 'Application roles for each user.';



ALTER TABLE "public"."user_roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."announcements" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."announcements_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."menus" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."menus_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_status_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_status_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."orders" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."orders_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."plans" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."plans_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_images" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_images_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_variants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_variants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stores" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."stores_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tenant_users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tenant_users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tenants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tenants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."themes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."themes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_addresses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_addresses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointment_status_logs"
    ADD CONSTRAINT "appointment_status_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_categories"
    ADD CONSTRAINT "booking_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_categories"
    ADD CONSTRAINT "booking_categories_tenant_slug_key" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "menus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "no_overlapping_appointments" EXCLUDE USING "gist" ("provider_id" WITH =, "tstzrange"("start_time", "end_time") WITH &&) WHERE (("status" <> ALL (ARRAY['cancelled'::"public"."booking_status", 'no_show'::"public"."booking_status"])));



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "no_overlapping_appointments_per_user" EXCLUDE USING "gist" ("user_id" WITH =, "tstzrange"("start_time", "end_time") WITH &&) WHERE (("status" <> ALL (ARRAY['cancelled'::"public"."booking_status", 'no_show'::"public"."booking_status"])));



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "no_overlapping_availability_blocks" EXCLUDE USING "gist" ("provider_id" WITH =, "weekday" WITH =, "public"."timerange"("start_time", "end_time") WITH &&) WHERE (("is_active" = true));



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_reviews"
    ADD CONSTRAINT "order_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "order_status_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_pkey" PRIMARY KEY ("product_id", "tag_id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_availability_exceptions"
    ADD CONSTRAINT "provider_availability_exceptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_services"
    ADD CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_permission_key" UNIQUE ("role", "permission");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_tenant_user_unique" UNIQUE ("tenant_id", "user_id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_subdomain_key" UNIQUE ("subdomain");



ALTER TABLE ONLY "public"."themes"
    ADD CONSTRAINT "themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_carts"
    ADD CONSTRAINT "unique_cart" UNIQUE ("tenant_id", "user_id", "variant_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "unique_category_slug_per_tenant" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "unique_order_number_per_tenant" UNIQUE ("tenant_id", "order_number");



ALTER TABLE ONLY "public"."order_reviews"
    ADD CONSTRAINT "unique_order_product_review" UNIQUE ("order_id", "product_id", "user_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "unique_product_slug_per_tenant" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."provider_availability_exceptions"
    ADD CONSTRAINT "unique_provider_exception_date" UNIQUE ("provider_id", "exception_date");



ALTER TABLE ONLY "public"."provider_services"
    ADD CONSTRAINT "unique_provider_service" UNIQUE ("provider_id", "service_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "unique_service_slug_per_tenant" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "unique_tag_slug_per_tenant" UNIQUE ("tenant_id", "slug");



ALTER TABLE ONLY "public"."user_addresses"
    ADD CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_carts"
    ADD CONSTRAINT "user_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



CREATE INDEX "idx_appointment_status_logs_appt_id" ON "public"."appointment_status_logs" USING "btree" ("appointment_id");



CREATE INDEX "idx_appointments_provider_time" ON "public"."appointments" USING "btree" ("provider_id", "start_time");



CREATE INDEX "idx_appointments_tenant_id" ON "public"."appointments" USING "btree" ("tenant_id");



CREATE INDEX "idx_appointments_user_id" ON "public"."appointments" USING "btree" ("user_id");



CREATE INDEX "idx_booking_categories_tenant_id" ON "public"."booking_categories" USING "btree" ("tenant_id");



CREATE INDEX "idx_menus_parent" ON "public"."menus" USING "btree" ("parent_id");



CREATE INDEX "idx_navigation_menus_active_position" ON "public"."menus" USING "btree" ("is_active", "sort_order");



CREATE INDEX "idx_order_items_tenant_id" ON "public"."order_items" USING "btree" ("tenant_id");



CREATE INDEX "idx_order_reviews_product_id" ON "public"."order_reviews" USING "btree" ("product_id");



CREATE INDEX "idx_order_reviews_tenant_product" ON "public"."order_reviews" USING "btree" ("tenant_id", "product_id");



CREATE INDEX "idx_order_status_logs_tenant_id" ON "public"."order_status_logs" USING "btree" ("tenant_id");



CREATE INDEX "idx_product_images_tenant_id" ON "public"."product_images" USING "btree" ("tenant_id");



CREATE INDEX "idx_product_tags_tenant_id" ON "public"."product_tags" USING "btree" ("tenant_id");



CREATE INDEX "idx_product_variants_tenant_id" ON "public"."product_variants" USING "btree" ("tenant_id");



CREATE INDEX "idx_provider_availability_provider_id" ON "public"."provider_availability" USING "btree" ("provider_id", "weekday");



CREATE INDEX "idx_provider_exceptions_provider_id" ON "public"."provider_availability_exceptions" USING "btree" ("provider_id", "exception_date");



CREATE INDEX "idx_provider_services_provider_id" ON "public"."provider_services" USING "btree" ("provider_id");



CREATE INDEX "idx_provider_services_tenant_id" ON "public"."provider_services" USING "btree" ("tenant_id");



CREATE INDEX "idx_providers_tenant_id" ON "public"."providers" USING "btree" ("tenant_id");



CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions" USING "btree" ("role");



CREATE INDEX "idx_services_tenant_id" ON "public"."services" USING "btree" ("tenant_id");



CREATE INDEX "idx_tenant_users_role" ON "public"."tenant_users" USING "btree" ("role");



CREATE INDEX "idx_tenant_users_tenant_id" ON "public"."tenant_users" USING "btree" ("tenant_id");



CREATE INDEX "idx_tenant_users_user_id" ON "public"."tenant_users" USING "btree" ("user_id");



CREATE INDEX "idx_user_carts_tenant_user" ON "public"."user_carts" USING "btree" ("tenant_id", "user_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "one_appointment_per_provider_per_day" ON "public"."appointments" USING "btree" ("provider_id", "user_id", "local_date") WHERE ("status" <> ALL (ARRAY['cancelled'::"public"."booking_status", 'no_show'::"public"."booking_status"]));



CREATE UNIQUE INDEX "providers_tenant_slug_key" ON "public"."providers" USING "btree" ("tenant_id", "slug");



CREATE OR REPLACE TRIGGER "trg_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_booking_categories_updated_at" BEFORE UPDATE ON "public"."booking_categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_providers_updated_at" BEFORE UPDATE ON "public"."providers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_carts_updated_at" BEFORE UPDATE ON "public"."user_carts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."appointment_status_logs"
    ADD CONSTRAINT "appointment_status_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_status_logs"
    ADD CONSTRAINT "appointment_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointment_status_logs"
    ADD CONSTRAINT "appointment_status_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_categories"
    ADD CONSTRAINT "booking_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "fk_announcement_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "fk_announcement_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "fk_category_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "fk_category_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "fk_menu_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."menus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "fk_menu_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "fk_order_address" FOREIGN KEY ("address_id") REFERENCES "public"."user_addresses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "fk_order_item_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "fk_order_item_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "fk_order_item_variant" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "fk_order_status_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "fk_order_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "fk_order_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "fk_order_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "fk_product_category" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "fk_product_image" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "fk_product_store" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "fk_product_tag_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "fk_product_tag_tag" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "fk_product_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_reviews"
    ADD CONSTRAINT "fk_review_order" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_reviews"
    ADD CONSTRAINT "fk_review_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_reviews"
    ADD CONSTRAINT "fk_review_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_reviews"
    ADD CONSTRAINT "fk_review_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "fk_store_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "fk_tag_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_addresses"
    ADD CONSTRAINT "fk_user_address_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_carts"
    ADD CONSTRAINT "fk_user_cart_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_carts"
    ADD CONSTRAINT "fk_user_cart_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_carts"
    ADD CONSTRAINT "fk_user_cart_variant" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "fk_variant_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "order_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."provider_availability_exceptions"
    ADD CONSTRAINT "provider_availability_exceptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_availability_exceptions"
    ADD CONSTRAINT "provider_availability_exceptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "provider_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "provider_availability_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_services"
    ADD CONSTRAINT "provider_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_services"
    ADD CONSTRAINT "provider_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_services"
    ADD CONSTRAINT "provider_services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_users"
    ADD CONSTRAINT "tenant_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read access to active stores" ON "public"."stores" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read active tenants" ON "public"."tenants" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow tenant owners full access to their stores" ON "public"."stores" TO "app_user" USING (("tenant_id" IN ( SELECT "tenants"."id"
   FROM "public"."tenants"
  WHERE ("tenants"."user_id" = "auth"."uid"())))) WITH CHECK (("tenant_id" IN ( SELECT "tenants"."id"
   FROM "public"."tenants"
  WHERE ("tenants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."user_carts" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."product_images" FOR INSERT TO "app_user" WITH CHECK ((("tenant_id" = ( SELECT "t"."id"
   FROM "public"."tenants" "t"
  WHERE ("t"."user_id" = "auth"."uid"()))) AND (("auth"."jwt"() ->> 'user_role'::"text") = 'vendor'::"text")));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."products" FOR INSERT TO "app_user" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."tenants" "t"
  WHERE (("t"."id" = "products"."tenant_id") AND ("t"."user_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role"))))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."user_carts" FOR INSERT TO "app_user" WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."user_carts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."user_roles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."menus" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."order_reviews" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."product_images" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."product_variants" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."user_carts" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."user_roles" FOR SELECT USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."stores" FOR SELECT TO "app_user" USING (("tenant_id" IN ( SELECT "t"."id"
   FROM "public"."tenants" "t"
  WHERE ("t"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable users to view their own data only" ON "public"."user_carts" FOR SELECT TO "app_user" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Tenant owner select access" ON "public"."tenants" FOR SELECT TO "app_user" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Tenant owners can add members" ON "public"."tenant_users" FOR INSERT TO "app_user" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tenants" "t"
  WHERE (("t"."id" = "tenant_users"."tenant_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Tenant owners can delete members" ON "public"."tenant_users" FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."tenants" "t"
  WHERE (("t"."id" = "tenant_users"."tenant_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Tenant owners can update members" ON "public"."tenant_users" FOR UPDATE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."tenants" "t"
  WHERE (("t"."id" = "tenant_users"."tenant_id") AND ("t"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tenants" "t"
  WHERE (("t"."id" = "tenant_users"."tenant_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Tenant staff can insert order logs" ON "public"."order_status_logs" FOR INSERT TO "app_user" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tenant_users" "tu"
  WHERE (("tu"."tenant_id" = "order_status_logs"."tenant_id") AND ("tu"."user_id" = "auth"."uid"()) AND ("tu"."is_active" = true) AND ("tu"."role" = ANY (ARRAY['admin'::"public"."app_role", 'vendor'::"public"."app_role", 'super_admin'::"public"."app_role"]))))));



CREATE POLICY "Tenant staff can update orders" ON "public"."orders" FOR UPDATE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_users" "tu"
  WHERE (("tu"."tenant_id" = "orders"."tenant_id") AND ("tu"."user_id" = "auth"."uid"()) AND ("tu"."is_active" = true) AND ("tu"."role" = ANY (ARRAY['admin'::"public"."app_role", 'vendor'::"public"."app_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tenant_users" "tu"
  WHERE (("tu"."tenant_id" = "orders"."tenant_id") AND ("tu"."user_id" = "auth"."uid"()) AND ("tu"."is_active" = true) AND ("tu"."role" = ANY (ARRAY['admin'::"public"."app_role", 'vendor'::"public"."app_role"]))))));



CREATE POLICY "Tenant staff can view customer details" ON "public"."user_addresses" FOR SELECT TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_users" "tu"
  WHERE (("tu"."tenant_id" = "user_addresses"."tenant_id") AND ("tu"."user_id" = "auth"."uid"()) AND ("tu"."is_active" = true) AND ("tu"."role" = ANY (ARRAY['admin'::"public"."app_role", 'vendor'::"public"."app_role"]))))));



CREATE POLICY "Tenant staff can view order details" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_users" "tu"
  WHERE (("tu"."tenant_id" = "order_items"."tenant_id") AND ("tu"."user_id" = "auth"."uid"()) AND ("tu"."is_active" = true) AND ("tu"."role" = ANY (ARRAY['admin'::"public"."app_role", 'vendor'::"public"."app_role"]))))));



CREATE POLICY "Tenant staff can view order status" ON "public"."order_status_logs" FOR SELECT TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_users" "tu"
  WHERE (("tu"."tenant_id" = "order_status_logs"."tenant_id") AND ("tu"."user_id" = "auth"."uid"()) AND ("tu"."is_active" = true) AND ("tu"."role" = ANY (ARRAY['admin'::"public"."app_role", 'vendor'::"public"."app_role"]))))));



CREATE POLICY "Tenant staff can view orders" ON "public"."orders" FOR SELECT TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_users" "tu"
  WHERE (("tu"."tenant_id" = "orders"."tenant_id") AND ("tu"."user_id" = "auth"."uid"()) AND ("tu"."is_active" = true) AND ("tu"."role" = ANY (ARRAY['admin'::"public"."app_role", 'vendor'::"public"."app_role"]))))));



CREATE POLICY "Users can create their own addresses" ON "public"."user_addresses" FOR INSERT TO "app_user" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own orders" ON "public"."orders" FOR INSERT TO "app_user" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own reviews" ON "public"."order_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own addresses" ON "public"."user_addresses" FOR DELETE TO "app_user" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own addresses" ON "public"."user_addresses" FOR UPDATE TO "app_user" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own reviews" ON "public"."order_reviews" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their memberships" ON "public"."tenant_users" FOR SELECT TO "app_user" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their order status logs" ON "public"."order_status_logs" FOR SELECT TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_status_logs"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own addresses" ON "public"."user_addresses" FOR SELECT TO "app_user" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own order items" ON "public"."order_items" FOR SELECT TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT TO "app_user" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own reviews" ON "public"."order_reviews" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tenant orders" ON "public"."orders" FOR SELECT TO "app_user" USING ((("user_id" = "auth"."uid"()) AND ("tenant_id" = ("current_setting"('request.tenant_id'::"text", true))::bigint)));



CREATE POLICY "admin view role permissions" ON "public"."role_permissions" FOR SELECT USING ("public"."has_role"('admin'::"public"."app_role"));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "announcements_admin_delete" ON "public"."announcements" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "announcements_admin_insert" ON "public"."announcements" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "announcements_admin_select" ON "public"."announcements" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "announcements_admin_update" ON "public"."announcements" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "announcements_delete_tenant" ON "public"."announcements" FOR DELETE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "announcements_insert_tenant" ON "public"."announcements" FOR INSERT WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "announcements_select_tenant" ON "public"."announcements" FOR SELECT USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "announcements_update_tenant" ON "public"."announcements" FOR UPDATE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint)) WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



ALTER TABLE "public"."appointment_status_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointment_status_logs_insert_staff" ON "public"."appointment_status_logs" FOR INSERT TO "app_user" WITH CHECK (("public"."has_permission"('booking.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM "public"."appointments" "a"
  WHERE (("a"."id" = "appointment_status_logs"."appointment_id") AND ("a"."tenant_id" = "appointment_status_logs"."tenant_id"))))));



CREATE POLICY "appointment_status_logs_select" ON "public"."appointment_status_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appointments" "a"
  WHERE (("a"."id" = "appointment_status_logs"."appointment_id") AND (("a"."user_id" = "auth"."uid"()) OR "public"."has_permission"('booking.view_all'::"public"."app_permission"))))));



CREATE POLICY "appointment_status_logs_select_provider" ON "public"."appointment_status_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appointments" "a"
  WHERE (("a"."id" = "appointment_status_logs"."appointment_id") AND "public"."is_current_user_provider_for"("a"."provider_id")))));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointments_insert_staff" ON "public"."appointments" FOR INSERT WITH CHECK ("public"."has_permission"('booking.create'::"public"."app_permission"));



CREATE POLICY "appointments_select_own" ON "public"."appointments" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."has_permission"('booking.view_all'::"public"."app_permission")));



CREATE POLICY "appointments_select_provider" ON "public"."appointments" FOR SELECT USING ("public"."is_current_user_provider_for"("provider_id"));



CREATE POLICY "appointments_update_own" ON "public"."appointments" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."has_permission"('booking.manage'::"public"."app_permission"))) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."has_permission"('booking.manage'::"public"."app_permission")));



CREATE POLICY "appointments_update_provider" ON "public"."appointments" FOR UPDATE USING ("public"."is_current_user_provider_for"("provider_id")) WITH CHECK ("public"."is_current_user_provider_for"("provider_id"));



ALTER TABLE "public"."booking_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "booking_categories_manage" ON "public"."booking_categories" USING ("public"."has_permission"('booking.manage'::"public"."app_permission")) WITH CHECK ("public"."has_permission"('booking.manage'::"public"."app_permission"));



CREATE POLICY "booking_categories_public_select" ON "public"."booking_categories" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert own customer role" ON "public"."user_roles" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("role" = 'customer'::"public"."app_role")));



ALTER TABLE "public"."menus" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "menus_admin_delete" ON "public"."menus" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "menus_admin_insert" ON "public"."menus" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "menus_admin_select" ON "public"."menus" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "menus_admin_update" ON "public"."menus" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "menus_delete_tenant" ON "public"."menus" FOR DELETE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "menus_insert_tenant" ON "public"."menus" FOR INSERT WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "menus_update_tenant" ON "public"."menus" FOR UPDATE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint)) WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_status_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_status_logs_admin_insert" ON "public"."order_status_logs" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "order_status_logs_admin_select" ON "public"."order_status_logs" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "order_status_logs_admin_update" ON "public"."order_status_logs" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "order_status_logs_delete_user" ON "public"."order_status_logs" FOR DELETE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "order_status_logs_insert_user" ON "public"."order_status_logs" FOR INSERT WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "order_status_logs_update_user" ON "public"."order_status_logs" FOR UPDATE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint)) WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plans_admin_delete" ON "public"."plans" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "plans_admin_insert" ON "public"."plans" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "plans_admin_select" ON "public"."plans" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "plans_admin_update" ON "public"."plans" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "plans_public_select" ON "public"."plans" FOR SELECT USING (true);



ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_tags_admin_delete" ON "public"."product_tags" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "product_tags_admin_insert" ON "public"."product_tags" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "product_tags_admin_select" ON "public"."product_tags" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "product_tags_admin_update" ON "public"."product_tags" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "product_tags_delete_tenant" ON "public"."product_tags" FOR DELETE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "product_tags_insert_tenant" ON "public"."product_tags" FOR INSERT WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "product_tags_select_tenant" ON "public"."product_tags" FOR SELECT USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "product_tags_update_tenant" ON "public"."product_tags" FOR UPDATE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint)) WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_booking_manage_select" ON "public"."profiles" FOR SELECT TO "app_user" USING (("public"."has_role"('super_admin'::"public"."app_role") OR "public"."has_role"('admin'::"public"."app_role") OR "public"."has_role"('vendor'::"public"."app_role")));



ALTER TABLE "public"."provider_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_availability_exceptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_availability_manage" ON "public"."provider_availability" USING ("public"."has_permission"('booking.manage'::"public"."app_permission")) WITH CHECK ("public"."has_permission"('booking.manage'::"public"."app_permission"));



CREATE POLICY "provider_availability_public_select" ON "public"."provider_availability" FOR SELECT USING (("is_active" = true));



CREATE POLICY "provider_exceptions_manage" ON "public"."provider_availability_exceptions" USING ("public"."has_permission"('booking.manage'::"public"."app_permission")) WITH CHECK ("public"."has_permission"('booking.manage'::"public"."app_permission"));



ALTER TABLE "public"."provider_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_services_manage" ON "public"."provider_services" USING ("public"."has_permission"('booking.manage'::"public"."app_permission")) WITH CHECK ("public"."has_permission"('booking.manage'::"public"."app_permission"));



CREATE POLICY "provider_services_public_select" ON "public"."provider_services" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "providers_manage" ON "public"."providers" USING ("public"."has_permission"('booking.manage'::"public"."app_permission")) WITH CHECK ("public"."has_permission"('booking.manage'::"public"."app_permission"));



CREATE POLICY "providers_public_select" ON "public"."providers" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public can view categories" ON "public"."categories" FOR SELECT TO "app_user" USING (true);



ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "services_manage" ON "public"."services" USING ("public"."has_permission"('booking.manage'::"public"."app_permission")) WITH CHECK ("public"."has_permission"('booking.manage'::"public"."app_permission"));



CREATE POLICY "services_public_select" ON "public"."services" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stores_admin_delete" ON "public"."stores" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "stores_admin_insert" ON "public"."stores" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "stores_admin_select" ON "public"."stores" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "stores_admin_update" ON "public"."stores" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "stores_delete_tenant" ON "public"."stores" FOR DELETE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "stores_insert_tenant" ON "public"."stores" FOR INSERT WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "stores_select_tenant" ON "public"."stores" FOR SELECT USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "stores_update_tenant" ON "public"."stores" FOR UPDATE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint)) WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "super admin full access role_permissions" ON "public"."role_permissions" USING ("public"."has_role"('super_admin'::"public"."app_role")) WITH CHECK ("public"."has_role"('super_admin'::"public"."app_role"));



CREATE POLICY "super admin full access user_roles" ON "public"."user_roles" USING ("public"."has_role"('super_admin'::"public"."app_role")) WITH CHECK ("public"."has_role"('super_admin'::"public"."app_role"));



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_admin_delete" ON "public"."tags" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "tags_admin_insert" ON "public"."tags" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "tags_admin_select" ON "public"."tags" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "tags_admin_update" ON "public"."tags" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "tags_delete_tenant" ON "public"."tags" FOR DELETE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "tags_insert_tenant" ON "public"."tags" FOR INSERT WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "tags_select_tenant" ON "public"."tags" FOR SELECT USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



CREATE POLICY "tags_update_tenant" ON "public"."tags" FOR UPDATE USING (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint)) WITH CHECK (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::bigint));



ALTER TABLE "public"."tenant_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."themes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "themes_admin_delete" ON "public"."themes" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "themes_admin_insert" ON "public"."themes" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "themes_admin_select" ON "public"."themes" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "themes_admin_update" ON "public"."themes" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "themes_public_select" ON "public"."themes" FOR SELECT USING (true);



ALTER TABLE "public"."user_addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_carts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_carts_update_own" ON "public"."user_carts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendor can do all on categories" ON "public"."categories" TO "app_user" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can delete own product images" ON "public"."product_images" FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_images"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can delete own product tags" ON "public"."product_tags" FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_tags"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can delete own product variants" ON "public"."product_variants" FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_variants"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can delete own tenant products" ON "public"."products" FOR DELETE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM ("public"."tenants" "t"
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("t"."id" = "products"."tenant_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can insert own product images" ON "public"."product_images" FOR INSERT TO "app_user" WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_images"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can insert own product tags" ON "public"."product_tags" FOR INSERT TO "app_user" WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_tags"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can insert own product variants" ON "public"."product_variants" FOR INSERT TO "app_user" WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_variants"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can update own product images" ON "public"."product_images" FOR UPDATE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_images"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_images"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can update own product tags" ON "public"."product_tags" FOR UPDATE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_tags"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_tags"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can update own product variants" ON "public"."product_variants" FOR UPDATE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_variants"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."products" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "p"."tenant_id")))
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("p"."id" = "product_variants"."product_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can update own tenant products" ON "public"."products" FOR UPDATE TO "app_user" USING ((EXISTS ( SELECT 1
   FROM ("public"."tenants" "t"
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("t"."id" = "products"."tenant_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."tenants" "t"
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("t"."id" = "products"."tenant_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));



CREATE POLICY "vendors can view own tenant products" ON "public"."products" FOR SELECT TO "app_user" USING ((EXISTS ( SELECT 1
   FROM ("public"."tenants" "t"
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
  WHERE (("t"."id" = "products"."tenant_id") AND ("t"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'vendor'::"public"."app_role")))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "picomart";


GRANT USAGE ON SCHEMA "public" TO "app_user";
GRANT USAGE ON SCHEMA "public" TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey16_in"("cstring") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey16_out"("public"."gbtreekey16") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey2_in"("cstring") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey2_out"("public"."gbtreekey2") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey32_in"("cstring") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey32_out"("public"."gbtreekey32") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey4_in"("cstring") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey4_out"("public"."gbtreekey4") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey8_in"("cstring") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey8_out"("public"."gbtreekey8") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_in"("cstring") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbtreekey_var_out"("public"."gbtreekey_var") TO "app_user";

























































































































































GRANT ALL ON FUNCTION "public"."add_to_cart"("p_tenant_id" bigint, "p_user_id" "uuid", "p_variant_id" bigint, "p_quantity" integer) TO "app_user";
GRANT ALL ON FUNCTION "public"."add_to_cart"("p_tenant_id" bigint, "p_user_id" "uuid", "p_variant_id" bigint, "p_quantity" integer) TO "app_user";



GRANT ALL ON FUNCTION "public"."assign_default_role"() TO "app_user";
GRANT ALL ON FUNCTION "public"."assign_default_role"() TO "app_user";






GRANT ALL ON FUNCTION "public"."book_appointment"("p_tenant_id" bigint, "p_provider_id" bigint, "p_service_id" bigint, "p_start_time" timestamp with time zone, "p_customer_notes" "text") TO "app_user";
GRANT ALL ON FUNCTION "public"."book_appointment"("p_tenant_id" bigint, "p_provider_id" bigint, "p_service_id" bigint, "p_start_time" timestamp with time zone, "p_customer_notes" "text") TO "app_user";



GRANT ALL ON FUNCTION "public"."cancel_appointment"("p_appointment_id" bigint, "p_reason" "text") TO "app_user";
GRANT ALL ON FUNCTION "public"."cancel_appointment"("p_appointment_id" bigint, "p_reason" "text") TO "app_user";



GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "app_user";
GRANT ALL ON FUNCTION "public"."cash_dist"("money", "money") TO "app_user";



GRANT ALL ON FUNCTION "public"."checkout"("p_tenant_id" bigint, "p_address_id" bigint, "p_payment_method" "public"."payment_method", "p_delivery_notes" "text") TO "app_user";
GRANT ALL ON FUNCTION "public"."checkout"("p_tenant_id" bigint, "p_address_id" bigint, "p_payment_method" "public"."payment_method", "p_delivery_notes" "text") TO "app_user";



GRANT ALL ON FUNCTION "public"."checkout_validate_cart"("p_tenant_id" bigint, "p_address_id" bigint) TO "app_user";
GRANT ALL ON FUNCTION "public"."checkout_validate_cart"("p_tenant_id" bigint, "p_address_id" bigint) TO "app_user";



GRANT ALL ON FUNCTION "public"."clear_user_cart"("p_tenant_id" bigint, "p_user_id" "uuid") TO "app_user";
GRANT ALL ON FUNCTION "public"."clear_user_cart"("p_tenant_id" bigint, "p_user_id" "uuid") TO "app_user";



GRANT ALL ON FUNCTION "public"."create_order_items"("p_order_id" bigint, "p_tenant_id" bigint, "p_user_id" "uuid") TO "app_user";
GRANT ALL ON FUNCTION "public"."create_order_items"("p_order_id" bigint, "p_tenant_id" bigint, "p_user_id" "uuid") TO "app_user";



GRANT ALL ON FUNCTION "public"."create_order_status_log"("p_order_id" bigint, "p_tenant_id" bigint) TO "app_user";
GRANT ALL ON FUNCTION "public"."create_order_status_log"("p_order_id" bigint, "p_tenant_id" bigint) TO "app_user";






GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "app_user";
GRANT ALL ON FUNCTION "public"."date_dist"("date", "date") TO "app_user";



GRANT ALL ON FUNCTION "public"."deduct_inventory"("p_tenant_id" bigint, "p_user_id" "uuid") TO "app_user";
GRANT ALL ON FUNCTION "public"."deduct_inventory"("p_tenant_id" bigint, "p_user_id" "uuid") TO "app_user";



GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "app_user";
GRANT ALL ON FUNCTION "public"."float4_dist"(real, real) TO "app_user";



GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "app_user";
GRANT ALL ON FUNCTION "public"."float8_dist"(double precision, double precision) TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bit_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bit_consistent"("internal", bit, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bit_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bit_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bit_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bit_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bool_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bool_consistent"("internal", boolean, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bool_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bool_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bool_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bool_same"("public"."gbtreekey2", "public"."gbtreekey2", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bool_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bpchar_consistent"("internal", character, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bytea_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bytea_consistent"("internal", "bytea", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bytea_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bytea_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bytea_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_bytea_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_consistent"("internal", "money", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_distance"("internal", "money", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_cash_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_consistent"("internal", "date", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_distance"("internal", "date", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_date_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_decompress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_enum_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_enum_consistent"("internal", "anyenum", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_enum_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_enum_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_enum_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_enum_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_enum_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_consistent"("internal", real, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_distance"("internal", real, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float4_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_consistent"("internal", double precision, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_distance"("internal", double precision, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_float8_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_inet_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_inet_consistent"("internal", "inet", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_inet_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_inet_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_inet_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_inet_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_consistent"("internal", smallint, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_distance"("internal", smallint, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_same"("public"."gbtreekey4", "public"."gbtreekey4", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int2_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_consistent"("internal", integer, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_distance"("internal", integer, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int4_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_consistent"("internal", bigint, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_distance"("internal", bigint, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_int8_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_consistent"("internal", interval, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_decompress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_distance"("internal", interval, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_intv_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad8_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad8_consistent"("internal", "macaddr8", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad8_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad8_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad8_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad8_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad8_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad_consistent"("internal", "macaddr", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_macad_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_numeric_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_numeric_consistent"("internal", numeric, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_numeric_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_numeric_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_numeric_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_numeric_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_consistent"("internal", "oid", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_distance"("internal", "oid", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_same"("public"."gbtreekey8", "public"."gbtreekey8", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_oid_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_text_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_text_consistent"("internal", "text", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_text_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_text_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_text_same"("public"."gbtreekey_var", "public"."gbtreekey_var", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_text_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_consistent"("internal", time without time zone, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_distance"("internal", time without time zone, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_time_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_timetz_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_timetz_consistent"("internal", time with time zone, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_consistent"("internal", timestamp without time zone, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_distance"("internal", timestamp without time zone, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_same"("public"."gbtreekey16", "public"."gbtreekey16", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_ts_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_tstz_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_tstz_consistent"("internal", timestamp with time zone, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_tstz_distance"("internal", timestamp with time zone, smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_uuid_compress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_uuid_consistent"("internal", "uuid", smallint, "oid", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_uuid_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_uuid_penalty"("internal", "internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_uuid_picksplit"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_uuid_same"("public"."gbtreekey32", "public"."gbtreekey32", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_uuid_union"("internal", "internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_var_decompress"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "app_user";
GRANT ALL ON FUNCTION "public"."gbt_var_fetch"("internal") TO "app_user";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "app_user";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "app_user";



GRANT ALL ON FUNCTION "public"."has_permission"("p" "public"."app_permission") TO "app_user";
GRANT ALL ON FUNCTION "public"."has_permission"("p" "public"."app_permission") TO "app_user";



GRANT ALL ON FUNCTION "public"."has_role"("r" "public"."app_role") TO "app_user";
GRANT ALL ON FUNCTION "public"."has_role"("r" "public"."app_role") TO "app_user";



GRANT ALL ON FUNCTION "public"."insert_own_role"("p_role" "public"."app_role") TO "app_user";



GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "app_user";
GRANT ALL ON FUNCTION "public"."int2_dist"(smallint, smallint) TO "app_user";



GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "app_user";
GRANT ALL ON FUNCTION "public"."int4_dist"(integer, integer) TO "app_user";



GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "app_user";
GRANT ALL ON FUNCTION "public"."int8_dist"(bigint, bigint) TO "app_user";



GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "app_user";
GRANT ALL ON FUNCTION "public"."interval_dist"(interval, interval) TO "app_user";



GRANT ALL ON FUNCTION "public"."is_current_user_provider_for"("p_provider_id" bigint) TO "app_user";
GRANT ALL ON FUNCTION "public"."is_current_user_provider_for"("p_provider_id" bigint) TO "app_user";



GRANT ALL ON FUNCTION "public"."is_vendor"() TO "app_user";
GRANT ALL ON FUNCTION "public"."is_vendor"() TO "app_user";



GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "app_user";
GRANT ALL ON FUNCTION "public"."oid_dist"("oid", "oid") TO "app_user";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "app_user";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "app_user";



GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "app_user";
GRANT ALL ON FUNCTION "public"."time_dist"(time without time zone, time without time zone) TO "app_user";



GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "app_user";
GRANT ALL ON FUNCTION "public"."ts_dist"(timestamp without time zone, timestamp without time zone) TO "app_user";



GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "app_user";
GRANT ALL ON FUNCTION "public"."tstz_dist"(timestamp with time zone, timestamp with time zone) TO "app_user";


















GRANT ALL ON TABLE "public"."announcements" TO "app_user";
GRANT ALL ON TABLE "public"."announcements" TO "app_user";



GRANT ALL ON SEQUENCE "public"."announcements_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."announcements_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."appointment_status_logs" TO "app_user";
GRANT ALL ON TABLE "public"."appointment_status_logs" TO "app_user";



GRANT ALL ON SEQUENCE "public"."appointment_status_logs_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."appointment_status_logs_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."appointments" TO "app_user";
GRANT ALL ON TABLE "public"."appointments" TO "app_user";



GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."appointments_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."booking_categories" TO "app_user";
GRANT ALL ON TABLE "public"."booking_categories" TO "app_user";



GRANT ALL ON SEQUENCE "public"."booking_categories_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."booking_categories_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."categories" TO "app_user";
GRANT ALL ON TABLE "public"."categories" TO "app_user";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."menus" TO "app_user";
GRANT ALL ON TABLE "public"."menus" TO "app_user";



GRANT ALL ON SEQUENCE "public"."menus_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."menus_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."order_items" TO "app_user";
GRANT ALL ON TABLE "public"."order_items" TO "app_user";



GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "app_user";



GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "app_user";



GRANT ALL ON TABLE "public"."order_reviews" TO "app_user";
GRANT ALL ON TABLE "public"."order_reviews" TO "app_user";



GRANT ALL ON SEQUENCE "public"."order_reviews_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."order_reviews_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."order_status_logs" TO "app_user";
GRANT ALL ON TABLE "public"."order_status_logs" TO "app_user";



GRANT ALL ON SEQUENCE "public"."order_status_logs_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."order_status_logs_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."orders" TO "app_user";
GRANT ALL ON TABLE "public"."orders" TO "app_user";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."plans" TO "app_user";
GRANT ALL ON TABLE "public"."plans" TO "app_user";



GRANT ALL ON SEQUENCE "public"."plans_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."plans_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."product_images" TO "app_user";
GRANT ALL ON TABLE "public"."product_images" TO "app_user";



GRANT ALL ON SEQUENCE "public"."product_images_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."product_images_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."product_ratings" TO "app_user";
GRANT ALL ON TABLE "public"."product_ratings" TO "app_user";



GRANT ALL ON TABLE "public"."product_tags" TO "app_user";
GRANT ALL ON TABLE "public"."product_tags" TO "app_user";



GRANT ALL ON TABLE "public"."product_variants" TO "app_user";
GRANT ALL ON TABLE "public"."product_variants" TO "app_user";



GRANT ALL ON SEQUENCE "public"."product_variants_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."product_variants_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."products" TO "app_user";
GRANT ALL ON TABLE "public"."products" TO "app_user";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."profiles" TO "app_user";
GRANT ALL ON TABLE "public"."profiles" TO "app_user";



GRANT ALL ON TABLE "public"."provider_availability" TO "app_user";
GRANT ALL ON TABLE "public"."provider_availability" TO "app_user";



GRANT ALL ON TABLE "public"."provider_availability_exceptions" TO "app_user";
GRANT ALL ON TABLE "public"."provider_availability_exceptions" TO "app_user";



GRANT ALL ON SEQUENCE "public"."provider_availability_exceptions_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."provider_availability_exceptions_id_seq" TO "app_user";



GRANT ALL ON SEQUENCE "public"."provider_availability_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."provider_availability_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."provider_services" TO "app_user";
GRANT ALL ON TABLE "public"."provider_services" TO "app_user";



GRANT ALL ON SEQUENCE "public"."provider_services_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."provider_services_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."providers" TO "app_user";
GRANT ALL ON TABLE "public"."providers" TO "app_user";



GRANT ALL ON SEQUENCE "public"."providers_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."providers_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."role_permissions" TO "app_user";
GRANT ALL ON TABLE "public"."role_permissions" TO "app_user";



GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."role_permissions_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."services" TO "app_user";
GRANT ALL ON TABLE "public"."services" TO "app_user";



GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."stores" TO "app_user";
GRANT ALL ON TABLE "public"."stores" TO "app_user";



GRANT ALL ON SEQUENCE "public"."stores_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."stores_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."tags" TO "app_user";
GRANT ALL ON TABLE "public"."tags" TO "app_user";



GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."tenant_users" TO "app_user";
GRANT ALL ON TABLE "public"."tenant_users" TO "app_user";



GRANT ALL ON SEQUENCE "public"."tenant_users_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."tenant_users_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."tenants" TO "app_user";
GRANT ALL ON TABLE "public"."tenants" TO "app_user";



GRANT ALL ON SEQUENCE "public"."tenants_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."tenants_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."themes" TO "app_user";
GRANT ALL ON TABLE "public"."themes" TO "app_user";



GRANT ALL ON SEQUENCE "public"."themes_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."themes_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."user_addresses" TO "app_user";
GRANT ALL ON TABLE "public"."user_addresses" TO "app_user";



GRANT ALL ON SEQUENCE "public"."user_addresses_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."user_addresses_id_seq" TO "app_user";



GRANT ALL ON TABLE "public"."user_carts" TO "app_user";
GRANT ALL ON TABLE "public"."user_carts" TO "app_user";



GRANT ALL ON SEQUENCE "public"."user_carts_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."user_carts_id_seq" TO "app_user";



GRANT SELECT,INSERT ON TABLE "public"."user_roles" TO "app_user";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "app_user";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "app_user";









ALTER DEFAULT PRIVILEGES FOR ROLE "picomart" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "app_user";
ALTER DEFAULT PRIVILEGES FOR ROLE "picomart" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "app_user";






ALTER DEFAULT PRIVILEGES FOR ROLE "picomart" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "app_user";
ALTER DEFAULT PRIVILEGES FOR ROLE "picomart" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "app_user";






ALTER DEFAULT PRIVILEGES FOR ROLE "picomart" IN SCHEMA "public" GRANT ALL ON TABLES TO "app_user";
ALTER DEFAULT PRIVILEGES FOR ROLE "picomart" IN SCHEMA "public" GRANT ALL ON TABLES TO "app_user";































