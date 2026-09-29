ALTER TABLE "tenants" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "tenants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);