import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."article_revisions_related" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "target_id" integer NOT NULL,
    "required" boolean DEFAULT false
  );

  ALTER TABLE "payload"."article_revisions_related" ADD CONSTRAINT "article_revisions_related_target_id_articles_id_fk" FOREIGN KEY ("target_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."article_revisions_related" ADD CONSTRAINT "article_revisions_related_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."article_revisions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "article_revisions_related_order_idx" ON "payload"."article_revisions_related" USING btree ("_order");
  CREATE INDEX "article_revisions_related_parent_id_idx" ON "payload"."article_revisions_related" USING btree ("_parent_id");
  CREATE INDEX "article_revisions_related_target_idx" ON "payload"."article_revisions_related" USING btree ("target_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN IF EXISTS (SELECT 1 FROM payload.article_revisions_related) THEN
     RAISE EXCEPTION 'Related revision data must be retained';
   END IF; END $$;
   DROP TABLE "payload"."article_revisions_related" CASCADE;`)
}
