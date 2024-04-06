begin;

insert into users values (
    '3f020291-cba1-46c1-9f2d-677a164b4309'
), (
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7'
), (
    'a03b5bb4-661b-4725-80d7-c3a2d2ed1525'
);

insert into user_email_registration values (
    'af76e455-a84c-4384-ac37-b45a99003207',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    '_example@example.com',
    '2024/1/1 12:00:00'
), (
    'af76e455-a84c-4384-ac37-b45a99003208',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    'example@example.com',
    '2024/1/1 12:00:01'
), (
    '6986f60d-f5e2-4224-93c9-d57e96c053d0',
    'a03b5bb4-661b-4725-80d7-c3a2d2ed1525',
    'foobar@example.com',
    '2024/1/1 12:00:00'
);

insert into user_profile values (
    'af76e455-a84c-4384-ac37-b45a99003206',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    '_example',
    '2024/1/1 12:00:00'
), (
    '57725af6-457f-4e46-ae95-29e142581a21',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    'example',
    '2024/1/1 12:00:01'
), (
    '6986f60d-f5e2-4224-93c9-d57e96c053d9',
    'a03b5bb4-661b-4725-80d7-c3a2d2ed1525',
    'foobar',
    '2024/1/1 12:00:00'
);

insert into user_delete values (
    '25015370-ebf7-47d2-82a0-f644c4d4842f',
    '3f020291-cba1-46c1-9f2d-677a164b4309',
    '2024/1/1 12:00:00'
);

insert into organizations values (
    '868eeffa-a18c-4e26-ba76-6a394c9422d2'
), (
    '12664faf-373e-41f8-95b9-cb796afa3ae9'
), (
    'e1db2424-1fb4-4cc2-9233-c430f1a49819'
);

insert into organization_profile values (
    '332fb1cb-04cf-4af0-9db5-e4ff9389265b',
    '12664faf-373e-41f8-95b9-cb796afa3ae9',
    'Example Organization',
    '2024/1/1 12:00:00'
), (
    'fc2c9bfa-60d5-48ab-81cb-df87c1f339bf',
    'e1db2424-1fb4-4cc2-9233-c430f1a49819',
    'Foobaz Organization',
    '2024/1/1 12:00:00'
), (
    'e9ba175f-5020-415c-90d2-9f7bc36b7ff7',
    'e1db2424-1fb4-4cc2-9233-c430f1a49819',
    'Foobar Organization',
    '2024/1/1 12:00:01'
);

insert into organization_delete values (
    '2e7dee3f-96c2-4d25-a54a-662f94b5d614',
    '868eeffa-a18c-4e26-ba76-6a394c9422d2',
    '2024/1/1 12:00:00'
);

insert into belong values (
    '165099f8-f2d6-497f-b24a-fa4bffe30544',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    '12664faf-373e-41f8-95b9-cb796afa3ae9',
    '2024/1/1 12:00:00'
), (
    'df75fb46-125d-4187-a8d6-ef8688d6409c',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    '868eeffa-a18c-4e26-ba76-6a394c9422d2',
    '2024/1/1 12:00:00'
), (
    '08b878a2-d04a-4785-8d52-ca1c8eaa44c9',
    '3ff76040-6363-449e-8bbc-4eae8ea3b3a7',
    'e1db2424-1fb4-4cc2-9233-c430f1a49819',
    '2024/1/1 12:00:01'
), (
    '36e0cb29-6b1f-4a99-bb0d-68245cec6de7',
    'a03b5bb4-661b-4725-80d7-c3a2d2ed1525',
    'e1db2424-1fb4-4cc2-9233-c430f1a49819',
    '2024/1/1 12:00:01'
);

insert into dismiss values (
    'd5f92059-f281-4967-b48d-4603518760bf',
    'df75fb46-125d-4187-a8d6-ef8688d6409c',
    '2024/1/1 12:00:00'
);

insert into assign values (
    'ce249d25-f3fa-4f3e-be91-c8134bd93eb2',
    'guest',
    '165099f8-f2d6-497f-b24a-fa4bffe30544',
    '2024/1/1 12:00:00'
), (
    '48e92b2e-4858-4ba6-8941-98ddc638e802',
    'admin',
    '165099f8-f2d6-497f-b24a-fa4bffe30544',
    '2024/1/1 13:00:00'
), (
    '6b0363ce-be9d-40ec-a55d-149cb0d051e2',
    'admin',
    'df75fb46-125d-4187-a8d6-ef8688d6409c',
    '2024/1/1 12:00:00'
), (
    '8b16a285-8f0b-4194-acf6-5ed1245e0231',
    'member',
    '08b878a2-d04a-4785-8d52-ca1c8eaa44c9',
    '2024/1/1 12:00:01'
), (
    'dea63e74-c021-488c-b581-debb03bd732e',
    'admin',
    '36e0cb29-6b1f-4a99-bb0d-68245cec6de7',
    '2024/1/1 12:00:01'
);

commit;
