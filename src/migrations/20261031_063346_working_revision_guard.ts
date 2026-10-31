import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE UNIQUE INDEX article_revisions_one_working ON payload.article_revisions (article_id)
    WHERE state IN ('draft', 'in_review', 'revision_required');`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX payload.article_revisions_one_working;`);
}
