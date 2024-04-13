-- name: SelectUserWithSpecifiedOrganization :one
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
        and users.id = sqlc.arg('user_id')
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
        and organizations.id = sqlc.arg('organization_id')
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
limit 1;

-- name: SelectUser :one
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
limit 1;

-- name: SelectBelongingOrganizations :many
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
left join user_delete on belong.user_id = user_delete.user_id
where
    dismiss.id is null
    and organization_delete.id is null
    and user_delete.id is null
    and belong.user_id = $1
order by belong.created_at asc;

-- name: SelectBelongingOrganizations2 :many
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
    on belonging_organizations.belong_id = latest_organization_role_assign.belong_id;

-- name: SelectOrganizationUsers :many
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
        order by user_profile.created_at desc
        limit 1
    ) as user_name
from belong
left join organization_delete on belong.organization_id = organization_delete.organization_id
left join dismiss on belong.id = dismiss.belong_id
left join user_delete on belong.user_id = user_delete.user_id
where
    organization_delete.id is null
    and dismiss.id is null
    and user_delete.id is null
    and belong.organization_id = $1
order by belong.created_at asc;

-- name: SelectOrganizationUsers2 :many
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
inner join latest_user_profile on selected_belong.user_id = latest_user_profile.user_id;
