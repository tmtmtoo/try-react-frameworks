begin;

insert into roles values
('admin', true),
('member', false),
('guest', false)
on conflict (name) do update set example = excluded.example;

commit;
