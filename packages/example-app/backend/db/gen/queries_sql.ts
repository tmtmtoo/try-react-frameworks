import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
  query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const insertUserQuery = `-- name: InsertUser :exec
insert into users (id) values ($1)`;

export interface InsertUserArgs {
  id: string;
}

export async function insertUser(
  client: Client,
  args: InsertUserArgs,
): Promise<void> {
  await client.query({
    text: insertUserQuery,
    values: [args.id],
    rowMode: "array",
  });
}

export const insertUserProileQuery = `-- name: InsertUserProile :exec
insert into user_profile (id, user_id, email, name) values ($1, $2, $3, $4)`;

export interface InsertUserProileArgs {
  id: string;
  userId: string;
  email: string;
  name: string | null;
}

export async function insertUserProile(
  client: Client,
  args: InsertUserProileArgs,
): Promise<void> {
  await client.query({
    text: insertUserProileQuery,
    values: [args.id, args.userId, args.email, args.name],
    rowMode: "array",
  });
}

export const selectLatestUserProfileByEmailQuery = `-- name: SelectLatestUserProfileByEmail :one
select id, user_id, email, name, created_at from user_profile
where email = $1
order by created_at desc
limit 1`;

export interface SelectLatestUserProfileByEmailArgs {
  email: string;
}

export interface SelectLatestUserProfileByEmailRow {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export async function selectLatestUserProfileByEmail(
  client: Client,
  args: SelectLatestUserProfileByEmailArgs,
): Promise<SelectLatestUserProfileByEmailRow | null> {
  const result = await client.query({
    text: selectLatestUserProfileByEmailQuery,
    values: [args.email],
    rowMode: "array",
  });
  if (result.rows.length !== 1) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row[0],
    userId: row[1],
    email: row[2],
    name: row[3],
    createdAt: row[4],
  };
}

export const deleteUserQuery = `-- name: DeleteUser :exec
insert into user_delete (id, user_id) values ($1, $2)`;

export interface DeleteUserArgs {
  id: string;
  userId: string;
}

export async function deleteUser(
  client: Client,
  args: DeleteUserArgs,
): Promise<void> {
  await client.query({
    text: deleteUserQuery,
    values: [args.id, args.userId],
    rowMode: "array",
  });
}

export const deleteUserProfileQuery = `-- name: DeleteUserProfile :exec
delete from user_profile where id = $1`;

export interface DeleteUserProfileArgs {
  id: string;
}

export async function deleteUserProfile(
  client: Client,
  args: DeleteUserProfileArgs,
): Promise<void> {
  await client.query({
    text: deleteUserProfileQuery,
    values: [args.id],
    rowMode: "array",
  });
}
