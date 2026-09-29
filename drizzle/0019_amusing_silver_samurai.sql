DROP INDEX "idx_provider_availability_provider_id";--> statement-breakpoint
DROP INDEX "idx_provider_exceptions_provider_id";--> statement-breakpoint
CREATE INDEX "idx_provider_availability_provider_id" ON "provider_availability" USING btree ("provider_id","weekday");--> statement-breakpoint
CREATE INDEX "idx_provider_exceptions_provider_id" ON "provider_availability_exceptions" USING btree ("provider_id","exception_date");