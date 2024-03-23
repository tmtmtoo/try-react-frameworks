import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const selectLatestUserProfileFromEmailQuery = `-- name: SelectLatestUserProfileFromEmail :one
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

export interface SelectLatestUserProfileFromEmailArgs {
    email: string;
}

export interface SelectLatestUserProfileFromEmailRow {
    userId: string;
    email: string;
    name: string | null;
}

export async function selectLatestUserProfileFromEmail(
    client: Client,
    args: SelectLatestUserProfileFromEmailArgs,
): Promise<SelectLatestUserProfileFromEmailRow | null> {
    const result = await client.query({
        text: selectLatestUserProfileFromEmailQuery,
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
select
    organization_profile.organization_id as organization_id,
    organization_profile.name as organization_name,
    roles.name as role_name,
    roles.example as authority_example
from belong
inner join organization_profile on belong.organization_id = organization_profile.organization_id
inner join assign on belong.id = assign.belong_id
inner join roles on assign.role_name = roles.name
where
    belong.user_id = $1
    and belong.id not in (
        select belong_id from dismiss
    )
    and organization_profile.organization_id not in (
        select organization_id from organization_delete
    )
order by belong.created_at asc`;

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
