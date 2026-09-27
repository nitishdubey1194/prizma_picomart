import { relations } from "drizzle-orm/relations";
import { users, refreshTokens, tenants, stores, services, providers, providerServices, tenantUsers, providerAvailability, providerAvailabilityExceptions, userAddresses, userRoles, orders, orderItems, products, productVariants, orderReviews, categories, bookingCategories, announcements, productImages, productTags, tags, userCarts, menus, orderStatusLogs, profiles, appointments, appointmentStatusLogs } from "./schema";

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	refreshTokens: many(refreshTokens),
	tenantUsers: many(tenantUsers),
	userAddresses: many(userAddresses),
	tenants: many(tenants),
	userRoles: many(userRoles),
	orderReviews: many(orderReviews),
	orders: many(orders),
	userCarts: many(userCarts),
	providers: many(providers),
	orderStatusLogs: many(orderStatusLogs),
	profiles: many(profiles),
	appointmentStatusLogs: many(appointmentStatusLogs),
	appointments: many(appointments),
}));

export const storesRelations = relations(stores, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [stores.tenantId],
		references: [tenants.id]
	}),
	announcements: many(announcements),
	orders: many(orders),
	products: many(products),
}));

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	stores: many(stores),
	services: many(services),
	providerServices: many(providerServices),
	tenantUsers: many(tenantUsers),
	providerAvailabilities: many(providerAvailability),
	providerAvailabilityExceptions: many(providerAvailabilityExceptions),
	user: one(users, {
		fields: [tenants.userId],
		references: [users.id]
	}),
	orderReviews: many(orderReviews),
	categories: many(categories),
	bookingCategories: many(bookingCategories),
	announcements: many(announcements),
	orders: many(orders),
	userCarts: many(userCarts),
	providers: many(providers),
	menus: many(menus),
	products: many(products),
	profiles: many(profiles),
	tags: many(tags),
	appointmentStatusLogs: many(appointmentStatusLogs),
	appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [services.tenantId],
		references: [tenants.id]
	}),
	providerServices: many(providerServices),
	appointments: many(appointments),
}));

export const providerServicesRelations = relations(providerServices, ({one}) => ({
	provider: one(providers, {
		fields: [providerServices.providerId],
		references: [providers.id]
	}),
	service: one(services, {
		fields: [providerServices.serviceId],
		references: [services.id]
	}),
	tenant: one(tenants, {
		fields: [providerServices.tenantId],
		references: [tenants.id]
	}),
}));

