-- Infrastructure only. Payload application tables are managed by Payload migrations in T006+.
create role gibei_migrator nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
create role gibei_runtime nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
grant gibei_migrator to postgres;

create schema payload authorization gibei_migrator;
create schema gibei_meta authorization gibei_migrator;
revoke all on schema payload, gibei_meta from public, anon, authenticated, service_role;
grant usage on schema payload, gibei_meta to gibei_runtime;

alter default privileges for role gibei_migrator in schema payload
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role gibei_migrator in schema payload
  grant select, insert, update, delete on tables to gibei_runtime;
alter default privileges for role gibei_migrator in schema payload
  grant usage, select on sequences to gibei_runtime;
alter default privileges for role gibei_migrator in schema payload
  revoke execute on functions from public, anon, authenticated, service_role;

create table gibei_meta.connection_probe (
  id uuid primary key,
  marker text not null,
  created_at timestamptz not null default now()
);
alter table gibei_meta.connection_probe owner to gibei_migrator;
alter table gibei_meta.connection_probe enable row level security;
grant select, insert, update, delete on gibei_meta.connection_probe to gibei_runtime;
create policy runtime_probe on gibei_meta.connection_probe
  for all to gibei_runtime using (true) with check (true);

comment on schema payload is 'Private Payload application schema; never expose through the Data API';
comment on schema gibei_meta is 'Private infrastructure verification; contains no editorial content';
