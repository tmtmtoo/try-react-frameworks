begin;

insert into users values (
    '3f020291-cba1-46c1-9f2d-677a164b4309'
), (
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7'
);

insert into user_profile values (
    'af76e455-a84c-4384-ac37-b45a99003206',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    'example@example.com',
    'example',
    '2024/1/1 12:00:00'
);

insert into user_delete values (
    '25015370-ebf7-47d2-82a0-f644c4d4842f',
    '3f020291-cba1-46c1-9f2d-677a164b4309',
    '2024/1/1 12:00:00'
);

commit;
