import { pgTable, uuid, text, timestamp, uniqueIndex, index, foreignKey, pgPolicy, bigserial, bigint, varchar, numeric, integer, boolean, check, smallint, time, date, serial, jsonb, pgView, pgSequence, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const announcementStatus = pgEnum("announcement_status", ['draft', 'published'])
export const appPermission = pgEnum("app_permission", ['dashboard.view', 'user.view', 'user.block', 'user.verify', 'seller.view', 'seller.approve', 'seller.block', 'category.view', 'category.create', 'category.update', 'category.delete', 'product.view', 'product.create', 'product.update', 'product.delete', 'product.approve', 'product.view_own', 'product.update_own', 'product.delete_own', 'inventory.view', 'inventory.update', 'cart.add', 'cart.update', 'cart.remove', 'order.view_all', 'order.update_status', 'order.cancel', 'order.refund', 'order.view_own', 'order.update_status_own', 'order.create', 'order.cancel_own', 'payment.create', 'payment.view', 'payment.view_own', 'profile.view', 'profile.update', 'address.manage', 'report.sales', 'report.orders', 'report.users', 'payout.view', 'booking.view_all', 'booking.manage', 'booking.view_own', 'booking.cancel_own', 'booking.create', 'user.manage'])
export const appRole = pgEnum("app_role", ['super_admin', 'admin', 'vendor', 'customer'])
export const bookingStatus = pgEnum("booking_status", ['pending', 'confirmed', 'cancelled', 'completed'])
export const deliveryType = pgEnum("delivery_type", ['radius', 'pincode'])
export const deliveryTypes = pgEnum("delivery_types", ['pickup', 'delivery'])
export const feeValueType = pgEnum("fee_value_type", ['fixed', 'per_km'])
export const menuType = pgEnum("menu_type", ['header', 'footer_1', 'footer_2', 'footer_3', 'footer_4'])
export const orderStatus = pgEnum("order_status", ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'failed', 'out_for_delivery'])
export const paymentMethod = pgEnum("payment_method", ['cod', 'upi', 'card', 'wallet', 'netbanking'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'refunded', 'failed'])

export const orderNumberSeq = pgSequence("order_number_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
    fullname: text("fullname").notNull(),
    email: text("email").notNull(),
    mobile: text("mobile").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("users_tenant_email_mobile_unique_idx").on(
		t.tenantId,
		t.email,
		t.mobile
	),

    // RLS Policies
    pgPolicy("Allow public user registration for tenant", {
      for: "insert",
      withCheck: sql`${t.tenantId} = nullif(current_setting('request.tenant_id', true), '')::bigint`,
    }),

    pgPolicy("Allow user to read own profile", {
      for: "select",
      using: sql`${t.id} = nullif(current_setting('app.current_user_id', true), '')::uuid`,
    }),
  ]
).enableRLS();

export const refreshTokens = pgTable("refresh_tokens", {
	id: uuid().defaultRandom().notNull(),
	userId: uuid("user_id").notNull(),
	tenantId: bigint("tenant_id", { mode: "number" })
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("refresh_tokens_token_hash_idx").using("btree", table.tokenHash.asc().nullsLast()),
	index("refresh_tokens_user_id_idx").using("btree", table.userId.asc().nullsLast()),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "refresh_tokens_user_id_fkey"
		}).onDelete("cascade"),
]);

export const stores = pgTable("stores", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	name: varchar({ length: 150 }).notNull(),
	addressLine1: varchar("address_line1", { length: 255 }).notNull(),
	addressLine2: varchar("address_line2", { length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	country: varchar({ length: 100 }).default('India'),
	pincode: varchar({ length: 10 }),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	deliveryMode: deliveryType("delivery_mode").default('radius'),
	deliveryRadiusKm: numeric("delivery_radius_km", { precision: 5, scale:  2 }),
	handlingFee: numeric("handling_fee", { precision: 10, scale:  2 }).default('0'),
	minOrderPrice: integer("min_order_price").default(100),
	deliveryFeeValueType: feeValueType("delivery_fee_value_type").default('fixed').notNull(),
	baseDistanceKm: numeric("base_distance_km", { precision: 10, scale:  2 }).default('0').notNull(),
	deliveryFeeBasePrice: numeric("delivery_fee_base_price", { precision: 10, scale:  2 }).default('0'),
	deliveryFeePerkm: numeric("delivery_fee_perkm", { precision: 10, scale:  2 }).default('0').notNull(),
	deliveryFeeFixed: numeric("delivery_fee_fixed", { precision: 10, scale:  2 }).default('0').notNull(),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_store_tenant"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Allow public read access to active stores", { as: "permissive", for: "select", to: ["public"], using: sql`(is_active = true)` }),
]);

