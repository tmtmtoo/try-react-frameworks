import { selectUser } from "backend/gen/pg_sql";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

    afterAll(async () => {
        if (pgPool) {
            await pgPool.end();
        }
        if (pgContainer) {
            await pgContainer.stop();
        }
    });
});
