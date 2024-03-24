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
with latest_organization_profile as (
    select distinct on (created_at) id, organization_id, name, created_at from organization_profile
    order by created_at desc
)

select distinct on (assign.belong_id)
    latest_organization_profile.organization_id as organization_id,
    latest_organization_profile.name as organization_name,
    roles.name as role_name,
    roles.example as authority_example
from belong
inner join
    latest_organization_profile
    on belong.organization_id = latest_organization_profile.organization_id
inner join assign on belong.id = assign.belong_id
inner join roles on assign.role_name = roles.name
where
    belong.user_id = $1
    and belong.id not in (
        select belong_id from dismiss
    )
    and latest_organization_profile.organization_id not in (
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

