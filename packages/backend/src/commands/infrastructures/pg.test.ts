import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IoError } from "../../commands/repositories";
import { selectBelongingOrganizationByUserId } from "../../pg_sql";
import {
    DisplayName,
    Email,
    OrganizationId,
    Role,
    UserId,
    parseDisplayName,
    parseEmail,
    parseOrganizationId,
    parseRole,
    parseUserId,
} from "../values";
import { factoryFindUser, factoryPersitUser } from "./pg";

describe("when postgresql given fixtures", () => {
    let pgContainer: StartedTestContainer;
    let pgPool: Pool;

    beforeAll(
        async () => {
            pgContainer = await new GenericContainer("postgres:15")
                .withExposedPorts(5434)
                .withEnvironment({
                    POSTGRES_USER: "dev",
                    POSTGRES_HOST_AUTH_METHOD: "trust",
                    PGPORT: "5434",
                })
                .withWaitStrategy(Wait.forListeningPorts())
                .start();

            pgPool = new Pool({
                host: pgContainer.getHost(),
                port: pgContainer.getMappedPort(5434),
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

    it("findUser returns User by example user email", async () => {
        const email = parseEmail("example@example.com").value as Email;
        const findUser = factoryFindUser(pgPool);
        const result = await findUser(email, undefined);
        expect(result.value).toStrictEqual({
            id: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
            displayName: "example",
            email: "example@example.com",
            organizations: [
                {
                    id: "e1db2424-1fb4-4cc2-9233-c430f1a49819",
                    displayName: "Foobar Organization",
                    role: "member",
                    authorityManageOrganization: false,
                },
                {
                    id: "12664faf-373e-41f8-95b9-cb796afa3ae9",
                    displayName: "Example Organization",
                    role: "admin",
                    authorityManageOrganization: true,
                },
            ],
        });
    });

    it("findUser returns null by unknown user email", async () => {
        const email = parseEmail("unkown@example.com").value as Email;
        const findUser = factoryFindUser(pgPool);
        const result = await findUser(email, undefined);
        expect(result.error).toBeUndefined();
        expect(result.value).toBeNull();
    });

    it("findUser returns Error with bad connection pool", async () => {
        const badPool = new Pool({
            host: pgContainer.getHost(),
            port: pgContainer.getMappedPort(5434),
            database: "boooooo",
            user: "dev",
        });
        const email = parseEmail("example@example.com").value as Email;
        const findUser = factoryFindUser(badPool);
        const result = await findUser(email, undefined);
        await badPool.end();
        expect(result.error).toBeInstanceOf(IoError);
    });

    it("persitUser return user id", async () => {
        const user = {
            id: parseUserId("018e75eb-6cf7-7730-a5a3-6ff60f027d74")
                .value as UserId,
            displayName: parseDisplayName("Foobar").value as DisplayName,
            email: parseEmail("fooooooo@example.com").value as Email,
            organizations: [
                {
                    id: parseOrganizationId(
                        "018e75ed-dfe8-7a5b-927c-bda45bb3393f",
                    ).value as OrganizationId,
                    displayName: parseDisplayName("SuperHyper")
                        .value as DisplayName,
                    role: parseRole("admin").value as Role,
                },
                {
                    id: parseOrganizationId(
                        "018e75ef-c299-7784-9928-758b670526d0",
                    ).value as OrganizationId,
                    displayName: parseDisplayName("OkOk").value as DisplayName,
                    role: parseRole("member").value as Role,
                },
            ],
        };
        const persitUser = factoryPersitUser(pgPool);
        const result = await persitUser(user, undefined);
        expect(result.value).toStrictEqual(
            "018e75eb-6cf7-7730-a5a3-6ff60f027d74",
        );
    });

    it("persistUser save with organizations", async () => {
        const user = {
            id: "018eaef1-675a-7b55-9f88-431db43b0e05" as UserId,
            displayName: "Piyo" as DisplayName,
            email: "piyo@example.com" as Email,
            organizations: [
                {
                    id: "018eaef3-73ea-75a1-88da-518d611230bb" as OrganizationId,
                    displayName: "UltraHyper" as DisplayName,
                    role: "admin" as Role,
                },
                {
                    id: "018eaef4-287b-724b-aeb6-cd2cc7179d4e" as OrganizationId,
                    displayName: "Yay" as DisplayName,
                    role: "member" as Role,
                },
            ],
        };
        const persitUser = factoryPersitUser(pgPool);
        await persitUser(user, undefined);
        const pgClient = await pgPool.connect();
        try {
            const result = await selectBelongingOrganizationByUserId(pgClient, {
                userId: "018eaef1-675a-7b55-9f88-431db43b0e05",
            });
            expect(result).toStrictEqual([
                {
                    organizationId: "018eaef3-73ea-75a1-88da-518d611230bb",
                    organizationName: "UltraHyper",
                    roleName: "admin",
                    authorityManageOrganization: true,
                },
                {
                    organizationId: "018eaef4-287b-724b-aeb6-cd2cc7179d4e",
                    organizationName: "Yay",
                    roleName: "member",
                    authorityManageOrganization: false,
                },
            ]);
        } finally {
            pgClient.release();
        }
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
