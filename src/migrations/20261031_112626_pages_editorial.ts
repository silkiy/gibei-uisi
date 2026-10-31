import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_pages_page_key" AS ENUM('homepage', 'about');
  CREATE TYPE "payload"."enum_page_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_page_reviews_status" AS ENUM('pending', 'approved', 'changes_requested', 'cancelled');
  CREATE TYPE "payload"."enum_page_audit_action" AS ENUM('draft_created', 'draft_saved', 'ownership_changed', 'submitted', 'submission_withdrawn', 'revision_requested', 'published', 'revision_created', 'publication_withdrawn');
  CREATE TABLE "payload"."pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "page_key" "payload"."enum_pages_page_key" NOT NULL,
    "created_by_id" integer NOT NULL,
    "owner_id" integer NOT NULL,
    "working_revision_id" integer,
    "public_revision_id" integer,
    "lock_version" numeric DEFAULT 0 NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."pages_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."page_revisions_blocks_hero" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "summary" varchar NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "payload"."page_revisions_blocks_profile" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "description" varchar NOT NULL,
    "history" varchar,
    "vision" varchar,
    "mission" varchar,
    "block_name" varchar
  );

  CREATE TABLE "payload"."page_revisions_blocks_program" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "description" varchar NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "payload"."page_revisions_blocks_cta" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar NOT NULL,
    "description" varchar,
    "label" varchar NOT NULL,
    "url" varchar NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "payload"."page_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "page_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "state" "payload"."enum_page_revisions_state" NOT NULL,
    "edit_version" numeric NOT NULL,
    "title" varchar,
    "seo_title" varchar,
    "seo_description" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."page_reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "page_id" integer NOT NULL,
    "revision_id" integer NOT NULL,
    "edit_version" numeric NOT NULL,
    "manifest" jsonb NOT NULL,
    "manifest_digest" varchar NOT NULL,
    "status" "payload"."enum_page_reviews_status" NOT NULL,
    "submitted_by" numeric NOT NULL,
    "reviewer_id" numeric,
    "note" varchar,
    "resolved_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."page_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "page_id" integer NOT NULL,
    "revision_id" numeric NOT NULL,
    "actor_id" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "action" "payload"."enum_page_audit_action" NOT NULL,
    "before" jsonb,
    "after" jsonb NOT NULL,
    "correlation_id" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_working_revision_id_page_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."page_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_public_revision_id_page_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."page_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_rels" ADD CONSTRAINT "pages_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."page_revisions_blocks_hero" ADD CONSTRAINT "page_revisions_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."page_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."page_revisions_blocks_profile" ADD CONSTRAINT "page_revisions_blocks_profile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."page_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."page_revisions_blocks_program" ADD CONSTRAINT "page_revisions_blocks_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."page_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."page_revisions_blocks_cta" ADD CONSTRAINT "page_revisions_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."page_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."page_revisions" ADD CONSTRAINT "page_revisions_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."page_reviews" ADD CONSTRAINT "page_reviews_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."page_reviews" ADD CONSTRAINT "page_reviews_revision_id_page_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "payload"."page_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."page_audit" ADD CONSTRAINT "page_audit_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_page_key_idx" ON "payload"."pages" USING btree ("page_key");
  CREATE INDEX "pages_created_by_idx" ON "payload"."pages" USING btree ("created_by_id");
  CREATE INDEX "pages_owner_idx" ON "payload"."pages" USING btree ("owner_id");
  CREATE INDEX "pages_working_revision_idx" ON "payload"."pages" USING btree ("working_revision_id");
  CREATE INDEX "pages_public_revision_idx" ON "payload"."pages" USING btree ("public_revision_id");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "pages_rels_order_idx" ON "payload"."pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "payload"."pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "payload"."pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_users_id_idx" ON "payload"."pages_rels" USING btree ("users_id");
  CREATE INDEX "page_revisions_blocks_hero_order_idx" ON "payload"."page_revisions_blocks_hero" USING btree ("_order");
  CREATE INDEX "page_revisions_blocks_hero_parent_id_idx" ON "payload"."page_revisions_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "page_revisions_blocks_hero_path_idx" ON "payload"."page_revisions_blocks_hero" USING btree ("_path");
  CREATE INDEX "page_revisions_blocks_profile_order_idx" ON "payload"."page_revisions_blocks_profile" USING btree ("_order");
  CREATE INDEX "page_revisions_blocks_profile_parent_id_idx" ON "payload"."page_revisions_blocks_profile" USING btree ("_parent_id");
  CREATE INDEX "page_revisions_blocks_profile_path_idx" ON "payload"."page_revisions_blocks_profile" USING btree ("_path");
  CREATE INDEX "page_revisions_blocks_program_order_idx" ON "payload"."page_revisions_blocks_program" USING btree ("_order");
  CREATE INDEX "page_revisions_blocks_program_parent_id_idx" ON "payload"."page_revisions_blocks_program" USING btree ("_parent_id");
  CREATE INDEX "page_revisions_blocks_program_path_idx" ON "payload"."page_revisions_blocks_program" USING btree ("_path");
  CREATE INDEX "page_revisions_blocks_cta_order_idx" ON "payload"."page_revisions_blocks_cta" USING btree ("_order");
  CREATE INDEX "page_revisions_blocks_cta_parent_id_idx" ON "payload"."page_revisions_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "page_revisions_blocks_cta_path_idx" ON "payload"."page_revisions_blocks_cta" USING btree ("_path");
  CREATE INDEX "page_revisions_page_idx" ON "payload"."page_revisions" USING btree ("page_id");
  CREATE INDEX "page_revisions_updated_at_idx" ON "payload"."page_revisions" USING btree ("updated_at");
  CREATE INDEX "page_revisions_created_at_idx" ON "payload"."page_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "page_number_idx" ON "payload"."page_revisions" USING btree ("page_id","number");
  CREATE INDEX "page_reviews_page_idx" ON "payload"."page_reviews" USING btree ("page_id");
  CREATE INDEX "page_reviews_revision_idx" ON "payload"."page_reviews" USING btree ("revision_id");
  CREATE INDEX "page_reviews_updated_at_idx" ON "payload"."page_reviews" USING btree ("updated_at");
  CREATE INDEX "page_reviews_created_at_idx" ON "payload"."page_reviews" USING btree ("created_at");
  CREATE INDEX "page_audit_page_idx" ON "payload"."page_audit" USING btree ("page_id");
  CREATE INDEX "page_audit_updated_at_idx" ON "payload"."page_audit" USING btree ("updated_at");
  CREATE INDEX "page_audit_created_at_idx" ON "payload"."page_audit" USING btree ("created_at");`)
  await db.execute(sql`CREATE UNIQUE INDEX page_reviews_one_pending ON payload.page_reviews (page_id) WHERE status = 'pending';
    CREATE UNIQUE INDEX page_revisions_one_working ON payload.page_revisions (page_id)
      WHERE state IN ('draft', 'in_review', 'revision_required');
    REVOKE UPDATE, DELETE, TRUNCATE ON payload.page_audit FROM gibei_runtime;
    REVOKE ALL ON payload.page_audit FROM anon, authenticated, PUBLIC;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM payload.pages) OR EXISTS (SELECT 1 FROM payload.page_reviews) OR EXISTS (SELECT 1 FROM payload.page_audit) THEN
      RAISE EXCEPTION 'Page history must be preserved';
    END IF;
  END $$;`)
  await db.execute(sql`
   DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."pages_rels" CASCADE;
  DROP TABLE "payload"."page_revisions_blocks_hero" CASCADE;
  DROP TABLE "payload"."page_revisions_blocks_profile" CASCADE;
  DROP TABLE "payload"."page_revisions_blocks_program" CASCADE;
  DROP TABLE "payload"."page_revisions_blocks_cta" CASCADE;
  DROP TABLE "payload"."page_revisions" CASCADE;
  DROP TABLE "payload"."page_reviews" CASCADE;
  DROP TABLE "payload"."page_audit" CASCADE;
  DROP TYPE "payload"."enum_pages_page_key";
  DROP TYPE "payload"."enum_page_revisions_state";
  DROP TYPE "payload"."enum_page_reviews_status";
  DROP TYPE "payload"."enum_page_audit_action";`)
}
