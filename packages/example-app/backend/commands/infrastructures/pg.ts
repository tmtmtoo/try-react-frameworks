import { Pool, PoolClient } from "pg";
import {
    selectBelongingOrganizationByUserId,
    selectLatestUserProfileByEmail,
} from "../../gen/queries_sql";
import { DataConsistencyError, FindUser, IoError } from "../repositories";
import {
    parseDisplayName,
    parseEmail,
    parseOrganizationId,
    parseRole,
    parseUserId,
} from "../values";

const tx = async <T>(
    pool: Pool,
    f: (client: PoolClient) => Promise<T>,
): Promise<T> => {
    const conn = await pool.connect();

    try {
        await conn.query("BEGIN");
        const value = await f(conn);
        await conn.query("COMMIT");
        return value;
    } catch (error) {
        await conn.query("ROLLBACK");
        throw error;
    } finally {
        conn.release();
    }
};

export const factoryFindUser =
    <Context>(pool: Pool): FindUser<Context> =>
    async (email) => {
        try {
            const value = await tx(pool, async (conn) => {
                const user = await selectLatestUserProfileByEmail(conn, {
                    email,
                });

                if (user === null) {
                    return null;
                }

                const userId = parseUserId(user.userId);

                const userName = user.name
                    ? parseDisplayName(user.name)
                    : undefined;

                const userEmail = parseEmail(user.email);

                if (userId.error || userEmail.error || userName?.error) {
                    throw new DataConsistencyError(
                        `invalid user profile: user_id: ${user.userId}, user_name: ${user.name}, user_email: ${user.email}`,
                    );
                }

                const belong = await selectBelongingOrganizationByUserId(conn, {
                    userId: userId.value,
                });

                const organizations = [];

                for (const organization of belong) {
                    const organizationId = parseOrganizationId(
                        organization.organizationId,
                    );

                    const organizationName = parseDisplayName(
                        organization.organizationName,
                    );

                    const role = parseRole(organization.roleName);

                    const authorityExample = organization.authorityExample;

                    if (
                        organizationId.error ||
                        organizationName.error ||
                        role.error
                    ) {
                        throw new DataConsistencyError(
                            `invalid belongings: organization_id: ${organization.organizationId}, organization_name: ${organization.organizationName}, role: ${organization.roleName}, authority_example: ${organization.authorityExample}`,
                        );
                    }

                    organizations.push({
                        id: organizationId.value,
                        displayName: organizationName.value,
                        role: role.value,
                        authorityExample,
                    });
                }

                if (organizations.length === 0) {
                    throw new DataConsistencyError(
                        `no belongings for ${user.email}`,
                    );
                }

                return {
                    id: userId.value,
                    displayName: userName?.value,
                    email: userEmail.value,
                    organizations,
                };
            });
            return { value };
        } catch (e) {
            if (e instanceof DataConsistencyError) {
                return { error: e };
            }
            return {
                error: new IoError("connection or transaction error", {
                    cause: e,
                }),
            };
        }
    };
