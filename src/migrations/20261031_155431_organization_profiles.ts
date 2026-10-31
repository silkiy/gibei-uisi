import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_period_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_divisions_slug" AS ENUM('secretary', 'treasurer', 'strategy', 'research', 'human-resource', 'partnership', 'event-organizer', 'media-communication');
  CREATE TYPE "payload"."enum_division_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_organization_reviews_kind" AS ENUM('periods', 'divisions');
  CREATE TYPE "payload"."enum_organization_reviews_status" AS ENUM('pending', 'approved', 'changes_requested', 'cancelled');
  CREATE TYPE "payload"."enum_organization_audit_kind" AS ENUM('periods', 'divisions');
  CREATE TABLE "payload"."organizational_periods" (
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "owner_id" integer NOT NULL,
    "working_revision_id" integer,
    "public_revision_id" integer,
    "lock_version" numeric DEFAULT 0 NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."organizational_periods_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."period_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_period_revisions_state" NOT NULL,
    "start_date" varchar,
    "end_date" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."divisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" "payload"."enum_divisions_slug" NOT NULL,
    "created_by_id" integer NOT NULL,
    "owner_id" integer NOT NULL,
    "working_revision_id" integer,
    "public_revision_id" integer,
    "lock_version" numeric DEFAULT 0 NOT NULL,
    "deleted_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."divisions_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."division_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_division_revisions_state" NOT NULL,
    "description" varchar,
    "work_programs" varchar,
    "display_order" numeric DEFAULT 0,
    "example" boolean DEFAULT true,
    "period_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."organization_reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "kind" "payload"."enum_organization_reviews_kind" NOT NULL,
    "entity_id" numeric NOT NULL,
    "revision_id" numeric NOT NULL,
    "period_id" integer,
    "division_id" integer,
    "edit_version" numeric NOT NULL,
    "manifest" jsonb NOT NULL,
    "manifest_digest" varchar NOT NULL,
    "status" "payload"."enum_organization_reviews_status" NOT NULL,
    "submitted_by" numeric NOT NULL,
    "reviewer_id" numeric,
    "note" varchar,
    "resolved_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."organization_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "kind" "payload"."enum_organization_audit_kind" NOT NULL,
    "entity_id" numeric NOT NULL,
    "revision_id" numeric NOT NULL,
    "actor_id" numeric NOT NULL,
    "action" varchar NOT NULL,
    "before" jsonb NOT NULL,
    "after" jsonb NOT NULL,
    "correlation_id" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."organizational_periods" ADD CONSTRAINT "organizational_periods_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organizational_periods" ADD CONSTRAINT "organizational_periods_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organizational_periods" ADD CONSTRAINT "organizational_periods_working_revision_id_period_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."period_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organizational_periods" ADD CONSTRAINT "organizational_periods_public_revision_id_period_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."period_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organizational_periods_rels" ADD CONSTRAINT "organizational_periods_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."organizational_periods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."organizational_periods_rels" ADD CONSTRAINT "organizational_periods_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."period_revisions" ADD CONSTRAINT "period_revisions_entity_id_organizational_periods_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."organizational_periods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."divisions" ADD CONSTRAINT "divisions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."divisions" ADD CONSTRAINT "divisions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."divisions" ADD CONSTRAINT "divisions_working_revision_id_division_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."division_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."divisions" ADD CONSTRAINT "divisions_public_revision_id_division_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."division_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."divisions_rels" ADD CONSTRAINT "divisions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."divisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."divisions_rels" ADD CONSTRAINT "divisions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."division_revisions" ADD CONSTRAINT "division_revisions_entity_id_divisions_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."divisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."division_revisions" ADD CONSTRAINT "division_revisions_period_id_organizational_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "payload"."organizational_periods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_period_id_organizational_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "payload"."organizational_periods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "payload"."divisions"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "organizational_periods_label_idx" ON "payload"."organizational_periods" USING btree ("label");
  CREATE INDEX "organizational_periods_created_by_idx" ON "payload"."organizational_periods" USING btree ("created_by_id");
  CREATE INDEX "organizational_periods_owner_idx" ON "payload"."organizational_periods" USING btree ("owner_id");
  CREATE INDEX "organizational_periods_working_revision_idx" ON "payload"."organizational_periods" USING btree ("working_revision_id");
  CREATE INDEX "organizational_periods_public_revision_idx" ON "payload"."organizational_periods" USING btree ("public_revision_id");
  CREATE INDEX "organizational_periods_updated_at_idx" ON "payload"."organizational_periods" USING btree ("updated_at");
  CREATE INDEX "organizational_periods_created_at_idx" ON "payload"."organizational_periods" USING btree ("created_at");
  CREATE INDEX "organizational_periods_rels_order_idx" ON "payload"."organizational_periods_rels" USING btree ("order");
  CREATE INDEX "organizational_periods_rels_parent_idx" ON "payload"."organizational_periods_rels" USING btree ("parent_id");
  CREATE INDEX "organizational_periods_rels_path_idx" ON "payload"."organizational_periods_rels" USING btree ("path");
  CREATE INDEX "organizational_periods_rels_users_id_idx" ON "payload"."organizational_periods_rels" USING btree ("users_id");
  CREATE INDEX "period_revisions_entity_idx" ON "payload"."period_revisions" USING btree ("entity_id");
  CREATE INDEX "period_revisions_updated_at_idx" ON "payload"."period_revisions" USING btree ("updated_at");
  CREATE INDEX "period_revisions_created_at_idx" ON "payload"."period_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_idx" ON "payload"."period_revisions" USING btree ("entity_id","number");
  CREATE UNIQUE INDEX "divisions_slug_idx" ON "payload"."divisions" USING btree ("slug");
  CREATE INDEX "divisions_created_by_idx" ON "payload"."divisions" USING btree ("created_by_id");
  CREATE INDEX "divisions_owner_idx" ON "payload"."divisions" USING btree ("owner_id");
  CREATE INDEX "divisions_working_revision_idx" ON "payload"."divisions" USING btree ("working_revision_id");
  CREATE INDEX "divisions_public_revision_idx" ON "payload"."divisions" USING btree ("public_revision_id");
  CREATE INDEX "divisions_updated_at_idx" ON "payload"."divisions" USING btree ("updated_at");
  CREATE INDEX "divisions_created_at_idx" ON "payload"."divisions" USING btree ("created_at");
  CREATE INDEX "divisions_rels_order_idx" ON "payload"."divisions_rels" USING btree ("order");
  CREATE INDEX "divisions_rels_parent_idx" ON "payload"."divisions_rels" USING btree ("parent_id");
  CREATE INDEX "divisions_rels_path_idx" ON "payload"."divisions_rels" USING btree ("path");
  CREATE INDEX "divisions_rels_users_id_idx" ON "payload"."divisions_rels" USING btree ("users_id");
  CREATE INDEX "division_revisions_entity_idx" ON "payload"."division_revisions" USING btree ("entity_id");
  CREATE INDEX "division_revisions_period_idx" ON "payload"."division_revisions" USING btree ("period_id");
  CREATE INDEX "division_revisions_updated_at_idx" ON "payload"."division_revisions" USING btree ("updated_at");
  CREATE INDEX "division_revisions_created_at_idx" ON "payload"."division_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_1_idx" ON "payload"."division_revisions" USING btree ("entity_id","number");
  CREATE INDEX "organization_reviews_period_idx" ON "payload"."organization_reviews" USING btree ("period_id");
  CREATE INDEX "organization_reviews_division_idx" ON "payload"."organization_reviews" USING btree ("division_id");
  CREATE INDEX "organization_reviews_updated_at_idx" ON "payload"."organization_reviews" USING btree ("updated_at");
  CREATE INDEX "organization_reviews_created_at_idx" ON "payload"."organization_reviews" USING btree ("created_at");
  CREATE INDEX "kind_entityId_revisionId_editVersion_idx" ON "payload"."organization_reviews" USING btree ("kind","entity_id","revision_id","edit_version");
  CREATE INDEX "organization_audit_updated_at_idx" ON "payload"."organization_audit" USING btree ("updated_at");
  CREATE INDEX "organization_audit_created_at_idx" ON "payload"."organization_audit" USING btree ("created_at");`)
  await db.execute(sql`CREATE UNIQUE INDEX period_revisions_one_working ON payload.period_revisions(entity_id) WHERE state IN ('draft','in_review','revision_required');
    CREATE UNIQUE INDEX division_revisions_one_working ON payload.division_revisions(entity_id) WHERE state IN ('draft','in_review','revision_required');
    CREATE UNIQUE INDEX organization_reviews_one_pending ON payload.organization_reviews(kind,entity_id) WHERE status='pending';
    REVOKE UPDATE,DELETE,TRUNCATE ON payload.organization_audit FROM gibei_runtime;
    REVOKE ALL ON payload.organization_audit FROM anon,authenticated,PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.organization_audit) OR EXISTS(SELECT 1 FROM payload.organization_reviews) THEN RAISE EXCEPTION 'Organization history must be preserved'; END IF; END $$;`);
  await db.execute(sql`
   DROP TABLE "payload"."organizational_periods" CASCADE;
  DROP TABLE "payload"."organizational_periods_rels" CASCADE;
  DROP TABLE "payload"."period_revisions" CASCADE;
  DROP TABLE "payload"."divisions" CASCADE;
  DROP TABLE "payload"."divisions_rels" CASCADE;
  DROP TABLE "payload"."division_revisions" CASCADE;
  DROP TABLE "payload"."organization_reviews" CASCADE;
  DROP TABLE "payload"."organization_audit" CASCADE;
  DROP TYPE "payload"."enum_period_revisions_state";
  DROP TYPE "payload"."enum_divisions_slug";
  DROP TYPE "payload"."enum_division_revisions_state";
  DROP TYPE "payload"."enum_organization_reviews_kind";
  DROP TYPE "payload"."enum_organization_reviews_status";
  DROP TYPE "payload"."enum_organization_audit_kind";`)
}
