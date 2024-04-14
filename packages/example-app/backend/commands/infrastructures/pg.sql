-- name: SelectLatestUserProfileByEmail :one
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
limit 1;

-- name: SelectBelongingOrganizationByUserId :many
with latest as (
    select
        organization_id,
        max(created_at) as created_at
    from organizations_profile
    group by organization_id
),

latest_organizations_profiles as (
    select organizations_profile.* from organizations_profile
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
        select belong_id from dismiss
    )
    and latest_organizations_profiles.organization_id not in (
        select organization_id from organizations_delete
    )
order by assign.belong_id asc, assign.created_at desc, belong.created_at asc;

-- name: InsertUser :exec
insert into users (id) values ($1);

-- name: InsertUserEmailRegistration :exec
insert into users_email_registration (id, user_id, email) values ($1, $2, $3);

-- name: InsertUserProfile :exec
insert into users_profile (id, user_id, name) values ($1, $2, $3);

-- name: InsertOrgaization :exec
insert into organizations (id) values ($1);

-- name: InsertOrganizationProfile :exec
insert into organizations_profile (id, organization_id, name) values ($1, $2, $3);

-- name: InsertBelong :exec
insert into belong (id, user_id, organization_id) values ($1, $2, $3);

-- name: InsertAssign :exec
insert into assign (id, role_name, belong_id) values ($1, $2, $3);
