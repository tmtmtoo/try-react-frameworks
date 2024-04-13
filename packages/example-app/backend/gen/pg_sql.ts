import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const selectLatestUserProfileByEmailQuery = `-- name: SelectLatestUserProfileByEmail :one
select
    user_profile.user_id,
    user_email_registration.email,
    user_profile.name
from user_profile
inner join user_email_registration on user_profile.user_id = user_email_registration.user_id
left join user_delete on user_profile.user_id = user_delete.user_id
where
    user_delete.id is null
    and user_email_registration.email = $1
order by user_profile.created_at desc, user_email_registration.created_at desc
limit 1`;

export interface SelectLatestUserProfileByEmailArgs {
    email: string;
}

export interface SelectLatestUserProfileByEmailRow {
    userId: string;
    email: string;
    name: string | null;
}

export async function selectLatestUserProfileByEmail(client: Client, args: SelectLatestUserProfileByEmailArgs): Promise<SelectLatestUserProfileByEmailRow | null> {
    const result = await client.query({
        text: selectLatestUserProfileByEmailQuery,
        values: [args.email],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        email: row[1],
        name: row[2]
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

export async function selectBelongingOrganizationByUserId(client: Client, args: SelectBelongingOrganizationByUserIdArgs): Promise<SelectBelongingOrganizationByUserIdRow[]> {
    const result = await client.query({
        text: selectBelongingOrganizationByUserIdQuery,
        values: [args.userId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            organizationId: row[0],
            organizationName: row[1],
            roleName: row[2],
            authorityExample: row[3]
        };
    });
}

export const insertUserQuery = `-- name: InsertUser :exec
insert into users (id) values ($1)`;

export interface InsertUserArgs {
    id: string;
}

export async function insertUser(client: Client, args: InsertUserArgs): Promise<void> {
    await client.query({
        text: insertUserQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const insertUserEmailRegistrationQuery = `-- name: InsertUserEmailRegistration :exec
insert into user_email_registration (id, user_id, email) values ($1, $2, $3)`;

export interface InsertUserEmailRegistrationArgs {
    id: string;
    userId: string;
    email: string;
}

export async function insertUserEmailRegistration(client: Client, args: InsertUserEmailRegistrationArgs): Promise<void> {
    await client.query({
        text: insertUserEmailRegistrationQuery,
        values: [args.id, args.userId, args.email],
        rowMode: "array"
    });
}

export const insertUserProfileQuery = `-- name: InsertUserProfile :exec
insert into user_profile (id, user_id, name) values ($1, $2, $3)`;

export interface InsertUserProfileArgs {
    id: string;
    userId: string;
    name: string | null;
}

export async function insertUserProfile(client: Client, args: InsertUserProfileArgs): Promise<void> {
    await client.query({
        text: insertUserProfileQuery,
        values: [args.id, args.userId, args.name],
        rowMode: "array"
    });
}

export const insertOrgaizationQuery = `-- name: InsertOrgaization :exec
insert into organizations (id) values ($1)`;

export interface InsertOrgaizationArgs {
    id: string;
}

export async function insertOrgaization(client: Client, args: InsertOrgaizationArgs): Promise<void> {
    await client.query({
        text: insertOrgaizationQuery,
        values: [args.id],
        rowMode: "array"
    });
}

export const insertOrganizationProfileQuery = `-- name: InsertOrganizationProfile :exec
insert into organization_profile (id, organization_id, name) values ($1, $2, $3)`;

export interface InsertOrganizationProfileArgs {
    id: string;
    organizationId: string;
    name: string;
}

export async function insertOrganizationProfile(client: Client, args: InsertOrganizationProfileArgs): Promise<void> {
    await client.query({
        text: insertOrganizationProfileQuery,
        values: [args.id, args.organizationId, args.name],
        rowMode: "array"
    });
}

export const insertBelongQuery = `-- name: InsertBelong :exec
insert into belong (id, user_id, organization_id) values ($1, $2, $3)`;

export interface InsertBelongArgs {
    id: string;
    userId: string;
    organizationId: string;
}

export async function insertBelong(client: Client, args: InsertBelongArgs): Promise<void> {
    await client.query({
        text: insertBelongQuery,
        values: [args.id, args.userId, args.organizationId],
        rowMode: "array"
    });
}

export const insertAssignQuery = `-- name: InsertAssign :exec
insert into assign (id, role_name, belong_id) values ($1, $2, $3)`;

export interface InsertAssignArgs {
    id: string;
    roleName: string;
    belongId: string;
}

export async function insertAssign(client: Client, args: InsertAssignArgs): Promise<void> {
    await client.query({
        text: insertAssignQuery,
        values: [args.id, args.roleName, args.belongId],
        rowMode: "array"
    });
}

export const selectUserWithSpecifiedOrganizationQuery = `-- name: SelectUserWithSpecifiedOrganization :one
with found_user as (
    select
        users.id as user_id,
        user_email_registration.email as user_email,
        user_profile.name as user_name
    from users
    inner join user_email_registration on users.id = user_email_registration.user_id
    inner join user_profile on users.id = user_profile.user_id
    left join user_delete on users.id = user_delete.user_id
    where
        user_delete.id is null
        and users.id = $1
    order by user_profile.created_at desc, user_email_registration.created_at desc
    limit 1
),

found_organization as (
    select
        organizations.id as organization_id,
        organization_profile.name as organization_name
    from organizations
    inner join organization_profile on organizations.id = organization_profile.organization_id
    left join organization_delete on organizations.id = organization_delete.organization_id
    where
        organization_delete.id is null
        and organizations.id = $2
    order by organization_profile.created_at desc
    limit 1
)

select
    found_user.user_id,
    found_user.user_email,
    found_user.user_name,
    found_organization.organization_id,
    found_organization.organization_name,
    roles.name as role_name,
    roles.example as authority_example
from belong
inner join found_user on belong.user_id = found_user.user_id
inner join found_organization on belong.organization_id = found_organization.organization_id
inner join assign on belong.id = assign.belong_id
inner join roles on assign.role_name = roles.name
left join dismiss on belong.id = dismiss.belong_id
where dismiss.id is null
order by assign.created_at desc
limit 1`;

export interface SelectUserWithSpecifiedOrganizationArgs {
    userId: string;
    organizationId: string;
}

export interface SelectUserWithSpecifiedOrganizationRow {
    userId: string;
    userEmail: string;
    userName: string | null;
    organizationId: string;
    organizationName: string;
    roleName: string;
    authorityExample: boolean;
}

export async function selectUserWithSpecifiedOrganization(client: Client, args: SelectUserWithSpecifiedOrganizationArgs): Promise<SelectUserWithSpecifiedOrganizationRow | null> {
    const result = await client.query({
        text: selectUserWithSpecifiedOrganizationQuery,
        values: [args.userId, args.organizationId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        userEmail: row[1],
        userName: row[2],
        organizationId: row[3],
        organizationName: row[4],
        roleName: row[5],
        authorityExample: row[6]
    };
}

export const selectUserQuery = `-- name: SelectUser :one
select
    users.id,
    user_email_registration.email,
    user_profile.name
from users
inner join user_email_registration on users.id = user_email_registration.user_id
inner join user_profile on users.id = user_profile.user_id
left join user_delete on users.id = user_delete.user_id
where user_delete.id is null and users.id = $1
order by user_email_registration.created_at desc, user_profile.created_at desc
limit 1`;

export interface SelectUserArgs {
    id: string;
}

export interface SelectUserRow {
    id: string;
    email: string;
    name: string | null;
}

export async function selectUser(client: Client, args: SelectUserArgs): Promise<SelectUserRow | null> {
    const result = await client.query({
        text: selectUserQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        email: row[1],
        name: row[2]
    };
}

export const selectBelongingOrganizationsQuery = `-- name: SelectBelongingOrganizations :many
select
    belong.organization_id,
    (
        select organization_profile.name as organization_name
        from organization_profile
        where organization_profile.organization_id = belong.organization_id
        order by organization_profile.created_at desc
        limit 1
    ),
    (
        select roles.name as role_name
        from assign
        inner join roles on assign.role_name = roles.name
        where assign.belong_id = belong.id
        order by assign.created_at desc
        limit 1
    ),
    (
        select roles.example as authority_example
        from assign
        inner join roles on assign.role_name = roles.name
        where assign.belong_id = belong.id
        order by assign.created_at desc
        limit 1
    )
from belong
left join dismiss on belong.id = dismiss.belong_id
left join organization_delete on belong.organization_id = organization_delete.organization_id
where dismiss.id is null and organization_delete.id is null and belong.user_id = $1`;

export interface SelectBelongingOrganizationsArgs {
    userId: string;
}

export interface SelectBelongingOrganizationsRow {
    organizationId: string;
    organizationName: string;
    roleName: string;
    authorityExample: boolean;
}

export async function selectBelongingOrganizations(client: Client, args: SelectBelongingOrganizationsArgs): Promise<SelectBelongingOrganizationsRow[]> {
    const result = await client.query({
        text: selectBelongingOrganizationsQuery,
        values: [args.userId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            organizationId: row[0],
            organizationName: row[1],
            roleName: row[2],
            authorityExample: row[3]
        };
    });
}

export const selectBelongingOrganizations2Query = `-- name: SelectBelongingOrganizations2 :many
with belonging_organizations as (
    select
        belong.id as belong_id,
        belong.user_id,
        belong.organization_id
    from belong
    left join dismiss on belong.id = dismiss.belong_id
    left join organization_delete on belong.organization_id = organization_delete.organization_id
    where dismiss.id is null and organization_delete.id is null and belong.user_id = $1
),

latest_organization_profiles as (
    select
        organization_profile.organization_id,
        organization_profile.name as organization_name,
        max(organization_profile.created_at) as created_at
    from organization_profile
    inner join belonging_organizations
        on organization_profile.organization_id = belonging_organizations.organization_id
    group by organization_profile.organization_id
),

latest_organization_role_assign as (
    select
        assign.belong_id,
        roles.name as role_name,
        roles.example as authority_example,
        max(assign.created_at) as created_at
    from assign
    inner join belonging_organizations on assign.belong_id = belonging_organizations.belong_id
    inner join roles on assign.role_name = roles.name
    group by assign.belong_id
)

select
    belonging_organizations.organization_id,
    latest_organization_profiles.organization_name,
    latest_organization_role_assign.role_name,
    latest_organization_role_assign.authority_example
from belonging_organizations
inner join latest_organization_profiles
    on belonging_organizations.organization_id = latest_organization_profiles.organization_id
inner join latest_organization_role_assign
    on belonging_organizations.belong_id = latest_organization_role_assign.belong_id`;

export interface SelectBelongingOrganizations2Args {
    userId: string;
}

export interface SelectBelongingOrganizations2Row {
    organizationId: string;
    organizationName: string;
    roleName: string;
    authorityExample: boolean;
}

export async function selectBelongingOrganizations2(client: Client, args: SelectBelongingOrganizations2Args): Promise<SelectBelongingOrganizations2Row[]> {
    const result = await client.query({
        text: selectBelongingOrganizations2Query,
        values: [args.userId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            organizationId: row[0],
            organizationName: row[1],
            roleName: row[2],
            authorityExample: row[3]
        };
    });
}

export const selectOrganizationUsersQuery = `-- name: SelectOrganizationUsers :many
select
    belong.user_id,
    belong.organization_id,
    (
        select roles.name
        from assign
        inner join roles on assign.role_name = roles.name
        where assign.belong_id = belong.id
        order by assign.created_at desc
        limit 1
    ) as role_name,
    (
        select user_email_registration.email
        from user_email_registration
        where user_email_registration.user_id = belong.user_id
        order by user_email_registration.created_at desc
        limit 1
    ) as email,
    (
        select user_profile.name
        from user_profile
        where user_profile.user_id = belong.user_id
        limit 1
    ) as user_name
from belong
left join organization_delete on belong.organization_id = organization_delete.organization_id
left join dismiss on belong.id = dismiss.belong_id
where organization_delete.id is null and dismiss.id is null and belong.organization_id = $1`;

export interface SelectOrganizationUsersArgs {
    organizationId: string;
}

export interface SelectOrganizationUsersRow {
    userId: string;
    organizationId: string;
    roleName: string;
    email: string;
    userName: string | null;
}

export async function selectOrganizationUsers(client: Client, args: SelectOrganizationUsersArgs): Promise<SelectOrganizationUsersRow[]> {
    const result = await client.query({
        text: selectOrganizationUsersQuery,
        values: [args.organizationId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            userId: row[0],
            organizationId: row[1],
            roleName: row[2],
            email: row[3],
            userName: row[4]
        };
    });
}

export const selectOrganizationUsers2Query = `-- name: SelectOrganizationUsers2 :many
with selected_belong as (
    select
        belong.id,
        belong.user_id,
        belong.organization_id
    from belong
    left join organization_delete on belong.organization_id = organization_delete.organization_id
    left join dismiss on belong.id = dismiss.belong_id
    where organization_delete.id is null and dismiss.id is null and belong.organization_id = $1
),

latest_organization_role_assign as (
    select
        assign.belong_id,
        roles.name as role_name,
        max(assign.created_at) as created_at
    from assign
    inner join selected_belong on assign.belong_id = selected_belong.id
    inner join roles on assign.role_name = roles.name
    group by assign.belong_id
),

latest_user_email_registration as (
    select
        user_email_registration.user_id,
        user_email_registration.email,
        max(user_email_registration.created_at) as created_at
    from user_email_registration
    inner join selected_belong on user_email_registration.user_id = selected_belong.user_id
    group by user_email_registration.user_id
),

latest_user_profile as (
    select
        user_profile.user_id,
        user_profile.name as user_name
    from user_profile
    inner join selected_belong on user_profile.user_id = selected_belong.user_id
    group by user_profile.user_id
)

select
    selected_belong.user_id,
    selected_belong.organization_id,
    latest_organization_role_assign.role_name,
    latest_user_email_registration.email,
    latest_user_profile.user_name
from selected_belong
inner join
    latest_organization_role_assign
    on selected_belong.id = latest_organization_role_assign.belong_id
inner join
    latest_user_email_registration
    on selected_belong.user_id = latest_user_email_registration.user_id
inner join latest_user_profile on selected_belong.user_id = latest_user_profile.user_id`;

export interface SelectOrganizationUsers2Args {
    organizationId: string;
}

export interface SelectOrganizationUsers2Row {
    userId: string;
    organizationId: string;
    roleName: string;
    email: string;
    userName: string | null;
}

export async function selectOrganizationUsers2(client: Client, args: SelectOrganizationUsers2Args): Promise<SelectOrganizationUsers2Row[]> {
    const result = await client.query({
        text: selectOrganizationUsers2Query,
        values: [args.organizationId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            userId: row[0],
            organizationId: row[1],
            roleName: row[2],
            email: row[3],
            userName: row[4]
        };
    });
}

