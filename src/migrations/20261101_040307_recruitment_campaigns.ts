import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_recruitment_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  ALTER TYPE "payload"."enum_organization_reviews_kind" ADD VALUE 'recruitment';
  ALTER TYPE "payload"."enum_organization_audit_kind" ADD VALUE 'recruitment';
  CREATE TABLE "payload"."recruitment_state_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor_id" numeric NOT NULL,
    "version" numeric NOT NULL,
    "before" jsonb NOT NULL,
    "after" jsonb NOT NULL,
    "correlation_id" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."recruitment_periods" (
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

  CREATE TABLE "payload"."recruitment_periods_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."recruitment_revisions_positions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "division_id" integer,
    "requirements" varchar
  );

  CREATE TABLE "payload"."recruitment_revisions_selection_stages" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "description" varchar
  );

  CREATE TABLE "payload"."recruitment_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "entity_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "state" "payload"."enum_recruitment_revisions_state" NOT NULL,
    "title" varchar,
    "description" varchar,
    "period_id" integer,
    "opens_at" varchar,
    "closes_at" varchar,
    "registration_u_r_l" varchar,
    "registration_confirmed" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."recruitment_state" (
    "id" serial PRIMARY KEY NOT NULL,
    "enabled_campaign_id" integer,
    "version" numeric,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "payload"."organization_reviews" ADD COLUMN "recruitment_id" integer;
  ALTER TABLE "payload"."recruitment_periods" ADD CONSTRAINT "recruitment_periods_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_periods" ADD CONSTRAINT "recruitment_periods_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_periods" ADD CONSTRAINT "recruitment_periods_working_revision_id_recruitment_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."recruitment_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_periods" ADD CONSTRAINT "recruitment_periods_public_revision_id_recruitment_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."recruitment_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_periods_rels" ADD CONSTRAINT "recruitment_periods_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."recruitment_periods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_periods_rels" ADD CONSTRAINT "recruitment_periods_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_revisions_positions" ADD CONSTRAINT "recruitment_revisions_positions_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "payload"."divisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_revisions_positions" ADD CONSTRAINT "recruitment_revisions_positions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."recruitment_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_revisions_selection_stages" ADD CONSTRAINT "recruitment_revisions_selection_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."recruitment_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_revisions" ADD CONSTRAINT "recruitment_revisions_entity_id_recruitment_periods_id_fk" FOREIGN KEY ("entity_id") REFERENCES "payload"."recruitment_periods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_revisions" ADD CONSTRAINT "recruitment_revisions_period_id_organizational_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "payload"."organizational_periods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."recruitment_state" ADD CONSTRAINT "recruitment_state_enabled_campaign_id_recruitment_periods_id_fk" FOREIGN KEY ("enabled_campaign_id") REFERENCES "payload"."recruitment_periods"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "recruitment_state_audit_version_idx" ON "payload"."recruitment_state_audit" USING btree ("version");
  CREATE INDEX "recruitment_state_audit_updated_at_idx" ON "payload"."recruitment_state_audit" USING btree ("updated_at");
  CREATE INDEX "recruitment_state_audit_created_at_idx" ON "payload"."recruitment_state_audit" USING btree ("created_at");
  CREATE UNIQUE INDEX "recruitment_periods_slug_idx" ON "payload"."recruitment_periods" USING btree ("slug");
  CREATE INDEX "recruitment_periods_created_by_idx" ON "payload"."recruitment_periods" USING btree ("created_by_id");
  CREATE INDEX "recruitment_periods_owner_idx" ON "payload"."recruitment_periods" USING btree ("owner_id");
  CREATE INDEX "recruitment_periods_working_revision_idx" ON "payload"."recruitment_periods" USING btree ("working_revision_id");
  CREATE INDEX "recruitment_periods_public_revision_idx" ON "payload"."recruitment_periods" USING btree ("public_revision_id");
  CREATE INDEX "recruitment_periods_updated_at_idx" ON "payload"."recruitment_periods" USING btree ("updated_at");
  CREATE INDEX "recruitment_periods_created_at_idx" ON "payload"."recruitment_periods" USING btree ("created_at");
  CREATE INDEX "recruitment_periods_rels_order_idx" ON "payload"."recruitment_periods_rels" USING btree ("order");
  CREATE INDEX "recruitment_periods_rels_parent_idx" ON "payload"."recruitment_periods_rels" USING btree ("parent_id");
  CREATE INDEX "recruitment_periods_rels_path_idx" ON "payload"."recruitment_periods_rels" USING btree ("path");
  CREATE INDEX "recruitment_periods_rels_users_id_idx" ON "payload"."recruitment_periods_rels" USING btree ("users_id");
  CREATE INDEX "recruitment_revisions_positions_order_idx" ON "payload"."recruitment_revisions_positions" USING btree ("_order");
  CREATE INDEX "recruitment_revisions_positions_parent_id_idx" ON "payload"."recruitment_revisions_positions" USING btree ("_parent_id");
  CREATE INDEX "recruitment_revisions_positions_division_idx" ON "payload"."recruitment_revisions_positions" USING btree ("division_id");
  CREATE INDEX "recruitment_revisions_selection_stages_order_idx" ON "payload"."recruitment_revisions_selection_stages" USING btree ("_order");
  CREATE INDEX "recruitment_revisions_selection_stages_parent_id_idx" ON "payload"."recruitment_revisions_selection_stages" USING btree ("_parent_id");
  CREATE INDEX "recruitment_revisions_entity_idx" ON "payload"."recruitment_revisions" USING btree ("entity_id");
  CREATE INDEX "recruitment_revisions_period_idx" ON "payload"."recruitment_revisions" USING btree ("period_id");
  CREATE INDEX "recruitment_revisions_updated_at_idx" ON "payload"."recruitment_revisions" USING btree ("updated_at");
  CREATE INDEX "recruitment_revisions_created_at_idx" ON "payload"."recruitment_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "entity_number_5_idx" ON "payload"."recruitment_revisions" USING btree ("entity_id","number");
  CREATE INDEX "recruitment_state_enabled_campaign_idx" ON "payload"."recruitment_state" USING btree ("enabled_campaign_id");
  ALTER TABLE "payload"."organization_reviews" ADD CONSTRAINT "organization_reviews_recruitment_id_recruitment_periods_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "payload"."recruitment_periods"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "organization_reviews_recruitment_idx" ON "payload"."organization_reviews" USING btree ("recruitment_id");`)
  await db.execute(sql`CREATE UNIQUE INDEX recruitment_one_working ON payload.recruitment_revisions(entity_id) WHERE state IN ('draft','revision_required','in_review');
    CREATE UNIQUE INDEX recruitment_single_state ON payload.recruitment_state ((true));
    REVOKE UPDATE,DELETE,TRUNCATE ON payload.recruitment_state_audit FROM gibei_runtime;
    REVOKE ALL ON payload.recruitment_state_audit FROM anon,authenticated,PUBLIC;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.recruitment_periods) OR EXISTS(SELECT 1 FROM payload.recruitment_state_audit) OR EXISTS(SELECT 1 FROM payload.organization_reviews WHERE kind='recruitment') OR EXISTS(SELECT 1 FROM payload.organization_audit WHERE kind='recruitment') THEN RAISE EXCEPTION 'Recruitment history must be preserved'; END IF; END $$;`);
  await db.execute(sql`
   ALTER TABLE "payload"."recruitment_state_audit" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."recruitment_periods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."recruitment_periods_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."recruitment_revisions_positions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."recruitment_revisions_selection_stages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."recruitment_revisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."recruitment_state" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."recruitment_state_audit" CASCADE;
  DROP TABLE "payload"."recruitment_periods" CASCADE;
  DROP TABLE "payload"."recruitment_periods_rels" CASCADE;
  DROP TABLE "payload"."recruitment_revisions_positions" CASCADE;
  DROP TABLE "payload"."recruitment_revisions_selection_stages" CASCADE;
  DROP TABLE "payload"."recruitment_revisions" CASCADE;
  DROP TABLE "payload"."recruitment_state" CASCADE;
  ALTER TABLE "payload"."organization_reviews" DROP CONSTRAINT IF EXISTS "organization_reviews_recruitment_id_recruitment_periods_id_fk";

  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_reviews_kind";
  CREATE TYPE "payload"."enum_organization_reviews_kind" AS ENUM('periods', 'divisions', 'members', 'research', 'events');
  ALTER TABLE "payload"."organization_reviews" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_reviews_kind" USING "kind"::"payload"."enum_organization_reviews_kind";
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "payload"."enum_organization_audit_kind";
  CREATE TYPE "payload"."enum_organization_audit_kind" AS ENUM('periods', 'divisions', 'members', 'research', 'events');
  ALTER TABLE "payload"."organization_audit" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_organization_audit_kind" USING "kind"::"payload"."enum_organization_audit_kind";
  DROP INDEX IF EXISTS "payload"."organization_reviews_recruitment_idx";
  ALTER TABLE "payload"."organization_reviews" DROP COLUMN "recruitment_id";
  DROP TYPE "payload"."enum_recruitment_revisions_state";`)
}
