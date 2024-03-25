import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { factoryFindUser } from "./pg";
import { Email, parseEmail } from "../values";
import { IoError } from "../repositories";

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

    it("findUser returns null by unknown user email", async ()=> {
        const email = parseEmail("unkown@example.com").value as Email;
        const findUser = factoryFindUser(pgPool);
        const result = await findUser(email, undefined);
        expect(result.error).toBeUndefined();
        expect(result.value).toBeNull();
    })

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
        await badPool.end()
        expect(result.error).toBeInstanceOf(IoError)
    })

    afterAll(async () => {
        if (pgPool) {
            await pgPool.end();
        }
        if (pgContainer) {
            await pgContainer.stop();
        }
    });
});