export const services = pgTable("services", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	name: varchar({ length: 150 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull().default("general"),
	durationMinutes: integer("duration_minutes").notNull(),
	price: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	bufferMinutes: integer("buffer_minutes").default(0).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_services_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	uniqueIndex("services_tenant_slug_key").using("btree", table.tenantId.asc().nullsLast(), table.slug.asc().nullsLast()),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "services_tenant_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("services_manage", { as: "permissive", for: "all", to: ["public"], using: sql`has_permission('booking.manage'::app_permission)`, withCheck: sql`has_permission('booking.manage'::app_permission)`  }),
	pgPolicy("services_public_select", { as: "permissive", for: "select", to: ["public"] }),
	check("services_duration_minutes_check", sql`duration_minutes > 0`),
]);

export const providerServices = pgTable("provider_services", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	providerId: bigint("provider_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	serviceId: bigint("service_id", { mode: "number" }).notNull(),
	priceOverride: numeric("price_override", { precision: 10, scale:  2 }),
	durationOverrideMinutes: integer("duration_override_minutes"),
	isActive: boolean("is_active").default(true),
}, (table) => [
	index("idx_provider_services_provider_id").using("btree", table.providerId.asc().nullsLast()),
	index("idx_provider_services_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	uniqueIndex("provider_services_provider_service_key").using("btree", table.providerId.asc().nullsLast(), table.serviceId.asc().nullsLast()),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [providers.id],
			name: "provider_services_provider_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "provider_services_service_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "provider_services_tenant_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("provider_services_public_select", { as: "permissive", for: "select", to: ["public"], using: sql`(is_active = true)` }),
	pgPolicy("provider_services_manage", { as: "permissive", for: "all", to: ["public"] }),
]);

export const tenantUsers = pgTable("tenant_users", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	role: appRole().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tenant_users_role").using("btree", table.role.asc().nullsLast()),
	index("idx_tenant_users_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	index("idx_tenant_users_user_id").using("btree", table.userId.asc().nullsLast()),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tenant_users_tenant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tenant_users_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("tenant_users_select_vendor", { as: "permissive", for: "select", to: ["public"], using: sql`((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = COALESCE(auth.uid(), (NULLIF(current_setting('app.current_user_id'::text, true), ''::text))::uuid)) AND (ur.role = 'vendor'::app_role)))) OR has_permission('user.manage'::app_permission) OR true)` }),
	pgPolicy("tenant_users_insert_policy", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const providerAvailability = pgTable("provider_availability", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	providerId: bigint("provider_id", { mode: "number" }).notNull(),
	weekday: smallint().notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	isActive: boolean("is_active").default(true),
}, (table) => [
	index("idx_provider_availability_provider_id").using("btree", table.providerId.asc().nullsLast(), table.weekday.asc().nullsLast()),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [providers.id],
			name: "provider_availability_provider_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "provider_availability_tenant_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("provider_availability_manage_own", { as: "permissive", for: "all", to: ["public"], using: sql`is_current_user_provider_for(provider_id)`, withCheck: sql`is_current_user_provider_for(provider_id)`  }),
	pgPolicy("provider_availability_public_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("provider_availability_manage", { as: "permissive", for: "all", to: ["public"] }),
	check("chk_availability_time_order", sql`end_time > start_time`),
	check("provider_availability_weekday_check", sql`(weekday >= 0) AND (weekday <= 6)`),
]);

export const providerAvailabilityExceptions = pgTable("provider_availability_exceptions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	providerId: bigint("provider_id", { mode: "number" }).notNull(),
	exceptionDate: date("exception_date").notNull(),
	isAvailable: boolean("is_available").default(false).notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	reason: varchar({ length: 255 }),
}, (table) => [
	index("idx_provider_exceptions_provider_id").using("btree", table.providerId.asc().nullsLast(), table.exceptionDate.asc().nullsLast()),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [providers.id],
			name: "provider_availability_exceptions_provider_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "provider_availability_exceptions_tenant_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("provider_exceptions_manage_own", { as: "permissive", for: "all", to: ["public"], using: sql`is_current_user_provider_for(provider_id)`, withCheck: sql`is_current_user_provider_for(provider_id)`  }),
	pgPolicy("provider_exceptions_public_select", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("provider_exceptions_manage", { as: "permissive", for: "all", to: ["public"] }),
]);

export const userAddresses = pgTable("user_addresses", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 100 }),
	phone: varchar({ length: 15 }),
	addressLine1: varchar("address_line1", { length: 255 }).notNull(),
	addressLine2: varchar("address_line2", { length: 255 }),
	city: varchar({ length: 100 }).notNull(),
	state: varchar({ length: 100 }).notNull(),
	pincode: varchar({ length: 10 }).notNull(),
	country: varchar({ length: 100 }).default('India'),
	isDefault: boolean("is_default").default(false),
	latitude: numeric({ precision: 10, scale:  7 }),
	longitude: numeric({ precision: 10, scale:  7 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_user_address_user"
		}).onDelete("cascade"),
]);

export const themes = pgTable("themes", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	name: text().notNull(),
	themeJson: jsonb("theme_json").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("themes_public_select", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const tenants = pgTable("tenants", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	subdomain: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	planId: integer("plan_id").notNull(),
	themeId: integer("theme_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("Allow public read active tenants", { as: "permissive", for: "select", to: ["public"], using: sql`(is_active = true)` }),
]);

export const userRoles = pgTable("user_roles", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	userId: uuid("user_id").notNull(),
	role: appRole().notNull(),
}, (table) => [
	index("idx_user_roles_user_id").using("btree", table.userId.asc().nullsLast()),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("user_roles_select_own_or_admin", { as: "permissive", for: "select", to: ["public"], using: sql`((user_id = auth.uid()) OR has_role('super_admin'::app_role))` }),
	pgPolicy("user_roles_select_own", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("super admin full access user_roles", { as: "permissive", for: "all", to: ["public"] }),
]);

export const orderItems = pgTable("order_items", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	variantId: bigint("variant_id", { mode: "number" }).notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	productImage: varchar("product_image", { length: 255 }),
	variantName: varchar("variant_name", { length: 100 }).notNull(),
	attributesJson: jsonb("attributes_json"),
	price: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	discountPrice: numeric("discount_price", { precision: 10, scale:  2 }),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	quantity: integer().default(1).notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("idx_order_items_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_item_order"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "fk_order_item_product"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "fk_order_item_variant"
		}).onDelete("set null"),
]);

export const orderReviews = pgTable("order_reviews", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	rating: smallint().notNull(),
	review: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }),
}, (table) => [
	index("idx_order_reviews_product_id").using("btree", table.productId.asc().nullsLast()),
	index("idx_order_reviews_tenant_product").using("btree", table.tenantId.asc().nullsLast(), table.productId.asc().nullsLast()),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_review_order"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "fk_review_product"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_review_tenant"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_review_user"
		}).onDelete("cascade"),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	check("order_reviews_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const categories = pgTable("categories", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	name: varchar({ length: 150 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	description: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("categories_tenant_slug_key").using("btree", table.tenantId.asc().nullsLast(), table.slug.asc().nullsLast()),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "fk_category_parent"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_category_tenant"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("public can view categories", { as: "permissive", for: "select", to: ["app_user"], using: sql`true` }),
]);

