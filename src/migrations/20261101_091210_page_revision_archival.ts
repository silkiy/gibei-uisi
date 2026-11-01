import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_page_audit_action" ADD VALUE 'revision_archived' BEFORE 'publication_withdrawn';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM payload.page_audit WHERE action='revision_archived') THEN RAISE EXCEPTION 'Page archival history must be preserved'; END IF; END $$;`);
  await db.execute(sql`
   ALTER TABLE "payload"."page_audit" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "payload"."enum_page_audit_action";
  CREATE TYPE "payload"."enum_page_audit_action" AS ENUM('draft_created', 'draft_saved', 'ownership_changed', 'submitted', 'submission_withdrawn', 'revision_requested', 'published', 'revision_created', 'publication_withdrawn');
  ALTER TABLE "payload"."page_audit" ALTER COLUMN "action" SET DATA TYPE "payload"."enum_page_audit_action" USING "action"::"payload"."enum_page_audit_action";`)
}
