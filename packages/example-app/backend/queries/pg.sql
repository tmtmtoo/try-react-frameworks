-- name: SelectUser :one
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
limit 1;

-- name: SelectBelongingOrganizations :many
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
left join users_delete on belong.user_id = users_delete.user_id
where
    dismiss.id is null
    and organization_delete.id is null
    and users_delete.id is null
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
left join organization_delete on belong.organization_id = organization_delete.organization_id
left join dismiss on belong.id = dismiss.belong_id
left join users_delete on belong.user_id = users_delete.user_id
where
    organization_delete.id is null
    and dismiss.id is null
    and users_delete.id is null
    and belong.organization_id = $1
order by belong.created_at asc;
