import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."settings_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor_id" numeric NOT NULL,
    "version" numeric NOT NULL,
    "before" jsonb NOT NULL,
    "after" jsonb NOT NULL,
    "correlation_id" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."site_settings_socials" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "url" varchar NOT NULL,
    "confirmed" boolean DEFAULT false
  );

  CREATE TABLE "payload"."site_settings_navigation" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "url" varchar NOT NULL
  );

  CREATE TABLE "payload"."site_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_name" varchar DEFAULT 'GIBEI UISI' NOT NULL,
    "seo_description" varchar,
    "logo_id" integer,
    "favicon_id" integer,
    "email" varchar,
    "email_confirmed" boolean DEFAULT false,
    "location" varchar,
    "location_confirmed" boolean DEFAULT false,
    "footer_text" varchar,
    "config_version" numeric,
    "logo_version" varchar,
    "logo_checksum" varchar,
    "favicon_version" varchar,
    "favicon_checksum" varchar,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "payload"."site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "settings_audit_version_idx" ON "payload"."settings_audit" USING btree ("version");
  CREATE INDEX "settings_audit_updated_at_idx" ON "payload"."settings_audit" USING btree ("updated_at");
  CREATE INDEX "settings_audit_created_at_idx" ON "payload"."settings_audit" USING btree ("created_at");
  CREATE INDEX "site_settings_socials_order_idx" ON "payload"."site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "payload"."site_settings_socials" USING btree ("_parent_id");
  CREATE INDEX "site_settings_navigation_order_idx" ON "payload"."site_settings_navigation" USING btree ("_order");
  CREATE INDEX "site_settings_navigation_parent_id_idx" ON "payload"."site_settings_navigation" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "payload"."site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_favicon_idx" ON "payload"."site_settings" USING btree ("favicon_id");`)
  await db.execute(sql`REVOKE UPDATE, DELETE, TRUNCATE ON payload.settings_audit FROM gibei_runtime;
    REVOKE ALL ON payload.settings_audit FROM anon, authenticated, PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.settings_audit) THEN RAISE EXCEPTION 'Configuration history must be preserved'; END IF; END $$;`);
  await db.execute(sql`
   DROP TABLE "payload"."settings_audit" CASCADE;
  DROP TABLE "payload"."site_settings_socials" CASCADE;
  DROP TABLE "payload"."site_settings_navigation" CASCADE;
  DROP TABLE "payload"."site_settings" CASCADE;`)
}
