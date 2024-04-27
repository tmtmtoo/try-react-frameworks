set dotenv-load

default:
  @just --list

compose-up:
  @docker compose up -d

compose-down:
  @docker compose down

psql:
  @psql "$DATABASE_URL"

migrate-db:
  @psqldef -U "$DATABASE_USER" -h localhost -p 5432 dev < schema.sql
  @psql "$DATABASE_URL" -f ./seed.sql

codegen-db:
  @sqlc generate

fmt-sql target=".":
  @sqlfluff fix {{target}}

lint-sql target=".":
  @sqlfluff lint {{target}}

lint-ts target=".":
  @biome lint {{target}}

fmt-ts target=".":
  -@biome format --write {{target}}
  @biome check --apply {{target}}

check-ts:
  @cd ./packages/remix-app && pnpm typecheck

fmt-nix target=".":
  @nix fmt {{target}}

prepare-app:
  @pnpm install --frozen-lockfile

test: prepare-app
  # @cd ./packages/remix-app && pnpm test
  @cd ./packages/backend && pnpm test
