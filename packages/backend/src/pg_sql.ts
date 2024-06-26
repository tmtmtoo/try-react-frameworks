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

export const selectLatestUserProfileByIdQuery = `-- name: SelectLatestUserProfileById :one
select
    users.id as user_id,
    users_email_registration.email,
    users_profile.name
from users
inner join users_email_registration on users.id = users_email_registration.user_id
inner join users_profile on users.id = users_profile.user_id
left join users_delete on users.id = users_delete.user_id
where
    users_delete.id is null
    and users.id = $1
order by users_email_registration.created_at desc, users_profile.created_at desc
limit 1`;

export interface SelectLatestUserProfileByIdArgs {
    id: string;
}

export interface SelectLatestUserProfileByIdRow {
    userId: string;
    email: string;
    name: string | null;
}

export async function selectLatestUserProfileById(client: Client, args: SelectLatestUserProfileByIdArgs): Promise<SelectLatestUserProfileByIdRow | null> {
    const result = await client.query({
        text: selectLatestUserProfileByIdQuery,
        values: [args.id],
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
    roles.manage_organization as authority_manage_organization
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
    authorityManageOrganization: boolean;
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
            authorityManageOrganization: row[3]
        };
    });
}

export const selectLatestOraganizationProfileByIdQuery = `-- name: SelectLatestOraganizationProfileById :one
select
    organizations.id as organization_id,
    organizations_profile.name
from organizations
inner join organizations_profile on organizations.id = organizations_profile.organization_id
left join organizations_delete on organizations.id = organizations_delete.organization_id
where
    organizations_delete.id is null
    and organizations.id = $1
order by organizations_profile.created_at desc
limit 1`;

export interface SelectLatestOraganizationProfileByIdArgs {
    id: string;
}

export interface SelectLatestOraganizationProfileByIdRow {
    organizationId: string;
    name: string;
}

