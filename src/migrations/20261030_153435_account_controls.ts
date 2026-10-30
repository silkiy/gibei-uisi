import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_account_audit_action" AS ENUM('account_created', 'account_updated', 'password_reset');
  CREATE TABLE "payload"."account_audit" (
    "id" serial PRIMARY KEY NOT NULL,
    "actor_id" numeric NOT NULL,
    "target_id" numeric NOT NULL,
    "action" "payload"."enum_account_audit_action" NOT NULL,
    "before" jsonb,
    "after" jsonb NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "account_audit_id" integer;
  CREATE INDEX "account_audit_target_id_idx" ON "payload"."account_audit" USING btree ("target_id");
  CREATE INDEX "account_audit_updated_at_idx" ON "payload"."account_audit" USING btree ("updated_at");
  CREATE INDEX "account_audit_created_at_idx" ON "payload"."account_audit" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_account_audit_fk" FOREIGN KEY ("account_audit_id") REFERENCES "payload"."account_audit"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_account_audit_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("account_audit_id");`)
  // Private, append-only audit: runtime may append/read, never rewrite history.
  await db.execute(sql`REVOKE UPDATE, DELETE, TRUNCATE ON payload.account_audit FROM gibei_runtime;
    REVOKE ALL ON payload.account_audit FROM anon, authenticated, PUBLIC;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_account_audit_fk";

  DROP INDEX "payload"."payload_locked_documents_rels_account_audit_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "account_audit_id";
  DROP TABLE "payload"."account_audit";
  DROP TYPE "payload"."enum_account_audit_action";`)
}
