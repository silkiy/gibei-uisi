import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_research_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_event_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_event_revisions_location_type" AS ENUM('offline', 'online');
  CREATE TYPE "payload"."enum_event_revisions_registration_status" AS ENUM('closed', 'open');
  ALTER TYPE "payload"."enum_organization_reviews_kind" ADD VALUE 'research';
  ALTER TYPE "payload"."enum_organization_reviews_kind" ADD VALUE 'events';
  ALTER TYPE "payload"."enum_organization_audit_kind" ADD VALUE 'research';
  ALTER TYPE "payload"."enum_organization_audit_kind" ADD VALUE 'events';
  CREATE TABLE "payload"."research_categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."research_publications" (
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

  CREATE TABLE "payload"."research_publications_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."research_revisions_sources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "url" varchar
  );

  CREATE TABLE "payload"."research_revisions_assets" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "file_version" varchar,
    "checksum" varchar
  );

  CREATE TABLE "payload"."research_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_research_revisions_state" NOT NULL,
    "title" varchar,
    "excerpt" varchar,
    "body" jsonb,
    "public_author" varchar,
    "category_id" integer,
    "analysis_date" varchar,
    "cover_id" integer,
    "pdf_id" integer,
    "additional_note" varchar,
    "base_disclaimer" varchar DEFAULT 'Publikasi ini untuk edukasi dan informasi, bukan rekomendasi membeli atau menjual efek. Analisis mencerminkan kondisi pada tanggal yang dicantumkan. Keputusan investasi dan risikonya menjadi tanggung jawab masing-masing.',
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."events" (
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

  CREATE TABLE "payload"."events_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."event_revisions_assets" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "file_version" varchar,
    "checksum" varchar
  );

  CREATE TABLE "payload"."event_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_event_revisions_state" NOT NULL,
    "title" varchar,
    "description" varchar,
    "poster_id" integer,
    "start_at" varchar,
    "end_at" varchar,
    "location_type" "payload"."enum_event_revisions_location_type" DEFAULT 'offline',
    "location" varchar,
    "online_u_r_l" varchar,
    "organizer" varchar,
    "cancelled" boolean DEFAULT false,
    "cancellation_note" varchar,
    "registration_status" "payload"."enum_event_revisions_registration_status" DEFAULT 'closed',
    "registration_u_r_l" varchar,
    "registration_confirmed" boolean DEFAULT false,
    "registration_opens_at" varchar,
    "registration_closes_at" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."organization_reviews" ADD COLUMN "research_id" integer;
  ALTER TABLE "payload"."organization_reviews" ADD COLUMN "event_id" integer;
  ALTER TABLE "payload"."research_publications" ADD CONSTRAINT "research_publications_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_publications" ADD CONSTRAINT "research_publications_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_publications" ADD CONSTRAINT "research_publications_working_revision_id_research_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."research_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_publications" ADD CONSTRAINT "research_publications_public_revision_id_research_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."research_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_publications_rels" ADD CONSTRAINT "research_publications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."research_publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."research_publications_rels" ADD CONSTRAINT "research_publications_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."research_revisions_sources" ADD CONSTRAINT "research_revisions_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."research_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."research_revisions_assets" ADD CONSTRAINT "research_revisions_assets_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_revisions_assets" ADD CONSTRAINT "research_revisions_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."research_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."research_revisions" ADD CONSTRAINT "research_revisions_entity_id_research_publications_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."research_publications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_revisions" ADD CONSTRAINT "research_revisions_category_id_research_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "payload"."research_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_revisions" ADD CONSTRAINT "research_revisions_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."research_revisions" ADD CONSTRAINT "research_revisions_pdf_id_media_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."events" ADD CONSTRAINT "events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."events" ADD CONSTRAINT "events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."events" ADD CONSTRAINT "events_working_revision_id_event_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."event_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."events" ADD CONSTRAINT "events_public_revision_id_event_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."event_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."events_rels" ADD CONSTRAINT "events_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."event_revisions_assets" ADD CONSTRAINT "event_revisions_assets_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."event_revisions_assets" ADD CONSTRAINT "event_revisions_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."event_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."event_revisions" ADD CONSTRAINT "event_revisions_entity_id_events_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."event_revisions" ADD CONSTRAINT "event_revisions_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "research_categories_slug_idx" ON "payload"."research_categories" USING btree ("slug");
  CREATE INDEX "research_categories_updated_at_idx" ON "payload"."research_categories" USING btree ("updated_at");
  CREATE INDEX "research_categories_created_at_idx" ON "payload"."research_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "research_publications_slug_idx" ON "payload"."research_publications" USING btree ("slug");
  CREATE INDEX "research_publications_created_by_idx" ON "payload"."research_publications" USING btree ("created_by_id");
  CREATE INDEX "research_publications_owner_idx" ON "payload"."research_publications" USING btree ("owner_id");
  CREATE INDEX "research_publications_working_revision_idx" ON "payload"."research_publications" USING btree ("working_revision_id");
  CREATE INDEX "research_publications_public_revision_idx" ON "payload"."research_publications" USING btree ("public_revision_id");
  CREATE INDEX "research_publications_updated_at_idx" ON "payload"."research_publications" USING btree ("updated_at");
  CREATE INDEX "research_publications_created_at_idx" ON "payload"."research_publications" USING btree ("created_at");
  CREATE INDEX "research_publications_rels_order_idx" ON "payload"."research_publications_rels" USING btree ("order");
  CREATE INDEX "research_publications_rels_parent_idx" ON "payload"."research_publications_rels" USING btree ("parent_id");
  CREATE INDEX "research_publications_rels_path_idx" ON "payload"."research_publications_rels" USING btree ("path");
  CREATE INDEX "research_publications_rels_users_id_idx" ON "payload"."research_publications_rels" USING btree ("users_id");
  CREATE INDEX "research_revisions_sources_order_idx" ON "payload"."research_revisions_sources" USING btree ("_order");
  CREATE INDEX "research_revisions_sources_parent_id_idx" ON "payload"."research_revisions_sources" USING btree ("_parent_id");
  CREATE INDEX "research_revisions_assets_order_idx" ON "payload"."research_revisions_assets" USING btree ("_order");
  CREATE INDEX "research_revisions_assets_parent_id_idx" ON "payload"."research_revisions_assets" USING btree ("_parent_id");
  CREATE INDEX "research_revisions_assets_asset_idx" ON "payload"."research_revisions_assets" USING btree ("asset_id");
  CREATE INDEX "research_revisions_entity_idx" ON "payload"."research_revisions" USING btree ("entity_id");
  CREATE INDEX "research_revisions_category_idx" ON "payload"."research_revisions" USING btree ("category_id");
  CREATE INDEX "research_revisions_cover_idx" ON "payload"."research_revisions" USING btree ("cover_id");
  CREATE INDEX "research_revisions_pdf_idx" ON "payload"."research_revisions" USING btree ("pdf_id");
  CREATE INDEX "research_revisions_updated_at_idx" ON "payload"."research_revisions" USING btree ("updated_at");
  CREATE INDEX "research_revisions_created_at_idx" ON "payload"."research_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_3_idx" ON "payload"."research_revisions" USING btree ("entity_id","number");
  CREATE UNIQUE INDEX "events_slug_idx" ON "payload"."events" USING btree ("slug");
  CREATE INDEX "events_created_by_idx" ON "payload"."events" USING btree ("created_by_id");
  CREATE INDEX "events_owner_idx" ON "payload"."events" USING btree ("owner_id");
  CREATE INDEX "events_working_revision_idx" ON "payload"."events" USING btree ("working_revision_id");
  CREATE INDEX "events_public_revision_idx" ON "payload"."events" USING btree ("public_revision_id");
  CREATE INDEX "events_updated_at_idx" ON "payload"."events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "payload"."events" USING btree ("created_at");
  CREATE INDEX "events_rels_order_idx" ON "payload"."events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "payload"."events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "payload"."events_rels" USING btree ("path");
  CREATE INDEX "events_rels_users_id_idx" ON "payload"."events_rels" USING btree ("users_id");
  CREATE INDEX "event_revisions_assets_order_idx" ON "payload"."event_revisions_assets" USING btree ("_order");
  CREATE INDEX "event_revisions_assets_parent_id_idx" ON "payload"."event_revisions_assets" USING btree ("_parent_id");
  CREATE INDEX "event_revisions_assets_asset_idx" ON "payload"."event_revisions_assets" USING btree ("asset_id");
  CREATE INDEX "event_revisions_entity_idx" ON "payload"."event_revisions" USING btree ("entity_id");
  CREATE INDEX "event_revisions_poster_idx" ON "payload"."event_revisions" USING btree ("poster_id");
  CREATE INDEX "event_revisions_updated_at_idx" ON "payload"."event_revisions" USING btree ("updated_at");
  CREATE INDEX "event_revisions_created_at_idx" ON "payload"."event_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_4_idx" ON "payload"."event_revisions" USING btree ("entity_id","number");
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_research_id_research_publications_id_fk" FOREIGN KEY ("research_id") REFERENCES "payload"."research_publications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "payload"."events"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "organization_reviews_research_idx" ON "payload"."organization_reviews" USING btree ("research_id");
  CREATE INDEX "organization_reviews_event_idx" ON "payload"."organization_reviews" USING btree ("event_id");`)
  await db.execute(sql`CREATE UNIQUE INDEX research_revisions_one_working ON payload.research_revisions(entity_id) WHERE state IN ('draft','in_review','revision_required');
    CREATE UNIQUE INDEX event_revisions_one_working ON payload.event_revisions(entity_id) WHERE state IN ('draft','in_review','revision_required');
    INSERT INTO payload.research_categories(name,slug) VALUES ('Capital Market Explained','capital-market-explained'),('Equity Snapshot','equity-snapshot'),('Insight Talks','insight-talks'),('Stock Watchlist','stock-watchlist');`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.research_publications) OR EXISTS(SELECT 1 FROM payload.events) OR EXISTS(SELECT 1 FROM payload.organization_audit WHERE kind IN ('research','events')) THEN RAISE EXCEPTION 'Publication history must be preserved'; END IF; END $$;`);
  await db.execute(sql`
   ALTER TABLE "payload"."research_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."research_publications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."research_publications_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."research_revisions_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."research_revisions_assets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."research_revisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."event_revisions_assets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."event_revisions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."research_categories" CASCADE;
  DROP TABLE "payload"."research_publications" CASCADE;
  DROP TABLE "payload"."research_publications_rels" CASCADE;
  DROP TABLE "payload"."research_revisions_sources" CASCADE;
  DROP TABLE "payload"."research_revisions_assets" CASCADE;
  DROP TABLE "payload"."research_revisions" CASCADE;
  DROP TABLE "payload"."events" CASCADE;
  DROP TABLE "payload"."events_rels" CASCADE;
  DROP TABLE "payload"."event_revisions_assets" CASCADE;
  DROP TABLE "payload"."event_revisions" CASCADE;
  ALTER TABLE "payload"."organization_reviews" DROP CONSTRAINT IF EXISTS "organization_reviews_research_id_research_publications_id_fk";

  ALTER TABLE "payload"."organization_reviews" DROP CONSTRAINT IF EXISTS "organization_reviews_event_id_events_id_fk";

  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_reviews_kind";
  CREATE TYPE "payload"."enum_organization_reviews_kind" AS ENUM('periods', 'divisions', 'members');
  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_reviews_kind" USING "kind"::"payload"."enum_organization_reviews_kind";
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_audit_kind";
  CREATE TYPE "payload"."enum_organization_audit_kind" AS ENUM('periods', 'divisions', 'members');
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_audit_kind" USING "kind"::"payload"."enum_organization_audit_kind";
  DROP INDEX IF EXISTS "payload"."organization_reviews_research_idx";
  DROP INDEX IF EXISTS "payload"."organization_reviews_event_idx";
  ALTER TABLE "payload"."organization_reviews" DROP COLUMN "research_id";
  ALTER TABLE "payload"."organization_reviews" DROP COLUMN "event_id";
  DROP TYPE "payload"."enum_research_revisions_state";
  DROP TYPE "payload"."enum_event_revisions_state";
  DROP TYPE "payload"."enum_event_revisions_location_type";
  DROP TYPE "payload"."enum_event_revisions_registration_status";`)
}