export const providersRelations = relations(providers, ({one, many}) => ({
	providerServices: many(providerServices),
	providerAvailabilities: many(providerAvailability),
	providerAvailabilityExceptions: many(providerAvailabilityExceptions),
	tenant: one(tenants, {
		fields: [providers.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [providers.userId],
		references: [users.id]
	}),
	appointments: many(appointments),
}));

export const tenantUsersRelations = relations(tenantUsers, ({one}) => ({
	tenant: one(tenants, {
		fields: [tenantUsers.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [tenantUsers.userId],
		references: [users.id]
	}),
}));

export const providerAvailabilityRelations = relations(providerAvailability, ({one}) => ({
	provider: one(providers, {
		fields: [providerAvailability.providerId],
		references: [providers.id]
	}),
	tenant: one(tenants, {
		fields: [providerAvailability.tenantId],
		references: [tenants.id]
	}),
}));

export const providerAvailabilityExceptionsRelations = relations(providerAvailabilityExceptions, ({one}) => ({
	provider: one(providers, {
		fields: [providerAvailabilityExceptions.providerId],
		references: [providers.id]
	}),
	tenant: one(tenants, {
		fields: [providerAvailabilityExceptions.tenantId],
		references: [tenants.id]
	}),
}));

export const userAddressesRelations = relations(userAddresses, ({one, many}) => ({
	user: one(users, {
		fields: [userAddresses.userId],
		references: [users.id]
	}),
	orders: many(orders),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [orderItems.variantId],
		references: [productVariants.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	orderReviews: many(orderReviews),
	userAddress: one(userAddresses, {
		fields: [orders.addressId],
		references: [userAddresses.id]
	}),
	store: one(stores, {
		fields: [orders.storeId],
		references: [stores.id]
	}),
	tenant: one(tenants, {
		fields: [orders.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	orderStatusLogs: many(orderStatusLogs),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	orderItems: many(orderItems),
	orderReviews: many(orderReviews),
	productImages: many(productImages),
	productVariants: many(productVariants),
	productTags: many(productTags),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	store: one(stores, {
		fields: [products.storeId],
		references: [stores.id]
	}),
	tenant: one(tenants, {
		fields: [products.tenantId],
		references: [tenants.id]
	}),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	orderItems: many(orderItems),
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
	userCarts: many(userCarts),
}));

export const orderReviewsRelations = relations(orderReviews, ({one}) => ({
	order: one(orders, {
		fields: [orderReviews.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderReviews.productId],
		references: [products.id]
	}),
	tenant: one(tenants, {
		fields: [orderReviews.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [orderReviews.userId],
		references: [users.id]
	}),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	tenant: one(tenants, {
		fields: [categories.tenantId],
		references: [tenants.id]
	}),
	products: many(products),
}));

export const bookingCategoriesRelations = relations(bookingCategories, ({one}) => ({
	tenant: one(tenants, {
		fields: [bookingCategories.tenantId],
		references: [tenants.id]
	}),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	store: one(stores, {
		fields: [announcements.storeId],
		references: [stores.id]
	}),
	tenant: one(tenants, {
		fields: [announcements.tenantId],
		references: [tenants.id]
	}),
}));

export const productImagesRelations = relations(productImages, ({one}) => ({
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id]
	}),
}));

export const productTagsRelations = relations(productTags, ({one}) => ({
	product: one(products, {
		fields: [productTags.productId],
		references: [products.id]
	}),
	tag: one(tags, {
		fields: [productTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({one, many}) => ({
	productTags: many(productTags),
	tenant: one(tenants, {
		fields: [tags.tenantId],
		references: [tenants.id]
	}),
}));

export const userCartsRelations = relations(userCarts, ({one}) => ({
	tenant: one(tenants, {
		fields: [userCarts.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [userCarts.userId],
		references: [users.id]
	}),
	productVariant: one(productVariants, {
		fields: [userCarts.variantId],
		references: [productVariants.id]
	}),
}));

export const menusRelations = relations(menus, ({one, many}) => ({
	menu: one(menus, {
		fields: [menus.parentId],
		references: [menus.id],
		relationName: "menus_parentId_menus_id"
	}),
	menus: many(menus, {
		relationName: "menus_parentId_menus_id"
	}),
	tenant: one(tenants, {
		fields: [menus.tenantId],
		references: [tenants.id]
	}),
}));

export const orderStatusLogsRelations = relations(orderStatusLogs, ({one}) => ({
	order: one(orders, {
		fields: [orderStatusLogs.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [orderStatusLogs.changedBy],
		references: [users.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one}) => ({
	user: one(users, {
		fields: [profiles.id],
		references: [users.id]
	}),
	tenant: one(tenants, {
		fields: [profiles.tenantId],
		references: [tenants.id]
	}),
}));

export const appointmentStatusLogsRelations = relations(appointmentStatusLogs, ({one}) => ({
	appointment: one(appointments, {
		fields: [appointmentStatusLogs.appointmentId],
		references: [appointments.id]
	}),
	user: one(users, {
		fields: [appointmentStatusLogs.changedBy],
		references: [users.id]
	}),
	tenant: one(tenants, {
		fields: [appointmentStatusLogs.tenantId],
		references: [tenants.id]
	}),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	appointmentStatusLogs: many(appointmentStatusLogs),
	provider: one(providers, {
		fields: [appointments.providerId],
		references: [providers.id]
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id]
	}),
	tenant: one(tenants, {
		fields: [appointments.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [appointments.userId],
		references: [users.id]
	}),
}));