export async function selectLatestOraganizationProfileById(client: Client, args: SelectLatestOraganizationProfileByIdArgs): Promise<SelectLatestOraganizationProfileByIdRow | null> {
    const result = await client.query({
        text: selectLatestOraganizationProfileByIdQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        organizationId: row[0],
        name: row[1]
    };
}

export const selectInvitedUnknownUserByEmailQuery = `-- name: SelectInvitedUnknownUserByEmail :many
select
    organizations_invitation.organization_id,
    organizations_invitation.invitee_user_email,
    organizations_invitation.role_name
from organizations_invitation
left join organizations_invitation_cancel
    on organizations_invitation.id = organizations_invitation_cancel.organizations_invitation_id
where
    organizations_invitation_cancel.id is null
    and organizations_invitation.invitee_user_email = $1
order by organizations_invitation.created_at asc`;

export interface SelectInvitedUnknownUserByEmailArgs {
    inviteeUserEmail: string;
}

export interface SelectInvitedUnknownUserByEmailRow {
    organizationId: string;
    inviteeUserEmail: string;
    roleName: string;
}

export async function selectInvitedUnknownUserByEmail(client: Client, args: SelectInvitedUnknownUserByEmailArgs): Promise<SelectInvitedUnknownUserByEmailRow[]> {
    const result = await client.query({
        text: selectInvitedUnknownUserByEmailQuery,
        values: [args.inviteeUserEmail],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            organizationId: row[0],
            inviteeUserEmail: row[1],
            roleName: row[2]
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
insert into users_email_registration (id, user_id, email) values ($1, $2, $3)`;

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
insert into users_profile (id, user_id, name) values ($1, $2, $3)`;

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
insert into organizations_profile (id, organization_id, name) values ($1, $2, $3)`;

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

export const insertOrganizationInvitationQuery = `-- name: InsertOrganizationInvitation :exec
insert into organizations_invitation (
    id, organization_id, role_name, invitee_user_email, inviter_user_id
) values ($1, $2, $3, $4, $5)`;

export interface InsertOrganizationInvitationArgs {
    id: string;
    organizationId: string;
    roleName: string;
    inviteeUserEmail: string;
    inviterUserId: string;
}

export async function insertOrganizationInvitation(client: Client, args: InsertOrganizationInvitationArgs): Promise<void> {
    await client.query({
        text: insertOrganizationInvitationQuery,
        values: [args.id, args.organizationId, args.roleName, args.inviteeUserEmail, args.inviterUserId],
        rowMode: "array"
    });
}

export const selectUserQuery = `-- name: SelectUser :one
select
    users.id,
    users_email_registration.email,
    users_profile.name
from users
inner join users_email_registration on users.id = users_email_registration.user_id
inner join users_profile on users.id = users_profile.user_id
left join users_delete on users.id = users_delete.user_id
where users_delete.id is null and users.id = $1
order by users_email_registration.created_at desc, users_profile.created_at desc
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
        select organizations_profile.name as organization_name
        from organizations_profile
        where organizations_profile.organization_id = belong.organization_id
        order by organizations_profile.created_at desc
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
        select roles.manage_organization as authority_manage_organization
        from assign
        inner join roles on assign.role_name = roles.name
        where assign.belong_id = belong.id
        order by assign.created_at desc
        limit 1
    )
from belong
left join belong_dismiss on belong.id = belong_dismiss.belong_id
left join organizations_delete on belong.organization_id = organizations_delete.organization_id
left join users_delete on belong.user_id = users_delete.user_id
where
    belong_dismiss.id is null
    and organizations_delete.id is null
    and users_delete.id is null
    and belong.user_id = $1
order by belong.created_at asc`;

export interface SelectBelongingOrganizationsArgs {
    userId: string;
}

export interface SelectBelongingOrganizationsRow {
    organizationId: string;
    organizationName: string;
    roleName: string;
    authorityManageOrganization: boolean;
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
            authorityManageOrganization: row[3]
        };
    });
}

export const selectOrganizationUsersQuery = `-- name: SelectOrganizationUsers :many
select
    belong.user_id,
    (
        select roles.name
        from assign
        inner join roles on assign.role_name = roles.name
        where assign.belong_id = belong.id
        order by assign.created_at desc
        limit 1
    ) as role_name,
    (
        select users_email_registration.email
        from users_email_registration
        where users_email_registration.user_id = belong.user_id
        order by users_email_registration.created_at desc
        limit 1
    ) as email,
    (
        select users_profile.name
        from users_profile
        where users_profile.user_id = belong.user_id
        order by users_profile.created_at desc
        limit 1
    ) as user_name
from belong
left join organizations_delete on belong.organization_id = organizations_delete.organization_id
left join belong_dismiss on belong.id = belong_dismiss.belong_id
left join users_delete on belong.user_id = users_delete.user_id
where
    organizations_delete.id is null
    and belong_dismiss.id is null
    and users_delete.id is null
    and belong.organization_id = $1
order by belong.created_at asc`;

export interface SelectOrganizationUsersArgs {
    organizationId: string;
}

export interface SelectOrganizationUsersRow {
    userId: string;
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
            roleName: row[1],
            email: row[2],
            userName: row[3]
        };
    });
}

export const selectSwitchedOrganizationQuery = `-- name: SelectSwitchedOrganization :one
with last_switched_organization as (
    select
        organizations_switch.organization_id,
        organizations_switch.user_id
    from organizations_switch
    where organizations_switch.user_id = $1
    order by organizations_switch.created_at desc
    limit 1
)

select
    belong.organization_id as first_belonged_organization_id,
    last_switched_organization.organization_id as last_switched_organization_id
from belong
left join
    last_switched_organization
    on belong.user_id = last_switched_organization.user_id
left join organizations_delete on belong.organization_id = organizations_delete.organization_id
left join belong_dismiss on belong.id = belong_dismiss.belong_id
left join users_delete on belong.user_id = users_delete.user_id
where
    organizations_delete.id is null
    and belong_dismiss.id is null
    and users_delete.id is null
    and belong.user_id = $1
order by belong.created_at asc
limit 1`;

export interface SelectSwitchedOrganizationArgs {
    userId: string;
}

export interface SelectSwitchedOrganizationRow {
    firstBelongedOrganizationId: string;
    lastSwitchedOrganizationId: string | null;
}

export async function selectSwitchedOrganization(client: Client, args: SelectSwitchedOrganizationArgs): Promise<SelectSwitchedOrganizationRow | null> {
    const result = await client.query({
        text: selectSwitchedOrganizationQuery,
        values: [args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        firstBelongedOrganizationId: row[0],
        lastSwitchedOrganizationId: row[1]
    };
}

export const selectInvitingUnknownUsersQuery = `-- name: SelectInvitingUnknownUsers :many
with latest_user_email as (
    select
        user_id,
        email
    from (
        select
            user_id,
            email,
            row_number() over (partition by user_id order by created_at desc) as rn
        from users_email_registration
    ) as t
    where rn = 1
)

select
    organizations_invitation.organization_id,
    organizations_invitation.role_name,
    organizations_invitation.invitee_user_email
from organizations_invitation
left join
    organizations_invitation_cancel
    on organizations_invitation.id = organizations_invitation_cancel.organizations_invitation_id
left join latest_user_email on organizations_invitation.invitee_user_email = latest_user_email.email
where
    organizations_invitation_cancel.id is null
    and latest_user_email.email is null
    and organizations_invitation.organization_id = $1
order by organizations_invitation.created_at asc`;

export interface SelectInvitingUnknownUsersArgs {
    organizationId: string;
}

export interface SelectInvitingUnknownUsersRow {
    organizationId: string;
    roleName: string;
    inviteeUserEmail: string;
}

export async function selectInvitingUnknownUsers(client: Client, args: SelectInvitingUnknownUsersArgs): Promise<SelectInvitingUnknownUsersRow[]> {
    const result = await client.query({
        text: selectInvitingUnknownUsersQuery,
        values: [args.organizationId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            organizationId: row[0],
            roleName: row[1],
            inviteeUserEmail: row[2]
        };
    });
}

