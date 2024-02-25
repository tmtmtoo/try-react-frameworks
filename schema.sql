create table public.user (
    id uuid primary key
);

create table public.user_profile (
    user_id uuid primary key,
    email text not null unique,
    name text,
    created_at timestamp not null default current_timestamp,

    constraint fk_user_profile_user foreign key (user_id) references public.user (id)
);

create index idx_user_profile_email on public.user_profile using btree (email);

create table public.user_delete (
    user_id uuid primary key,
    created_at timestamp not null default current_timestamp,

    constraint fk_user_delete_user foreign key (user_id) references public.user (id)
);

create table public.organization (
    id uuid primary key
);

create table public.organization_profile (
    organization_id uuid primary key,
    name text not null,
    created_at timestamp not null default current_timestamp,

    constraint fk_organization_profile_organization foreign key (organization_id) references public.organization (id)
);

create table public.organization_delete (
    organization_id uuid primary key,
    created_at timestamp not null default current_timestamp,

    constraint fk_organization_delete_organization foreign key (organization_id) references public.organization (id)
);

create table public.belong (
    user_id uuid not null,
    organization_id uuid not null,
    created_at timestamp not null default current_timestamp,

    primary key (user_id, organization_id),
    constraint fk_belong_user foreign key (user_id) references public.user (id),
    constraint fk_belong_organization foreign key (organization_id) references public.organization (id)
);
