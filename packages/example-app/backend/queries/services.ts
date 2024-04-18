import {
    selectBelongingOrganizations,
    selectOrganizationUsers,
    selectSwitchedOrganization,
    selectUser,
} from "backend/gen/pg_sql";
import { Component, Result } from "backend/types";
import { Pool } from "pg";

export type HomeQueryInput = {
    userId: string;
    organizationId: string;
};

export type Home = {
    id: string;
    email: string;
    name?: string;
    belongingOrganizations: {
        id: string;
        name: string;
    }[];
    selectedOrganization: {
        id: string;
        name: string;
        role: string;
        authorityExample: boolean;
        users: {
            id: string;
            email: string;
            name?: string;
            role: string;
        }[];
    };
};

export type HomeQueryResult = Result<Home, Error>;

export type HomeQuerySerive<Context> = Component<
    HomeQueryInput,
    Context,
    HomeQueryResult
>;

export const factoryHomeQueryService =
    <Context>(pool: Pool): HomeQuerySerive<Context> =>
    async ({ userId, organizationId }) => {
        const client = await pool.connect();

        try {
            const user = await selectUser(client, { id: userId });

            if (!user) {
                throw new Error(`user id: ${userId} not found`);
            }

            const belongingOrganizations = await selectBelongingOrganizations(
                client,
                { userId },
            );
            const selectedOrganization = belongingOrganizations.find(
                (org) => org.organizationId === organizationId,
            );
            if (!selectedOrganization) {
                throw new Error(`organization id: ${organizationId} not found`);
            }

            const organizationUsers = await selectOrganizationUsers(client, {
                organizationId,
            });

            const home: Home = {
                id: user.id,
                email: user.email,
                name: user.name?.toString(),
                belongingOrganizations: belongingOrganizations.map((org) => ({
                    id: org.organizationId,
                    name: org.organizationName,
                })),
                selectedOrganization: {
                    id: selectedOrganization.organizationId,
                    name: selectedOrganization.organizationName,
                    role: selectedOrganization.roleName,
                    authorityExample: selectedOrganization.authorityExample,
                    users: organizationUsers.map((user) => ({
                        id: user.userId,
                        name: user.userName?.toString(),
                        email: user.email,
                        role: user.roleName,
                    })),
                },
            };

            return { value: home };
        } catch (e) {
            if (e instanceof Error) {
                return { error: e };
            }
            return {
                error: new Error("Unknown error has occured", { cause: e }),
            };
        } finally {
            client.release();
        }
    };

export type LatestLoggedInOrganizationQueryInput = {
    userId: string;
};

export type LatestLoggedInOrganization = {
    organizationId: string;
};

export type LatestLoggedInOrganizationQueryResult = Result<
    LatestLoggedInOrganization,
    Error
>;

export type LatestLoggedInOrganizationQueryService<Context> = Component<
    LatestLoggedInOrganizationQueryInput,
    Context,
    LatestLoggedInOrganizationQueryResult
>;

export const factoryLatestLoggedInOrganizationQueryService =
    <Context>(pool: Pool): LatestLoggedInOrganizationQueryService<Context> =>
    async ({ userId }) => {
        const client = await pool.connect();

        try {
            const organization = await selectSwitchedOrganization(client, {
                userId,
            });

            if (!organization) {
                throw new Error(
                    `belonged oranization not found. user id: ${userId}`,
                );
            }

            const organizationId =
                organization.lastSwitchedOrganizationId ??
                organization.firstBelongedOrganizationId;

            return {
                value: { organizationId },
            };
        } catch (e) {
            if (e instanceof Error) {
                return { error: e };
            }
            return {
                error: new Error("Unknown error has occured", { cause: e }),
            };
        } finally {
            client.release();
        }
    };
