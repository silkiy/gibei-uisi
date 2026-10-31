import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_media_state" AS ENUM('ready', 'revoked', 'deleted');
  CREATE TABLE "payload"."media" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "name" varchar NOT NULL,
    "alt" varchar NOT NULL,
    "owner_id" integer NOT NULL,
    "state" "payload"."enum_media_state" NOT NULL,
    "file_version" varchar NOT NULL,
    "checksum" varchar NOT NULL,
    "mime" varchar NOT NULL,
    "extension" varchar NOT NULL,
    "size" numeric NOT NULL,
    "width" numeric,
    "height" numeric,
    "has_thumbnail" boolean DEFAULT false NOT NULL,
    "thumbnail_checksum" varchar,
    "revoked_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."media_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."media_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" numeric NOT NULL,
    "actor_id" numeric NOT NULL,
    "action" varchar NOT NULL,
    "details" jsonb NOT NULL,
    "correlation_id" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."media" ADD CONSTRAINT "media_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."media_rels" ADD CONSTRAINT "media_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "media_key_idx" ON "payload"."media" USING btree ("key");
  CREATE INDEX "media_owner_idx" ON "payload"."media" USING btree ("owner_id");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE INDEX "media_rels_order_idx" ON "payload"."media_rels" USING btree ("order");
  CREATE INDEX "media_rels_parent_idx" ON "payload"."media_rels" USING btree ("parent_id");
  CREATE INDEX "media_rels_path_idx" ON "payload"."media_rels" USING btree ("path");
  CREATE INDEX "media_rels_users_id_idx" ON "payload"."media_rels" USING btree ("users_id");
  CREATE INDEX "media_audit_updated_at_idx" ON "payload"."media_audit" USING btree ("updated_at");
  CREATE INDEX "media_audit_created_at_idx" ON "payload"."media_audit" USING btree ("created_at");`)
  await db.execute(sql`REVOKE UPDATE, DELETE, TRUNCATE ON payload.media_audit FROM gibei_runtime; REVOKE ALL ON payload.media_audit FROM anon, authenticated, PUBLIC;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."media_rels" CASCADE;
  DROP TABLE "payload"."media_audit" CASCADE;
  DROP TYPE "payload"."enum_media_state";`)
}
