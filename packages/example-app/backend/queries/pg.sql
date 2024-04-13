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
