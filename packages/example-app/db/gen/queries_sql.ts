import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getUserQuery = `-- name: GetUser :one
select
    user_id as id,
    email,
    name,
    max(created_at) as created_at
from user_profile
where id = $1`;

export interface GetUserArgs {
    id: string;
}

export interface GetUserRow {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
}

export async function getUser(client: Client, args: GetUserArgs): Promise<GetUserRow | null> {
    const result = await client.query({
        text: getUserQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        email: row[1],
        name: row[2],
        createdAt: row[3]
    };
}