export const bookingCategories = pgTable("booking_categories", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_booking_categories_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "booking_categories_tenant_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("booking_categories_public_select", { as: "permissive", for: "select", to: ["public"], using: sql`(is_active = true)` }),
	pgPolicy("booking_categories_manage", { as: "permissive", for: "all", to: ["public"] }),
]);

export const announcements = pgTable("announcements", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storeId: bigint("store_id", { mode: "number" }),
	title: varchar({ length: 255 }).notNull(),
	status: announcementStatus().default('draft'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "fk_announcement_store"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_announcement_tenant"
		}).onDelete("cascade"),
]);

export const productImages = pgTable("product_images", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	imageUrl: varchar("image_url", { length: 255 }).notNull(),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("idx_product_images_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	uniqueIndex("product_images_one_primary_per_product").using("btree", table.productId.asc().nullsLast()).where(sql`(is_primary = true)`),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "fk_product_image"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const productVariants = pgTable("product_variants", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	variantName: varchar("variant_name", { length: 100 }).notNull(),
	sku: varchar({ length: 100 }),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	discountPrice: numeric("discount_price", { precision: 10, scale:  2 }),
	stockQty: integer("stock_qty").default(0),
	maxBuyQty: integer("max_buy_qty"),
	attributesJson: jsonb("attributes_json"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("idx_product_variants_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("vendors can insert own product variants", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(EXISTS ( SELECT 1
   FROM ((products p
     JOIN tenants t ON ((t.id = p.tenant_id)))
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
  WHERE ((p.id = product_variants.product_id) AND (t.user_id = auth.uid()) AND (ur.role = 'vendor'::app_role))))`  }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
]);

export const productTags = pgTable("product_tags", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tagId: bigint("tag_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
}, (table) => [
	index("idx_product_tags_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "fk_product_tag_product"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "fk_product_tag_tag"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const plans = pgTable("plans", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	billingCycle: text("billing_cycle").default('monthly'),
	maxProducts: integer("max_products").default(100),
	maxCustomers: integer("max_customers").default(1000),
	maxStorageMb: integer("max_storage_mb").default(500),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("plans_public_select", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	check("plans_billing_cycle_check", sql`billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text])`),
]);

export const orders = pgTable("orders", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storeId: bigint("store_id", { mode: "number" }),
	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	status: orderStatus().default('pending').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	shippingFee: numeric("shipping_fee", { precision: 10, scale:  2 }).default('0').notNull(),
	payableAmount: numeric("payable_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	handlingAmount: numeric("handling_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	paymentStatus: paymentStatus("payment_status").default('pending').notNull(),
	paymentMethod: paymentMethod("payment_method").default('cod').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	addressId: bigint("address_id", { mode: "number" }).notNull(),
	deliveryType: deliveryTypes("delivery_type").default('delivery').notNull(),
	deliveryNotes: varchar("delivery_notes", { length: 255 }),
	orderDataJson: jsonb("order_data_json"),
	placedAt: timestamp("placed_at", { mode: 'string' }).defaultNow().notNull(),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [userAddresses.id],
			name: "fk_order_address"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "fk_order_store"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_order_tenant"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_order_user"
		}).onDelete("cascade"),
]);

export const userCarts = pgTable("user_carts", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	variantId: bigint("variant_id", { mode: "number" }).notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).generatedAlwaysAsIdentity(),
}, (table) => [
	index("idx_user_carts_tenant_user").using("btree", table.tenantId.asc().nullsLast(), table.userId.asc().nullsLast()),
	uniqueIndex("user_carts_user_variant_key").using("btree", table.userId.asc().nullsLast(), table.variantId.asc().nullsLast()),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_user_cart_tenant"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_user_cart_user"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "fk_user_cart_variant"
		}).onDelete("cascade"),
	check("chk_user_cart_quantity", sql`quantity > 0`),
]);

export const providers = pgTable("providers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	userId: uuid("user_id"),
	name: varchar({ length: 150 }).notNull(),
	title: varchar({ length: 150 }),
	bio: text(),
	avatarUrl: varchar("avatar_url", { length: 255 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	slug: varchar({ length: 150 }).notNull(),
	category: varchar({ length: 100 }).notNull(),
}, (table) => [
	index("idx_providers_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	uniqueIndex("providers_tenant_slug_key").using("btree", table.tenantId.asc().nullsLast(), table.slug.asc().nullsLast()),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "providers_tenant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "providers_user_id_fkey"
		}).onDelete("set null"),
	pgPolicy("providers_manage", { as: "permissive", for: "all", to: ["public"], using: sql`has_permission('booking.manage'::app_permission)`, withCheck: sql`has_permission('booking.manage'::app_permission)`  }),
	pgPolicy("providers_public_select", { as: "permissive", for: "select", to: ["public"] }),
]);

export const menus = pgTable("menus", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	menuType: menuType("menu_type").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	title: varchar({ length: 150 }).notNull(),
	href: varchar({ length: 255 }),
	icon: varchar({ length: 100 }),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_menus_parent").using("btree", table.parentId.asc().nullsLast()),
	index("idx_navigation_menus_active_position").using("btree", table.isActive.asc().nullsLast(), table.sortOrder.asc().nullsLast()),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "fk_menu_parent"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_menu_tenant"
		}).onDelete("cascade"),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const orderStatusLogs = pgTable("order_status_logs", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	remarks: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	changedBy: uuid("changed_by"),
}, (table) => [
	index("idx_order_status_logs_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "fk_order_status_order"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "order_status_logs_changed_by_fkey"
		}).onDelete("set null"),
]);

export const products = pgTable("products", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	storeId: bigint("store_id", { mode: "number" }),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	sku: varchar({ length: 100 }),
	description: text(),
	isActive: boolean("is_active").default(true),
	featured: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("products_tenant_slug_key").using("btree", table.tenantId.asc().nullsLast(), table.slug.asc().nullsLast()),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "fk_product_category"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.storeId],
			foreignColumns: [stores.id],
			name: "fk_product_store"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_product_tenant"
		}).onUpdate("cascade").onDelete("cascade"),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const profiles = pgTable("profiles", {
	id: uuid().notNull(),
	fullName: text("full_name"),
	role: text().default('merchant'),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	email: text(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "profiles_tenant_id_fkey"
		}),
	pgPolicy("profiles_booking_manage_select", { as: "permissive", for: "select", to: ["app_user"], using: sql`(has_role('super_admin'::app_role) OR has_role('admin'::app_role) OR has_role('vendor'::app_role))` }),
	pgPolicy("profiles_insert_own", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Enable read access for all users", { as: "permissive", for: "select", to: ["public"] }),
]);

export const rolePermissions = pgTable("role_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).generatedByDefaultAsIdentity({ name: "role_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, cache: 1 }),
	role: appRole().notNull(),
	permission: appPermission().notNull(),
}, (table) => [
	index("idx_role_permissions_role_id").using("btree", table.role.asc().nullsLast()),
	pgPolicy("super admin full access role_permissions", { as: "permissive", for: "all", to: ["public"], using: sql`has_role('super_admin'::app_role)`, withCheck: sql`has_role('super_admin'::app_role)`  }),
	pgPolicy("admin view role permissions", { as: "permissive", for: "select", to: ["public"] }),
]);

export const tags = pgTable("tags", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_tag_tenant"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const appointmentStatusLogs = pgTable("appointment_status_logs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	appointmentId: bigint("appointment_id", { mode: "number" }).notNull(),
	status: bookingStatus().notNull(),
	remarks: varchar({ length: 255 }),
	changedBy: uuid("changed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_appointment_status_logs_appt_id").using("btree", table.appointmentId.asc().nullsLast()),
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [appointments.id],
			name: "appointment_status_logs_appointment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "appointment_status_logs_changed_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "appointment_status_logs_tenant_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("appointment_status_logs_insert_customer", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(EXISTS ( SELECT 1
   FROM appointments a
  WHERE ((a.id = appointment_status_logs.appointment_id) AND (a.user_id = auth.uid()))))`  }),
	pgPolicy("appointment_status_logs_insert_provider", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("appointment_status_logs_select_provider", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("appointment_status_logs_insert_staff", { as: "permissive", for: "insert", to: ["app_user"] }),
]);

