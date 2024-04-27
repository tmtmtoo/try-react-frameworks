import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const selectLatestUserProfileByEmailQuery = `-- name: SelectLatestUserProfileByEmail :one
select
    users_profile.user_id,
    users_email_registration.email,
    users_profile.name
from users_profile
inner join users_email_registration on users_profile.user_id = users_email_registration.user_id
left join users_delete on users_profile.user_id = users_delete.user_id
where
    users_delete.id is null
    and users_email_registration.email = $1
order by users_profile.created_at desc, users_email_registration.created_at desc
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
    from organizations_profile
    group by organization_id
),

latest_organizations_profiles as (
    select organizations_profile.id, organizations_profile.organization_id, organizations_profile.name, organizations_profile.created_at from organizations_profile
    inner join latest
        on
            organizations_profile.organization_id = latest.organization_id
            and organizations_profile.created_at = latest.created_at
)

select distinct on (assign.belong_id)
    latest_organizations_profiles.organization_id as organization_id,
    latest_organizations_profiles.name as organization_name,
    roles.name as role_name,
    roles.example as authority_example
from belong
inner join
    latest_organizations_profiles
    on belong.organization_id = latest_organizations_profiles.organization_id
inner join assign on belong.id = assign.belong_id
inner join roles on assign.role_name = roles.name
where
    belong.user_id = $1
    and belong.id not in (
        select belong_id from belong_dismiss
    )
    and latest_organizations_profiles.organization_id not in (
        select organization_id from organizations_delete
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

export const insertUserEmailRegistrationQuery = `-- name: InsertUserEmailRegistration :exec
insert into users_email_registration (id, user_id, email) values ($1, $2, $3)`;

export interface InsertUserEmailRegistrationArgs {
    id: string;
    userId: string;
    email: string;
}

export async function insertUserEmailRegistration(
    client: Client,
    args: InsertUserEmailRegistrationArgs,
): Promise<void> {
    await client.query({
        text: insertUserEmailRegistrationQuery,
        values: [args.id, args.userId, args.email],
        rowMode: "array",
    });
}

export const insertUserProfileQuery = `-- name: InsertUserProfile :exec
insert into users_profile (id, user_id, name) values ($1, $2, $3)`;

export interface InsertUserProfileArgs {
    id: string;
    userId: string;
    name: string | null;
}

export async function insertUserProfile(
    client: Client,
    args: InsertUserProfileArgs,
): Promise<void> {
    await client.query({
        text: insertUserProfileQuery,
        values: [args.id, args.userId, args.name],
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
insert into organizations_profile (id, organization_id, name) values ($1, $2, $3)`;

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
