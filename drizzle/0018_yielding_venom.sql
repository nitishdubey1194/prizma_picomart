DROP INDEX "categories_tenant_slug_key";--> statement-breakpoint
DROP INDEX "idx_navigation_menus_active_position";--> statement-breakpoint
DROP INDEX "products_tenant_slug_key";--> statement-breakpoint
DROP INDEX "refresh_tokens_token_hash_idx";--> statement-breakpoint
DROP INDEX "idx_role_permissions_role_id";--> statement-breakpoint
DROP INDEX "services_tenant_slug_key";--> statement-breakpoint
DROP INDEX "idx_tenant_users_role";--> statement-breakpoint
CREATE UNIQUE INDEX "categories_tenant_slug_key" ON "categories" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_navigation_menus_active_position" ON "menus" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_slug_key" ON "products" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "services_tenant_slug_key" ON "services" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_tenant_users_role" ON "tenant_users" USING btree ("role");