import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const selectLatestUserProfileByEmailQuery = `-- name: SelectLatestUserProfileByEmail :one
select
    user_profile.user_id,
    user_profile.email,
    user_profile.name
from user_profile
left join user_delete on user_profile.user_id = user_delete.user_id
where
    user_delete.id is null
    and user_profile.email = $1
order by user_profile.created_at desc
limit 1`;

export interface SelectLatestUserProfileByEmailArgs {
    email: string;
}

export interface SelectLatestUserProfileByEmailRow {
    userId: string;
    email: string;
    name: string | null;
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
        userId: row[0],
        email: row[1],
        name: row[2],
    };
}

export const selectBelongingOrganizationByUserIdQuery = `-- name: SelectBelongingOrganizationByUserId :many
with latest as (
    select
        organization_id,
        max(created_at) as created_at
    from organization_profile
    group by organization_id
),

latest_organization_profiles as (
    select organization_profile.id, organization_profile.organization_id, organization_profile.name, organization_profile.created_at from organization_profile
    inner join latest
        on
            organization_profile.organization_id = latest.organization_id
            and organization_profile.created_at = latest.created_at
)

select distinct on (assign.belong_id)
    latest_organization_profiles.organization_id as organization_id,
    latest_organization_profiles.name as organization_name,
    roles.name as role_name,
    roles.example as authority_example
from belong
inner join
    latest_organization_profiles
    on belong.organization_id = latest_organization_profiles.organization_id
inner join assign on belong.id = assign.belong_id
inner join roles on assign.role_name = roles.name
where
    belong.user_id = $1
    and belong.id not in (
        select belong_id from dismiss
    )
    and latest_organization_profiles.organization_id not in (
        select organization_id from organization_delete
    )
order by assign.belong_id asc, assign.created_at desc, belong.created_at asc`;

export interface SelectBelongingOrganizationByUserIdArgs {
    userId: string;
}

export interface SelectBelongingOrganizationByUserIdRow {
    organizationId: string;
    organizationName: string;
    roleName: string;
    authorityExample: boolean;
}

export async function selectBelongingOrganizationByUserId(
    client: Client,
    args: SelectBelongingOrganizationByUserIdArgs,
): Promise<SelectBelongingOrganizationByUserIdRow[]> {
    const result = await client.query({
        text: selectBelongingOrganizationByUserIdQuery,
        values: [args.userId],
        rowMode: "array",
    });
    return result.rows.map((row) => {
        return {
            organizationId: row[0],
            organizationName: row[1],
            roleName: row[2],
            authorityExample: row[3],
        };
    });
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

export const insertUserProfileQuery = `-- name: InsertUserProfile :exec
insert into user_profile (id, user_id, email, name) values ($1, $2, $3, $4)`;

export interface InsertUserProfileArgs {
    id: string;
    userId: string;
    email: string;
    name: string | null;
}

export async function insertUserProfile(
    client: Client,
    args: InsertUserProfileArgs,
): Promise<void> {
    await client.query({
        text: insertUserProfileQuery,
        values: [args.id, args.userId, args.email, args.name],
        rowMode: "array",
    });
}

export const insertOrgaizationQuery = `-- name: InsertOrgaization :exec
insert into organizations (id) values ($1)`;

export interface InsertOrgaizationArgs {
    id: string;
}

export async function insertOrgaization(
    client: Client,
    args: InsertOrgaizationArgs,
): Promise<void> {
    await client.query({
        text: insertOrgaizationQuery,
        values: [args.id],
        rowMode: "array",
    });
}

export const insertOrganizationProfileQuery = `-- name: InsertOrganizationProfile :exec
insert into organization_profile (id, organization_id, name) values ($1, $2, $3)`;

export interface InsertOrganizationProfileArgs {
    id: string;
    organizationId: string;
    name: string;
}

export async function insertOrganizationProfile(
    client: Client,
    args: InsertOrganizationProfileArgs,
): Promise<void> {
    await client.query({
        text: insertOrganizationProfileQuery,
        values: [args.id, args.organizationId, args.name],
        rowMode: "array",
    });
}

export const insertBelongQuery = `-- name: InsertBelong :exec
insert into belong (id, user_id, organization_id) values ($1, $2, $3)`;

export interface InsertBelongArgs {
    id: string;
    userId: string;
    organizationId: string;
}

export async function insertBelong(
    client: Client,
    args: InsertBelongArgs,
): Promise<void> {
    await client.query({
        text: insertBelongQuery,
        values: [args.id, args.userId, args.organizationId],
        rowMode: "array",
    });
}

export const insertAssignQuery = `-- name: InsertAssign :exec
insert into assign (id, role_name, belong_id) values ($1, $2, $3)`;

export interface InsertAssignArgs {
    id: string;
    roleName: string;
    belongId: string;
}

export async function insertAssign(
    client: Client,
    args: InsertAssignArgs,
): Promise<void> {
    await client.query({
        text: insertAssignQuery,
        values: [args.id, args.roleName, args.belongId],
        rowMode: "array",
    });
}
