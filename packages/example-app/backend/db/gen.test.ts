import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getUser } from "./gen/queries_sql";

describe("otameshi", () => {
  let pgContainer: StartedTestContainer;
  let pgClient: Client;

  beforeAll(async () => {
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

    const schema = await readFile("../../schema.sql", { encoding: "utf-8" });
    const seed = await readFile("../../seed.sql", { encoding: "utf-8" });

    await pgClient.query(schema);
    await pgClient.query(seed);
  }, 10000000);

  it("example", async () => {
    const user = await getUser(pgClient, {
      id: "802086b3-4127-4c91-ab6b-235a61c5a009",
    });
    expect(user).toBeNull();
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
