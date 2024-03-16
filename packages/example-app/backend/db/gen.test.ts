/*
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
  });

  afterAll(async () => {
    await pgClient.end();
    await pgContainer.stop();
  });
});
*/
