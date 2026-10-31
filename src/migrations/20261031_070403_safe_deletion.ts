import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."asset_config_references" (
    "id" serial PRIMARY KEY NOT NULL,
    "asset_id" integer NOT NULL,
    "config_key" varchar NOT NULL,
    "version" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."articles" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."asset_config_references" ADD CONSTRAINT "asset_config_references_asset_id_media_id_fk" FOREIGN KEY ("asset_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "asset_config_references_asset_idx" ON "payload"."asset_config_references" USING btree ("asset_id");
  CREATE INDEX "asset_config_references_updated_at_idx" ON "payload"."asset_config_references" USING btree ("updated_at");
  CREATE INDEX "asset_config_references_created_at_idx" ON "payload"."asset_config_references" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN IF EXISTS (SELECT 1 FROM payload.asset_config_references) OR EXISTS (SELECT 1 FROM payload.articles WHERE deleted_at IS NOT NULL) THEN
     RAISE EXCEPTION 'Retention and deletion history must be preserved';
   END IF; END $$;
   DROP TABLE "payload"."asset_config_references" CASCADE;
  ALTER TABLE "payload"."articles" DROP COLUMN "deleted_at";`)
}