export const appointments = pgTable("appointments", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tenantId: bigint("tenant_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	providerId: bigint("provider_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	serviceId: bigint("service_id", { mode: "number" }).notNull(),
	userId: uuid("user_id").notNull(),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }).notNull(),
	status: bookingStatus().default('pending').notNull(),
	price: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	customerNotes: text("customer_notes"),
	internalNotes: text("internal_notes"),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	cancellationReason: varchar("cancellation_reason", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	localDate: date("local_date").notNull(),
}, (table) => [
	index("idx_appointments_provider_time").using("btree", table.providerId.asc().nullsLast(), table.startTime.asc().nullsLast()),
	index("idx_appointments_tenant_id").using("btree", table.tenantId.asc().nullsLast()),
	index("idx_appointments_user_id").using("btree", table.userId.asc().nullsLast()),
	uniqueIndex("one_appointment_per_provider_per_day").using("btree", table.providerId.asc().nullsLast(), table.userId.asc().nullsLast(), table.localDate.asc().nullsLast()).where(sql`(status <> 'cancelled'::booking_status)`),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [providers.id],
			name: "appointments_provider_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "appointments_service_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "appointments_tenant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "appointments_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("appointments_update_own", { as: "permissive", for: "update", to: ["public"], using: sql`((user_id = auth.uid()) OR has_permission('booking.manage'::app_permission))`, withCheck: sql`((user_id = auth.uid()) OR has_permission('booking.manage'::app_permission))`  }),
	pgPolicy("appointments_select_own", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("appointments_insert_customer", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("appointments_insert_staff", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("appointments_update_provider", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("appointments_select_vendor", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("appointments_select_provider", { as: "permissive", for: "select", to: ["public"] }),
	check("chk_appointment_time_order", sql`end_time > start_time`),
]);
export const productRatings = pgView("product_ratings", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }),
	averageRating: numeric("average_rating"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	reviewCount: bigint("review_count", { mode: "number" }),
}).with({"securityInvoker":true}).as(sql`SELECT product_id, round(avg(rating), 1) AS average_rating, count(*) AS review_count FROM order_reviews GROUP BY product_id`);