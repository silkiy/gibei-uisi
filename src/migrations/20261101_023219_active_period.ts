import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."organization_state_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor_id" numeric NOT NULL,
    "version" numeric NOT NULL,
    "before" jsonb NOT NULL,
    "after" jsonb NOT NULL,
    "correlation_id" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."organization_state" (
    "id" serial PRIMARY KEY NOT NULL,
    "active_period_id" integer,
    "version" numeric,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "payload"."organization_state" ADD CONSTRAINT "organization_state_active_period_id_organizational_periods_id_fk" FOREIGN KEY ("active_period_id") REFERENCES "payload"."organizational_periods"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "organization_state_audit_version_idx" ON "payload"."organization_state_audit" USING btree ("version");
  CREATE INDEX "organization_state_audit_updated_at_idx" ON "payload"."organization_state_audit" USING btree ("updated_at");
  CREATE INDEX "organization_state_audit_created_at_idx" ON "payload"."organization_state_audit" USING btree ("created_at");
  CREATE INDEX "organization_state_active_period_idx" ON "payload"."organization_state" USING btree ("active_period_id");`)
  await db.execute(sql`REVOKE UPDATE,DELETE,TRUNCATE ON payload.organization_state_audit FROM gibei_runtime;
    REVOKE ALL ON payload.organization_state_audit FROM anon,authenticated,PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.organization_state_audit) THEN RAISE EXCEPTION 'Active period history must be preserved'; END IF; END $$;`);
  await db.execute(sql`
   DROP TABLE "payload"."organization_state_audit" CASCADE;
  DROP TABLE "payload"."organization_state" CASCADE;`)
}
