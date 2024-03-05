set dotenv-load

default:
  @just --list

compose-up:
  @docker compose up -d

compose-down:
  @docker compose down

db-psql:
  @psql "$DATABASE_URL"

db-migrate:
  @psqldef -U "$DATABASE_USER" -h localhost -p 5432 dev < schema.sql
  @psql "$DATABASE_URL" -f ./seed.sql

db-codegen:
  @sqlc generate

sql-fix target=".":
  @sqlfluff fix {{target}}

sql-lint target=".":
  @sqlfluff lint {{target}}

ts-lint target=".":
  @biome lint {{target}}

ts-fix target=".":
  -@biome format --write {{target}}
  @biome check --apply {{target}}
