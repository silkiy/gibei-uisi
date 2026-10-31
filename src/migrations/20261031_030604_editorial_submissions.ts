import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_content_reviews_status" AS ENUM('pending', 'approved', 'changes_requested', 'cancelled');
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'submitted';
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'submission_withdrawn';
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'revision_requested';
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'published';
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'revision_created';
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'revision_archived';
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'publication_withdrawn';
  ALTER TYPE "payload"."enum_editorial_audit_action" ADD VALUE 'draft_deleted';
  CREATE TABLE "payload"."article_revisions_assets" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "alt" varchar,
    "caption" varchar,
    "file_version" varchar,
    "checksum" varchar
  );

  CREATE TABLE "payload"."content_reviews" (
    "id" serial PRIMARY KEY NOT NULL,
    "article_id" integer NOT NULL,
    "revision_id" integer NOT NULL,
    "edit_version" numeric NOT NULL,
    "manifest_digest" varchar NOT NULL,
    "manifest" jsonb NOT NULL,
    "status" "payload"."enum_content_reviews_status" NOT NULL,
    "submitted_by" numeric NOT NULL,
    "reviewer_id" numeric,
    "note" varchar,
    "resolved_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."article_revisions_assets" ADD CONSTRAINT "article_revisions_assets_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."article_revisions_assets" ADD CONSTRAINT "article_revisions_assets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."article_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."content_reviews" ADD CONSTRAINT "content_reviews_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."content_reviews" ADD CONSTRAINT "content_reviews_revision_id_article_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "payload"."article_revisions"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "article_revisions_assets_order_idx" ON "payload"."article_revisions_assets" USING btree ("_order");
  CREATE INDEX "article_revisions_assets_parent_id_idx" ON "payload"."article_revisions_assets" USING btree ("_parent_id");
  CREATE INDEX "article_revisions_assets_asset_idx" ON "payload"."article_revisions_assets" USING btree ("asset_id");
  CREATE INDEX "content_reviews_article_idx" ON "payload"."content_reviews" USING btree ("article_id");
  CREATE INDEX "content_reviews_revision_idx" ON "payload"."content_reviews" USING btree ("revision_id");
  CREATE INDEX "content_reviews_updated_at_idx" ON "payload"."content_reviews" USING btree ("updated_at");
  CREATE INDEX "content_reviews_created_at_idx" ON "payload"."content_reviews" USING btree ("created_at");`)
  await db.execute(sql`CREATE UNIQUE INDEX content_reviews_one_pending ON payload.content_reviews (article_id) WHERE status = 'pending';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Preserve append-only audit enum values; refuse rollback once review/reference data exists.
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM payload.content_reviews) OR EXISTS (SELECT 1 FROM payload.article_revisions_assets) THEN
      RAISE EXCEPTION 'Editorial submission data must be retained';
    END IF;
  END $$;
  DROP TABLE payload.content_reviews;
  DROP TABLE payload.article_revisions_assets;
  DROP TYPE payload.enum_content_reviews_status;`)
}
