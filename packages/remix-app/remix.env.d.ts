/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import "@remix-run/node";
import type {
    DataFunctionArgs,
    SessionData,
    SessionStorage,
} from "@remix-run/node";
import { UserId } from "backend/commands/values";
import {
    HomeQuerySerive,
    LatestLoggedInOrganizationQueryService,
} from "@backend/queries/services";
import { InviteUserUseCase } from "@backend/commands/usecases";
import { Authenticator } from "remix-auth";

declare module "@remix-run/node" {
    export interface LoaderFunctionArgs extends DataFunctionArgs {
        context: {
            authenticator: Authenticator<UserId>;
            sessionStorage: SessionStorage<SessionData, SessionData>;
            latestLoggedInOrganizationQueryService: LatestLoggedInOrganizationQueryService<null>;
            homeQueryService: HomeQuerySerive<null>;
        };
    }

    export interface ActionFunctionArgs extends DataFunctionArgs {
        context: {
            authenticator: Authenticator<UserId>;
            inviteUser: InviteUserUseCase<null>;
        };
    }
}
