import { Component, Result } from "backend/types";
import { Pool } from "pg";

export type HogeInput = {
    userId: string;
    organizationId: string;
};

export type Hoge = {
    id: string;
    email: string;
    name?: string;
    belongingOrganizations: {
        id: string;
        name: string;
    }[],
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
        }
    }
};

export type HogeResult = Result<Hoge, Error>;

export type HogeQuerySerive<Context> = Component<
    HogeInput,
    Context,
    HogeResult
>;

/*
export const factoryHogeQueryService =
    <Context>(pool: Pool): HogeQuerySerive<Context> =>
    async (input, ctx) => {
        const client = await pool.connect();
    };
*/