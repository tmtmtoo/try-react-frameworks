-- name: SelectLatestUserProfileFromEmail :one
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
limit 1;

-- name: SelectBelongingOrganizationByUserId :many
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
order by belong.created_at asc;
