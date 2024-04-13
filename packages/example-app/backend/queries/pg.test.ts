import {
    selectBelongingOrganizations,
    selectOrganizationUsers,
    selectUser,
} from "backend/gen/pg_sql";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { factoryHomeQueryService } from "./services";

describe("when postgresql given fixtures", () => {
    let pgContainer: StartedTestContainer;
    let pgPool: Pool;

    beforeAll(
        async () => {
            pgContainer = await new GenericContainer("postgres:15")
                .withExposedPorts(5433)
                .withEnvironment({
                    POSTGRES_USER: "dev",
                    POSTGRES_HOST_AUTH_METHOD: "trust",
                    PGPORT: "5433",
                })
                .withWaitStrategy(Wait.forListeningPorts())
                .start();

            pgPool = new Pool({
                host: pgContainer.getHost(),
                port: pgContainer.getMappedPort(5433),
                database: "dev",
                user: "dev",
            });

            await new Promise((resolve) => setTimeout(resolve, 1000));

            const pgClient = await pgPool.connect();

            const schema = await readFile("../../schema.sql", {
                encoding: "utf-8",
            });
            const seed = await readFile("../../seed.sql", {
                encoding: "utf-8",
            });
            const fixture = await readFile(`${__dirname}/pg.fixture.sql`, {
                encoding: "utf-8",
            });

            try {
                await pgClient.query(schema);
                await pgClient.query(seed);
                await pgClient.query(fixture);
            } finally {
                pgClient.release();
            }
        },
        1000 * 60 * 5,
    );

    it("selectUser returns latest user profile by user id", async () => {
        const client = await pgPool.connect();

        try {
            const userId = "3ff76040-6363-449e-8bbc-4eae8ea3b3a7";
            const user = await selectUser(client, { id: userId });
            expect(user).toStrictEqual({
                id: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
                name: "example",
                email: "example@example.com",
            });
        } finally {
            client.release();
        }
    });

    it("selectUser returns null by unknown user id", async () => {
        const client = await pgPool.connect();

        try {
            const userId = "3ff76040-6363-449e-8bbc-5eae8ea3b3a7";
            const user = await selectUser(client, { id: userId });
            expect(user).toStrictEqual(null);
        } finally {
            client.release();
        }
    });

    it("selectUser returns null by deleted user id", async () => {
        const client = await pgPool.connect();

        try {
            const userId = "3f020291-cba1-46c1-9f2d-677a164b4309";
            const user = await selectUser(client, { id: userId });
            expect(user).toStrictEqual(null);
        } finally {
            client.release();
        }
    });

    it("selectBelongingOraganization returns organization by user id", async () => {
        const client = await pgPool.connect();

        try {
            const userId = "3ff76040-6363-449e-8bbc-4eae8ea3b3a7";
            const organizations = await selectBelongingOrganizations(client, {
                userId,
            });
            expect(organizations).toStrictEqual([
                {
                    organizationId: "12664faf-373e-41f8-95b9-cb796afa3ae9",
                    organizationName: "Example Organization",
                    roleName: "admin",
                    authorityExample: true,
                },
                {
                    organizationId: "e1db2424-1fb4-4cc2-9233-c430f1a49819",
                    organizationName: "Foobar Organization",
                    roleName: "member",
                    authorityExample: false,
                },
            ]);
        } finally {
            client.release();
        }
    });

    it("selectBelongingOraganization emplty array by unknown user id", async () => {
        const client = await pgPool.connect();

        try {
            const userId = "3ff76040-6363-449e-8bbc-5eae8ea3b3a7";
            const organizations = await selectBelongingOrganizations(client, {
                userId,
            });
            expect(organizations).toStrictEqual([]);
        } finally {
            client.release();
        }
    });

    it("selectBelongingOraganization emplty array by deleted user id", async () => {
        const client = await pgPool.connect();

        try {
            const userId = "3f020291-cba1-46c1-9f2d-677a164b4309";
            const organizations = await selectBelongingOrganizations(client, {
                userId,
            });
            expect(organizations).toStrictEqual([]);
        } finally {
            client.release();
        }
    });

    it("selectOrganizationUsers returns users by organization id", async () => {
        const client = await pgPool.connect();

        try {
            const organizationId = "e1db2424-1fb4-4cc2-9233-c430f1a49819";
            const users = await selectOrganizationUsers(client, {
                organizationId,
            });
            expect(users).toStrictEqual([
                {
                    userId: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
                    roleName: "member",
                    email: "example@example.com",
                    userName: "example",
                },
                {
                    userId: "a03b5bb4-661b-4725-80d7-c3a2d2ed1525",
                    roleName: "admin",
                    email: "foobar@example.com",
                    userName: "foobar",
                },
            ]);
        } finally {
            client.release();
        }
    });

    it("selectOrganizationUsers returns users without deleted user", async () => {
        const client = await pgPool.connect();

        try {
            const organizationId = "12664faf-373e-41f8-95b9-cb796afa3ae9";
            const users = await selectOrganizationUsers(client, {
                organizationId,
            });
            expect(users).toStrictEqual([
                {
                    userId: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
                    roleName: "admin",
                    email: "example@example.com",
                    userName: "example",
                },
            ]);
        } finally {
            client.release();
        }
    });

    it("selectOrganizationUsers returns empty array by unknown organization id", async () => {
        const client = await pgPool.connect();

        try {
            const organizationId = "22664faf-373e-41f8-95b9-cb796afa3ae9";
            const users = await selectOrganizationUsers(client, {
                organizationId,
            });
            expect(users).toStrictEqual([]);
        } finally {
            client.release();
        }
    });

    it("selectOrganizationUsers returns empty array by deleted organization id", async () => {
        const client = await pgPool.connect();

        try {
            const organizationId = "868eeffa-a18c-4e26-ba76-6a394c9422d2";
            const users = await selectOrganizationUsers(client, {
                organizationId,
            });
            expect(users).toStrictEqual([]);
        } finally {
            client.release();
        }
    });

    it("HomeQueryService returns HomeModel should be success", async () => {
        const homeQuerySerive = factoryHomeQueryService(pgPool);
        const home = await homeQuerySerive(
            {
                userId: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
                organizationId: "e1db2424-1fb4-4cc2-9233-c430f1a49819",
            },
            null,
        );
        expect(home).toStrictEqual({
            value: {
                id: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
                email: "example@example.com",
                name: "example",
                belongingOrganizations: [
                    {
                        id: "12664faf-373e-41f8-95b9-cb796afa3ae9",
                        name: "Example Organization",
                    },
                    {
                        id: "e1db2424-1fb4-4cc2-9233-c430f1a49819",
                        name: "Foobar Organization",
                    },
                ],
                selectedOrganization: {
                    id: "e1db2424-1fb4-4cc2-9233-c430f1a49819",
                    name: "Foobar Organization",
                    role: "member",
                    authorityExample: false,
                    users: [
                        {
                            id: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
                            name: "example",
                            email: "example@example.com",
                            role: "member",
                        },
                        {
                            id: "a03b5bb4-661b-4725-80d7-c3a2d2ed1525",
                            name: "foobar",
                            email: "foobar@example.com",
                            role: "admin",
                        },
                    ],
                },
            },
        });
    });

    afterAll(async () => {
        if (pgPool) {
            await pgPool.end();
        }
        if (pgContainer) {
            await pgContainer.stop();
        }
    });
});
