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
left join organizations_delete on belong.organization_id = organizations_delete.organization_id
left join belong_dismiss on belong.id = belong_dismiss.belong_id
left join users_delete on belong.user_id = users_delete.user_id
where
    organizations_delete.id is null
    and belong_dismiss.id is null
    and users_delete.id is null
    and belong.organization_id = $1
order by belong.created_at asc;

-- name: SelectSwitchedOrganization :one
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
limit 1;

-- name: SelectInvitingUnknownUsers :many
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
order by organizations_invitation.created_at asc;
