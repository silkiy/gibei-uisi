import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_gallery_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_partner_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_achievement_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  ALTER TYPE "payload"."enum_organization_reviews_kind" ADD VALUE 'galleries';
  ALTER TYPE "payload"."enum_organization_reviews_kind" ADD VALUE 'partners';
  ALTER TYPE "payload"."enum_organization_reviews_kind" ADD VALUE 'achievements';
  ALTER TYPE "payload"."enum_organization_audit_kind" ADD VALUE 'galleries';
  ALTER TYPE "payload"."enum_organization_audit_kind" ADD VALUE 'partners';
  ALTER TYPE "payload"."enum_organization_audit_kind" ADD VALUE 'achievements';
  CREATE TABLE "payload"."partner_logo_permissions" (
    "id" serial PRIMARY KEY NOT NULL,
    "partner_id" integer NOT NULL,
    "asset_id" numeric NOT NULL,
    "file_version" varchar NOT NULL,
    "checksum" varchar NOT NULL,
    "allowed" boolean DEFAULT false NOT NULL,
    "actor_id" numeric NOT NULL,
    "note" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."galleries" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "owner_id" integer NOT NULL,
    "working_revision_id" integer,
    "public_revision_id" integer,
    "lock_version" numeric DEFAULT 0 NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."galleries_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."gallery_revisions_photos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer,
    "alt" varchar,
    "caption" varchar
  );

  CREATE TABLE "payload"."gallery_revisions_assets" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "file_version" varchar,
    "checksum" varchar
  );

  CREATE TABLE "payload"."gallery_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_gallery_revisions_state" NOT NULL,
    "title" varchar,
    "description" varchar,
    "example" boolean DEFAULT true,
    "date" varchar,
    "event_id" integer,
    "video_u_r_l" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."partners" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "owner_id" integer NOT NULL,
    "working_revision_id" integer,
    "public_revision_id" integer,
    "lock_version" numeric DEFAULT 0 NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."partners_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."partner_revisions_assets" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "file_version" varchar,
    "checksum" varchar
  );

  CREATE TABLE "payload"."partner_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_partner_revisions_state" NOT NULL,
    "title" varchar,
    "description" varchar,
    "example" boolean DEFAULT true,
    "collaboration" varchar,
    "website" varchar,
    "logo_id" integer,
    "show_on_homepage" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."achievements" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "owner_id" integer NOT NULL,
    "working_revision_id" integer,
    "public_revision_id" integer,
    "lock_version" numeric DEFAULT 0 NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."achievements_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."achievement_revisions_assets" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "file_version" varchar,
    "checksum" varchar
  );

  CREATE TABLE "payload"."achievement_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_achievement_revisions_state" NOT NULL,
    "title" varchar,
    "description" varchar,
    "example" boolean DEFAULT true,
    "date" varchar,
    "category" varchar,
    "recipient" varchar,
    "documentation_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."organization_reviews" ADD COLUMN "gallery_id" integer;
  ALTER TABLE "payload"."organization_reviews" ADD COLUMN "partner_id" integer;
  ALTER TABLE "payload"."organization_reviews" ADD COLUMN "achievement_id" integer;
  ALTER TABLE "payload"."partner_logo_permissions" ADD CONSTRAINT "partner_logo_permissions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "payload"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."galleries" ADD CONSTRAINT "galleries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."galleries" ADD CONSTRAINT "galleries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."galleries" ADD CONSTRAINT "galleries_working_revision_id_gallery_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."gallery_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."galleries" ADD CONSTRAINT "galleries_public_revision_id_gallery_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."gallery_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."galleries_rels" ADD CONSTRAINT "galleries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."galleries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."galleries_rels" ADD CONSTRAINT "galleries_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."gallery_revisions_photos" ADD CONSTRAINT "gallery_revisions_photos_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."gallery_revisions_photos" ADD CONSTRAINT "gallery_revisions_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."gallery_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."gallery_revisions_assets" ADD CONSTRAINT "gallery_revisions_assets_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."gallery_revisions_assets" ADD CONSTRAINT "gallery_revisions_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."gallery_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."gallery_revisions" ADD CONSTRAINT "gallery_revisions_entity_id_galleries_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."galleries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."gallery_revisions" ADD CONSTRAINT "gallery_revisions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "payload"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partners" ADD CONSTRAINT "partners_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partners" ADD CONSTRAINT "partners_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partners" ADD CONSTRAINT "partners_working_revision_id_partner_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."partner_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partners" ADD CONSTRAINT "partners_public_revision_id_partner_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."partner_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partners_rels" ADD CONSTRAINT "partners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."partners_rels" ADD CONSTRAINT "partners_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."partner_revisions_assets" ADD CONSTRAINT "partner_revisions_assets_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partner_revisions_assets" ADD CONSTRAINT "partner_revisions_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."partner_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."partner_revisions" ADD CONSTRAINT "partner_revisions_entity_id_partners_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."partner_revisions" ADD CONSTRAINT "partner_revisions_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."achievements" ADD CONSTRAINT "achievements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."achievements" ADD CONSTRAINT "achievements_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."achievements" ADD CONSTRAINT "achievements_working_revision_id_achievement_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."achievement_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."achievements" ADD CONSTRAINT "achievements_public_revision_id_achievement_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."achievement_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."achievements_rels" ADD CONSTRAINT "achievements_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."achievements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."achievements_rels" ADD CONSTRAINT "achievements_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."achievement_revisions_assets" ADD CONSTRAINT "achievement_revisions_assets_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."achievement_revisions_assets" ADD CONSTRAINT "achievement_revisions_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."achievement_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."achievement_revisions" ADD CONSTRAINT "achievement_revisions_entity_id_achievements_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."achievements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."achievement_revisions" ADD CONSTRAINT "achievement_revisions_documentation_id_media_id_fk" FOREIGN KEY ("documentation_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "partner_logo_permissions_partner_idx" ON "payload"."partner_logo_permissions" USING btree ("partner_id");
  CREATE INDEX "partner_logo_permissions_updated_at_idx" ON "payload"."partner_logo_permissions" USING btree ("updated_at");
  CREATE INDEX "partner_logo_permissions_created_at_idx" ON "payload"."partner_logo_permissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "galleries_slug_idx" ON "payload"."galleries" USING btree ("slug");
  CREATE INDEX "galleries_created_by_idx" ON "payload"."galleries" USING btree ("created_by_id");
  CREATE INDEX "galleries_owner_idx" ON "payload"."galleries" USING btree ("owner_id");
  CREATE INDEX "galleries_working_revision_idx" ON "payload"."galleries" USING btree ("working_revision_id");
  CREATE INDEX "galleries_public_revision_idx" ON "payload"."galleries" USING btree ("public_revision_id");
  CREATE INDEX "galleries_updated_at_idx" ON "payload"."galleries" USING btree ("updated_at");
  CREATE INDEX "galleries_created_at_idx" ON "payload"."galleries" USING btree ("created_at");
  CREATE INDEX "galleries_rels_order_idx" ON "payload"."galleries_rels" USING btree ("order");
  CREATE INDEX "galleries_rels_parent_idx" ON "payload"."galleries_rels" USING btree ("parent_id");
  CREATE INDEX "galleries_rels_path_idx" ON "payload"."galleries_rels" USING btree ("path");
  CREATE INDEX "galleries_rels_users_id_idx" ON "payload"."galleries_rels" USING btree ("users_id");
  CREATE INDEX "gallery_revisions_photos_order_idx" ON "payload"."gallery_revisions_photos" USING btree ("_order");
  CREATE INDEX "gallery_revisions_photos_parent_id_idx" ON "payload"."gallery_revisions_photos" USING btree ("_parent_id");
  CREATE INDEX "gallery_revisions_photos_asset_idx" ON "payload"."gallery_revisions_photos" USING btree ("asset_id");
  CREATE INDEX "gallery_revisions_assets_order_idx" ON "payload"."gallery_revisions_assets" USING btree ("_order");
  CREATE INDEX "gallery_revisions_assets_parent_id_idx" ON "payload"."gallery_revisions_assets" USING btree ("_parent_id");
  CREATE INDEX "gallery_revisions_assets_asset_idx" ON "payload"."gallery_revisions_assets" USING btree ("asset_id");
  CREATE INDEX "gallery_revisions_entity_idx" ON "payload"."gallery_revisions" USING btree ("entity_id");
  CREATE INDEX "gallery_revisions_event_idx" ON "payload"."gallery_revisions" USING btree ("event_id");
  CREATE INDEX "gallery_revisions_updated_at_idx" ON "payload"."gallery_revisions" USING btree ("updated_at");
  CREATE INDEX "gallery_revisions_created_at_idx" ON "payload"."gallery_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_6_idx" ON "payload"."gallery_revisions" USING btree ("entity_id","number");
  CREATE UNIQUE INDEX "partners_slug_idx" ON "payload"."partners" USING btree ("slug");
  CREATE INDEX "partners_created_by_idx" ON "payload"."partners" USING btree ("created_by_id");
  CREATE INDEX "partners_owner_idx" ON "payload"."partners" USING btree ("owner_id");
  CREATE INDEX "partners_working_revision_idx" ON "payload"."partners" USING btree ("working_revision_id");
  CREATE INDEX "partners_public_revision_idx" ON "payload"."partners" USING btree ("public_revision_id");
  CREATE INDEX "partners_updated_at_idx" ON "payload"."partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "payload"."partners" USING btree ("created_at");
  CREATE INDEX "partners_rels_order_idx" ON "payload"."partners_rels" USING btree ("order");
  CREATE INDEX "partners_rels_parent_idx" ON "payload"."partners_rels" USING btree ("parent_id");
  CREATE INDEX "partners_rels_path_idx" ON "payload"."partners_rels" USING btree ("path");
  CREATE INDEX "partners_rels_users_id_idx" ON "payload"."partners_rels" USING btree ("users_id");
  CREATE INDEX "partner_revisions_assets_order_idx" ON "payload"."partner_revisions_assets" USING btree ("_order");
  CREATE INDEX "partner_revisions_assets_parent_id_idx" ON "payload"."partner_revisions_assets" USING btree ("_parent_id");
  CREATE INDEX "partner_revisions_assets_asset_idx" ON "payload"."partner_revisions_assets" USING btree ("asset_id");
  CREATE INDEX "partner_revisions_entity_idx" ON "payload"."partner_revisions" USING btree ("entity_id");
  CREATE INDEX "partner_revisions_logo_idx" ON "payload"."partner_revisions" USING btree ("logo_id");
  CREATE INDEX "partner_revisions_updated_at_idx" ON "payload"."partner_revisions" USING btree ("updated_at");
  CREATE INDEX "partner_revisions_created_at_idx" ON "payload"."partner_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_7_idx" ON "payload"."partner_revisions" USING btree ("entity_id","number");
  CREATE UNIQUE INDEX "achievements_slug_idx" ON "payload"."achievements" USING btree ("slug");
  CREATE INDEX "achievements_created_by_idx" ON "payload"."achievements" USING btree ("created_by_id");
  CREATE INDEX "achievements_owner_idx" ON "payload"."achievements" USING btree ("owner_id");
  CREATE INDEX "achievements_working_revision_idx" ON "payload"."achievements" USING btree ("working_revision_id");
  CREATE INDEX "achievements_public_revision_idx" ON "payload"."achievements" USING btree ("public_revision_id");
  CREATE INDEX "achievements_updated_at_idx" ON "payload"."achievements" USING btree ("updated_at");
  CREATE INDEX "achievements_created_at_idx" ON "payload"."achievements" USING btree ("created_at");
  CREATE INDEX "achievements_rels_order_idx" ON "payload"."achievements_rels" USING btree ("order");
  CREATE INDEX "achievements_rels_parent_idx" ON "payload"."achievements_rels" USING btree ("parent_id");
  CREATE INDEX "achievements_rels_path_idx" ON "payload"."achievements_rels" USING btree ("path");
  CREATE INDEX "achievements_rels_users_id_idx" ON "payload"."achievements_rels" USING btree ("users_id");
  CREATE INDEX "achievement_revisions_assets_order_idx" ON "payload"."achievement_revisions_assets" USING btree ("_order");
  CREATE INDEX "achievement_revisions_assets_parent_id_idx" ON "payload"."achievement_revisions_assets" USING btree ("_parent_id");
  CREATE INDEX "achievement_revisions_assets_asset_idx" ON "payload"."achievement_revisions_assets" USING btree ("asset_id");
  CREATE INDEX "achievement_revisions_entity_idx" ON "payload"."achievement_revisions" USING btree ("entity_id");
  CREATE INDEX "achievement_revisions_documentation_idx" ON "payload"."achievement_revisions" USING btree ("documentation_id");
  CREATE INDEX "achievement_revisions_updated_at_idx" ON "payload"."achievement_revisions" USING btree ("updated_at");
  CREATE INDEX "achievement_revisions_created_at_idx" ON "payload"."achievement_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_8_idx" ON "payload"."achievement_revisions" USING btree ("entity_id","number");
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "payload"."galleries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "payload"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "payload"."achievements"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "organization_reviews_gallery_idx" ON "payload"."organization_reviews" USING btree ("gallery_id");
  CREATE INDEX "organization_reviews_partner_idx" ON "payload"."organization_reviews" USING btree ("partner_id");
  CREATE INDEX "organization_reviews_achievement_idx" ON "payload"."organization_reviews" USING btree ("achievement_id");`)
  await db.execute(sql`CREATE UNIQUE INDEX gallery_one_working ON payload.gallery_revisions(entity_id) WHERE state IN ('draft','revision_required','in_review');
    CREATE UNIQUE INDEX partner_one_working ON payload.partner_revisions(entity_id) WHERE state IN ('draft','revision_required','in_review');
    CREATE UNIQUE INDEX achievement_one_working ON payload.achievement_revisions(entity_id) WHERE state IN ('draft','revision_required','in_review');
    REVOKE UPDATE,DELETE,TRUNCATE ON payload.partner_logo_permissions FROM gibei_runtime;
    REVOKE ALL ON payload.partner_logo_permissions FROM anon,authenticated,PUBLIC;`);

}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.galleries) OR EXISTS(SELECT 1 FROM payload.partners) OR EXISTS(SELECT 1 FROM payload.achievements) OR EXISTS(SELECT 1 FROM payload.partner_logo_permissions) THEN RAISE EXCEPTION 'P1 history must be preserved'; END IF; END $$;`);

  await db.execute(sql`
   ALTER TABLE "payload"."partner_logo_permissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."galleries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."galleries_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."gallery_revisions_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."gallery_revisions_assets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."gallery_revisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partners_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partner_revisions_assets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."partner_revisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."achievements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."achievements_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."achievement_revisions_assets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."achievement_revisions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."partner_logo_permissions" CASCADE;
  DROP TABLE "payload"."galleries" CASCADE;
  DROP TABLE "payload"."galleries_rels" CASCADE;
  DROP TABLE "payload"."gallery_revisions_photos" CASCADE;
  DROP TABLE "payload"."gallery_revisions_assets" CASCADE;
  DROP TABLE "payload"."gallery_revisions" CASCADE;
  DROP TABLE "payload"."partners" CASCADE;
  DROP TABLE "payload"."partners_rels" CASCADE;
  DROP TABLE "payload"."partner_revisions_assets" CASCADE;
  DROP TABLE "payload"."partner_revisions" CASCADE;
  DROP TABLE "payload"."achievements" CASCADE;
  DROP TABLE "payload"."achievements_rels" CASCADE;
  DROP TABLE "payload"."achievement_revisions_assets" CASCADE;
  DROP TABLE "payload"."achievement_revisions" CASCADE;
  ALTER TABLE "payload"."organization_reviews" DROP CONSTRAINT "organization_reviews_gallery_id_galleries_id_fk";

  ALTER TABLE "payload"."organization_reviews" DROP CONSTRAINT "organization_reviews_partner_id_partners_id_fk";

  ALTER TABLE "payload"."organization_reviews" DROP CONSTRAINT "organization_reviews_achievement_id_achievements_id_fk";

  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_reviews_kind";
  CREATE TYPE "payload"."enum_organization_reviews_kind" AS ENUM('periods', 'divisions', 'members', 'research', 'events', 'recruitment');
  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_reviews_kind" USING "kind"::"payload"."enum_organization_reviews_kind";
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_audit_kind";
  CREATE TYPE "payload"."enum_organization_audit_kind" AS ENUM('periods', 'divisions', 'members', 'research', 'events', 'recruitment');
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_audit_kind" USING "kind"::"payload"."enum_organization_audit_kind";
  DROP INDEX "payload"."organization_reviews_gallery_idx";
  DROP INDEX "payload"."organization_reviews_partner_idx";
  DROP INDEX "payload"."organization_reviews_achievement_idx";
  ALTER TABLE "payload"."organization_reviews" DROP COLUMN "gallery_id";
  ALTER TABLE "payload"."organization_reviews" DROP COLUMN "partner_id";
  ALTER TABLE "payload"."organization_reviews" DROP COLUMN "achievement_id";
  DROP TYPE "payload"."enum_gallery_revisions_state";
  DROP TYPE "payload"."enum_partner_revisions_state";
  DROP TYPE "payload"."enum_achievement_revisions_state";`)
}
