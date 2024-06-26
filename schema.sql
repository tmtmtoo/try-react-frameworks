create table users (
    id uuid primary key
);

create table users_email_registration (
    id uuid primary key,
    user_id uuid not null,
    email text not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_users_email_registration_user foreign key (user_id) references users (id)
);

create index idx_users_email_registration_email on users_email_registration using btree (email);

create table users_profile (
    id uuid primary key,
    user_id uuid not null,
    name text,
    created_at timestamp not null default current_timestamp,

    constraint fk_users_profile_user foreign key (user_id) references users (id)
);

create table users_delete (
    id uuid primary key,
    user_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_users_delete_user foreign key (user_id) references users (id)
);

create table organizations (
    id uuid primary key
);

create table organizations_profile (
    id uuid primary key,
    organization_id uuid not null,
    name text not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_organizations_profile_organization foreign key (
        organization_id
    ) references organizations (id)
);

create table organizations_delete (
    id uuid primary key,
    organization_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_organizations_delete_organization foreign key (
        organization_id
    ) references organizations (id)
);

create table belong (
    id uuid primary key,
    user_id uuid not null,
    organization_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_belong_user foreign key (user_id) references users (id),
    constraint fk_belong_organization foreign key (
        organization_id
    ) references organizations (id)
);

create table belong_dismiss (
    id uuid primary key,
    belong_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_belong_dismiss_belong foreign key (belong_id) references belong (id)
);

create table roles (
    name text primary key,
    manage_organization boolean not null default false
);

create table assign (
    id uuid primary key,
    role_name text not null,
    belong_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_assign_role foreign key (role_name) references roles (name),
    constraint fk_assign_belong foreign key (belong_id) references belong (id)
);

create table organizations_switch (
    id uuid primary key,
    user_id uuid not null,
    organization_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_organizations_switch_user foreign key (user_id) references users (id),
    constraint fk_organizations_switch_organization foreign key (
        organization_id
    ) references organizations (id)
);

create table organizations_invitation (
    id uuid primary key,
    organization_id uuid not null,
    role_name text not null,
    invitee_user_email text not null,
    inviter_user_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_organizations_invitation_organization foreign key (
        organization_id
    ) references organizations (id),
    constraint fk_organizations_invitation_role foreign key (role_name) references roles (name),
    constraint fk_organizations_invitation_inviter_user foreign key (
        inviter_user_id
    ) references users (id)
);

create index idx_organization_invitation_invitee_user_emaila
on organizations_invitation using btree (invitee_user_email);

create table organizations_invitation_cancel (
    id uuid primary key,
    organizations_invitation_id uuid not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_organizations_invitation_cancel_organizations_invitation foreign key (
        organizations_invitation_id
    ) references organizations_invitation (id)
);
