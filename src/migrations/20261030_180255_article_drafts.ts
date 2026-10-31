import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_article_revisions_state" AS ENUM('draft', 'in_review', 'revision_required', 'published', 'archived');
  CREATE TYPE "payload"."enum_editorial_audit_action" AS ENUM('draft_created', 'draft_saved', 'ownership_changed');
  CREATE TABLE "payload"."article_categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."articles" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar NOT NULL,
    "created_by_id" integer NOT NULL,
    "owner_id" integer NOT NULL,
    "working_revision_id" integer,
    "public_revision_id" integer,
    "lock_version" numeric DEFAULT 0 NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."articles_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer
  );

  CREATE TABLE "payload"."article_revisions_sources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "url" varchar
  );

  CREATE TABLE "payload"."article_revisions" (
    "id" serial PRIMARY KEY NOT NULL,
    "article_id" integer NOT NULL,
    "number" numeric NOT NULL,
    "state" "payload"."enum_article_revisions_state" NOT NULL,
    "edit_version" numeric NOT NULL,
    "title" varchar,
    "excerpt" varchar,
    "body" jsonb,
    "category_id" integer,
    "public_author" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."editorial_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor_id" numeric NOT NULL,
    "article_id" integer NOT NULL,
    "revision_id" numeric NOT NULL,
    "edit_version" numeric NOT NULL,
    "action" "payload"."enum_editorial_audit_action" NOT NULL,
    "before" jsonb,
    "after" jsonb NOT NULL,
    "correlation_id" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_working_revision_id_article_revisions_id_fk" FOREIGN KEY ("working_revision_id") REFERENCES "payload"."article_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_public_revision_id_article_revisions_id_fk" FOREIGN KEY ("public_revision_id") REFERENCES "payload"."article_revisions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_rels" ADD CONSTRAINT "articles_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."article_revisions_sources" ADD CONSTRAINT "article_revisions_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."article_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."article_revisions" ADD CONSTRAINT "article_revisions_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."article_revisions" ADD CONSTRAINT "article_revisions_category_id_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "payload"."article_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."editorial_audit" ADD CONSTRAINT "editorial_audit_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "article_categories_slug_idx" ON "payload"."article_categories" USING btree ("slug");
  CREATE INDEX "article_categories_updated_at_idx" ON "payload"."article_categories" USING btree ("updated_at");
  CREATE INDEX "article_categories_created_at_idx" ON "payload"."article_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "payload"."articles" USING btree ("slug");
  CREATE INDEX "articles_created_by_idx" ON "payload"."articles" USING btree ("created_by_id");
  CREATE INDEX "articles_owner_idx" ON "payload"."articles" USING btree ("owner_id");
  CREATE INDEX "articles_working_revision_idx" ON "payload"."articles" USING btree ("working_revision_id");
  CREATE INDEX "articles_public_revision_idx" ON "payload"."articles" USING btree ("public_revision_id");
  CREATE INDEX "articles_updated_at_idx" ON "payload"."articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "payload"."articles" USING btree ("created_at");
  CREATE INDEX "articles_rels_order_idx" ON "payload"."articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "payload"."articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "payload"."articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_users_id_idx" ON "payload"."articles_rels" USING btree ("users_id");
  CREATE INDEX "article_revisions_sources_order_idx" ON "payload"."article_revisions_sources" USING btree ("_order");
  CREATE INDEX "article_revisions_sources_parent_id_idx" ON "payload"."article_revisions_sources" USING btree ("_parent_id");
  CREATE INDEX "article_revisions_article_idx" ON "payload"."article_revisions" USING btree ("article_id");
  CREATE INDEX "article_revisions_category_idx" ON "payload"."article_revisions" USING btree ("category_id");
  CREATE INDEX "article_revisions_updated_at_idx" ON "payload"."article_revisions" USING btree ("updated_at");
  CREATE INDEX "article_revisions_created_at_idx" ON "payload"."article_revisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "article_number_idx" ON "payload"."article_revisions" USING btree ("article_id","number");
  CREATE INDEX "editorial_audit_article_idx" ON "payload"."editorial_audit" USING btree ("article_id");
  CREATE INDEX "editorial_audit_updated_at_idx" ON "payload"."editorial_audit" USING btree ("updated_at");
  CREATE INDEX "editorial_audit_created_at_idx" ON "payload"."editorial_audit" USING btree ("created_at");`)
  await db.execute(sql`REVOKE UPDATE, DELETE, TRUNCATE ON payload.editorial_audit FROM gibei_runtime;
    REVOKE ALL ON payload.editorial_audit FROM anon, authenticated, PUBLIC;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "payload"."article_categories" CASCADE;
  DROP TABLE "payload"."articles" CASCADE;
  DROP TABLE "payload"."articles_rels" CASCADE;
  DROP TABLE "payload"."article_revisions_sources" CASCADE;
  DROP TABLE "payload"."article_revisions" CASCADE;
  DROP TABLE "payload"."editorial_audit" CASCADE;
  DROP TYPE "payload"."enum_article_revisions_state";
  DROP TYPE "payload"."enum_editorial_audit_action";`)
}
