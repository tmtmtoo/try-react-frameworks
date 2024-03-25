-- name: SelectLatestUserProfileByEmail :one
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
with latest_organization_profiles as (
    select distinct on (created_at) * from organization_profile
    order by created_at desc
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
order by assign.belong_id asc, assign.created_at desc, belong.created_at asc;

-- name: InsertUser :exec
insert into users (id) values ($1);

-- name: InsertUserProfile :exec
insert into user_profile (id, user_id, email, name) values ($1, $2, $3, $4);

-- name: InsertOrgaization :exec
insert into organizations (id) values ($1);

-- name: InsertOrganizationProfile :exec
insert into organization_profile (id, organization_id, name) values ($1, $2, $3);

-- name: InsertBelong :exec
insert into belong (id, user_id, organization_id) values ($1, $2, $3);

-- name: InsertAssign :exec
insert into assign (id, role_name, belong_id) values ($1, $2, $3);
