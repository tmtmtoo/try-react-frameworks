import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IoError } from "../repositories";
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
            pgContainer = await new GenericContainer("postgres:latest")
                .withExposedPorts(5432)
                .withEnvironment({
                    POSTGRES_USER: "dev",
                    POSTGRES_HOST_AUTH_METHOD: "trust",
                })
                .withWaitStrategy(Wait.forListeningPorts())
                .start();

            pgPool = new Pool({
                host: pgContainer.getHost(),
                port: pgContainer.getMappedPort(5432),
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
                    authorityExample: false,
                },
                {
                    id: "12664faf-373e-41f8-95b9-cb796afa3ae9",
                    displayName: "Example Organization",
                    role: "admin",
                    authorityExample: true,
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
            port: pgContainer.getMappedPort(5432),
            database: "boooooo",
            user: "dev",
        });
        const email = parseEmail("example@example.com").value as Email;
        const findUser = factoryFindUser(badPool);
        const result = await findUser(email, undefined);
        await badPool.end();
        expect(result.error).toBeInstanceOf(IoError);
    });

    it("persitUser return User", async () => {
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
        expect(result.value).toStrictEqual({
            id: "018e75eb-6cf7-7730-a5a3-6ff60f027d74",
            displayName: "Foobar",
            email: "fooooooo@example.com",
            organizations: [
                {
                    id: "018e75ed-dfe8-7a5b-927c-bda45bb3393f",
                    displayName: "SuperHyper",
                    role: "admin",
                    authorityExample: true,
                },
                {
                    id: "018e75ef-c299-7784-9928-758b670526d0",
                    displayName: "OkOk",
                    role: "member",
                    authorityExample: false,
                },
            ],
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
