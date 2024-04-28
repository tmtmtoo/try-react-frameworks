begin;

insert into roles values
('admin', true),
('member', false),
('guest', false)
on conflict (name) do update set manage_organization = excluded.manage_organization;

commit;
