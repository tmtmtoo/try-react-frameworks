import {
    factoryFindUser,
    factoryPersitUser,
} from "@backend/commands/infrastructures/pg";
import { factoryLoginOrSignupUseCase } from "@backend/commands/usecases";
import {
    factoryHomeQueryService,
    factoryLatestLoggedInOrganizationQueryService,
} from "@backend/queries/services";
import { createRequestHandler } from "@remix-run/express";
import { parseConfig } from "app.config";
import { factoryAuth } from "app/authenticator";
import express from "express";
import pg from "pg";
import * as build from "./build/index.js";

const config = parseConfig({
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
});

const pgPool = new pg.Pool({ connectionString: config.databaseUrl });

const findUser = factoryFindUser(pgPool);

const persistUser = factoryPersitUser(pgPool);

const loginOrSignup = factoryLoginOrSignupUseCase(findUser, persistUser);

const latestLoggedInOrganizationQueryService =
    factoryLatestLoggedInOrganizationQueryService<null>(pgPool);

const homeQueryService = factoryHomeQueryService<null>(pgPool);

const { authenticator, sessionStorage } = factoryAuth(
    loginOrSignup,
    config.sessionSecret,
    config.nodeEnv === "production",
);

const app = express();

app.use(express.static("public"));

// and your app is "just a request handler"
app.all(
    "*",
    createRequestHandler({
        // @ts-ignore
        build,
        mode: config.nodeEnv,
        getLoadContext() {
            return {
                authenticator,
                sessionStorage,
                latestLoggedInOrganizationQueryService,
                homeQueryService,
            };
        },
    }),
);

app.listen(3000, () => {
    console.log("App listening on http://localhost:3000");
});
