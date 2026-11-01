import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_member_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  ALTER TYPE "payload"."enum_organization_reviews_kind" ADD VALUE 'members';
  ALTER TYPE "payload"."enum_organization_audit_kind" ADD VALUE 'members';
  CREATE TABLE "payload"."members" (
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

  CREATE TABLE "payload"."members_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."member_revisions_assets" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "file_version" varchar,
    "checksum" varchar
  );

  CREATE TABLE "payload"."member_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_member_revisions_state" NOT NULL,
    "name" varchar,
    "position" varchar,
    "period_id" integer,
    "division_id" integer,
    "photo_id" integer,
    "display_order" numeric DEFAULT 0,
    "example" boolean DEFAULT true,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."organization_reviews" ADD COLUMN "member_id" integer;
  ALTER TABLE "payload"."members" ADD CONSTRAINT "members_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."members" ADD CONSTRAINT "members_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."members" ADD CONSTRAINT "members_working_revision_id_member_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."member_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."members" ADD CONSTRAINT "members_public_revision_id_member_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."member_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."members_rels" ADD CONSTRAINT "members_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."members_rels" ADD CONSTRAINT "members_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."member_revisions_assets" ADD CONSTRAINT "member_revisions_assets_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."member_revisions_assets" ADD CONSTRAINT "member_revisions_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."member_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."member_revisions" ADD CONSTRAINT "member_revisions_entity_id_members_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."member_revisions" ADD CONSTRAINT "member_revisions_period_id_organizational_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "payload"."organizational_periods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."member_revisions" ADD CONSTRAINT "member_revisions_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "payload"."divisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."member_revisions" ADD CONSTRAINT "member_revisions_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "members_slug_idx" ON "payload"."members" USING btree ("slug");
  CREATE INDEX "members_created_by_idx" ON "payload"."members" USING btree ("created_by_id");
  CREATE INDEX "members_owner_idx" ON "payload"."members" USING btree ("owner_id");
  CREATE INDEX "members_working_revision_idx" ON "payload"."members" USING btree ("working_revision_id");
  CREATE INDEX "members_public_revision_idx" ON "payload"."members" USING btree ("public_revision_id");
  CREATE INDEX "members_updated_at_idx" ON "payload"."members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "payload"."members" USING btree ("created_at");
  CREATE INDEX "members_rels_order_idx" ON "payload"."members_rels" USING btree ("order");
  CREATE INDEX "members_rels_parent_idx" ON "payload"."members_rels" USING btree ("parent_id");
  CREATE INDEX "members_rels_path_idx" ON "payload"."members_rels" USING btree ("path");
  CREATE INDEX "members_rels_users_id_idx" ON "payload"."members_rels" USING btree ("users_id");
  CREATE INDEX "member_revisions_assets_order_idx" ON "payload"."member_revisions_assets" USING btree ("_order");
  CREATE INDEX "member_revisions_assets_parent_id_idx" ON "payload"."member_revisions_assets" USING btree ("_parent_id");
  CREATE INDEX "member_revisions_assets_asset_idx" ON "payload"."member_revisions_assets" USING btree ("asset_id");
  CREATE INDEX "member_revisions_entity_idx" ON "payload"."member_revisions" USING btree ("entity_id");
  CREATE INDEX "member_revisions_period_idx" ON "payload"."member_revisions" USING btree ("period_id");
  CREATE INDEX "member_revisions_division_idx" ON "payload"."member_revisions" USING btree ("division_id");
  CREATE INDEX "member_revisions_photo_idx" ON "payload"."member_revisions" USING btree ("photo_id");
  CREATE INDEX "member_revisions_updated_at_idx" ON "payload"."member_revisions" USING btree ("updated_at");
  CREATE INDEX "member_revisions_created_at_idx" ON "payload"."member_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_2_idx" ON "payload"."member_revisions" USING btree ("entity_id","number");
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "payload"."members"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "organization_reviews_member_idx" ON "payload"."organization_reviews" USING btree ("member_id");`)
  await db.execute(sql`CREATE UNIQUE INDEX member_revisions_one_working ON payload.member_revisions(entity_id) WHERE state IN ('draft','in_review','revision_required');`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.members) OR EXISTS(SELECT 1 FROM payload.organization_reviews WHERE kind='members') OR EXISTS(SELECT 1 FROM payload.organization_audit WHERE kind='members') THEN RAISE EXCEPTION 'Member history must be preserved'; END IF; END $$;`);
  await db.execute(sql`
   ALTER TABLE "payload"."members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."members_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."member_revisions_assets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."member_revisions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."members" CASCADE;
  DROP TABLE "payload"."members_rels" CASCADE;
  DROP TABLE "payload"."member_revisions_assets" CASCADE;
  DROP TABLE "payload"."member_revisions" CASCADE;
  ALTER TABLE "payload"."organization_reviews" DROP CONSTRAINT IF EXISTS "organization_reviews_member_id_members_id_fk";

  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_reviews_kind";
  CREATE TYPE "payload"."enum_organization_reviews_kind" AS ENUM('periods', 'divisions');
  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_reviews_kind" USING "kind"::"payload"."enum_organization_reviews_kind";
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_audit_kind";
  CREATE TYPE "payload"."enum_organization_audit_kind" AS ENUM('periods', 'divisions');
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_audit_kind" USING "kind"::"payload"."enum_organization_audit_kind";
  DROP INDEX IF EXISTS "payload"."organization_reviews_member_idx";
  ALTER TABLE "payload"."organization_reviews" DROP COLUMN "member_id";
  DROP TYPE "payload"."enum_member_revisions_state";`)
}
