import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
    insertUser,
    insertUserProile,
    selectLatestUserProfileByEmail,
} from "./gen/queries_sql";

describe("otameshi", () => {
    let pgContainer: StartedTestContainer;
    let pgClient: Client;

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

            pgClient = new Client({
                host: pgContainer.getHost(),
                port: pgContainer.getMappedPort(5432),
                database: "dev",
                user: "dev",
            });

            await pgClient.connect();

            const schema = await readFile("../../schema.sql", {
                encoding: "utf-8",
            });
            const seed = await readFile("../../seed.sql", {
                encoding: "utf-8",
            });
            const fixture = await readFile(
                `${__dirname}/gen.test.fixture.sql`,
                {
                    encoding: "utf-8",
                },
            );

            await pgClient.query(schema);
            await pgClient.query(seed);
            await pgClient.query(fixture);
        },
        1000 * 60 * 5,
    );

    it("select user latest profile", async () => {
        const user = await selectLatestUserProfileByEmail(pgClient, {
            email: "example@example.com",
        });
        expect(user).toStrictEqual({
            id: "af76e455-a84c-4384-ac37-b45a99003206",
            userId: "3ff76040-6363-449e-8bbc-4eae8ea3b3a7",
            name: "example",
            email: "example@example.com",
            createdAt: new Date("2024/1/1 12:00:00"),
        });
    });

    it("insert user and profile", async () => {
        await insertUser(pgClient, {
            id: "583e1003-5d6b-45bb-90a2-ca4e0784afcf",
        });
        await insertUserProile(pgClient, {
            id: "b4aa08e8-9d6e-4cda-b1b7-621496f60608",
            userId: "583e1003-5d6b-45bb-90a2-ca4e0784afcf",
            email: "example2@example.com",
            name: "example2",
        });
        const result = await pgClient.query({
            text: `
      select user_profile.* from users
      left join user_profile on user_profile.user_id = users.id
      where users.id = '583e1003-5d6b-45bb-90a2-ca4e0784afcf';
    `,
            rowMode: "array",
        });
        if (result.rows.length === 1) {
            const [id, userId, email, name] = result.rows[0];
            expect({ id, userId, email, name }).toStrictEqual({
                id: "b4aa08e8-9d6e-4cda-b1b7-621496f60608",
                userId: "583e1003-5d6b-45bb-90a2-ca4e0784afcf",
                email: "example2@example.com",
                name: "example2",
            });
        } else {
            throw new Error("failed to select user profile");
        }
    });

    afterAll(async () => {
        if (pgClient) {
            await pgClient.end();
        }
        if (pgContainer) {
            await pgContainer.stop();
        }
    });
});
