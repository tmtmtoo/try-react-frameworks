import { Pool, PoolClient } from "pg";
import {
    insertAssign,
    insertBelong,
    insertOrgaization,
    insertOrganizationProfile,
    insertUser,
    insertUserProfile,
    selectBelongingOrganizationByUserId,
    selectLatestUserProfileByEmail,
} from "../../gen/queries_sql";
import {
    DataConsistencyError,
    FindUser,
    IoError,
    PersistUser,
} from "../repositories";
import {
    parseDisplayName,
    parseEmail,
    parseOrganizationId,
    parseRole,
    parseUserId,
} from "../values";
import { User } from "../entities";
import { uuidv7 } from "uuidv7";

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

const intoUserMayException = (from: {
    id: string;
    name: string | null;
    email: string;
    organizations: {
        id: string;
        name: string;
        role: string;
        authorityExample: boolean;
    }[];
}): User => {
    const userId = parseUserId(from.id);
    const userName = from.name ? parseDisplayName(from.name) : undefined;
    const userEmail = parseEmail(from.email);

    if (userId.error || userEmail.error || userName?.error) {
        throw new DataConsistencyError(
            `invalid user profile: user_id: ${from.id}, user_name: ${from.name}, user_email: ${from.email}`,
        );
    }

    const organizations = [];

    for (const organization of from.organizations) {
        const organizationId = parseOrganizationId(organization.id);
        const organizationName = parseDisplayName(organization.name);
        const role = parseRole(organization.role);
        const authorityExample = organization.authorityExample;

        if (organizationId.error || organizationName.error || role.error) {
            throw new DataConsistencyError(
                `invalid belongings: organization_id: ${organization.id}, organization_name: ${organization.name}, role: ${organization.role}, authority_example: ${organization.authorityExample}`,
            );
        }

        organizations.push({
            id: organizationId.value,
            displayName: organizationName.value,
            role: role.value,
            authorityExample,
        });
    }

    return {
        id: userId.value,
        displayName: userName?.value,
        email: userEmail.value,
        organizations,
    };
};

export const factoryFindUser =
    <Context>(pool: Pool): FindUser<Context> =>
    async (email) => {
        let conn;

        try {
            conn = await pool.connect();

            const user = await selectLatestUserProfileByEmail(conn, { email });

            if (user === null) {
                return { value: null };
            }

            const organizations = await selectBelongingOrganizationByUserId(
                conn,
                { userId: user.userId },
            );

            const value = intoUserMayException({
                id: user.userId,
                name: user.name,
                email: user.email,
                organizations: organizations.map((org) => ({
                    id: org.organizationId,
                    name: org.organizationName,
                    role: org.roleName,
                    authorityExample: org.authorityExample,
                })),
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
        } finally {
            conn?.release();
        }
    };

export const factoryPersitUser =
    <Context>(pool: Pool): PersistUser<Context> =>
    async (user: User) => {
        try {
            const value = await tx(pool, async (conn) => {
                await insertUser(conn, { id: user.id });
                await insertUserProfile(conn, {
                    id: uuidv7(),
                    userId: user.id,
                    name: user.displayName ? user.displayName : null,
                    email: user.email,
                });

                for (const organization of user.organizations) {
                    await insertOrgaization(conn, { id: organization.id });
                    await insertOrganizationProfile(conn, {
                        id: uuidv7(),
                        organizationId: organization.id,
                        name: organization.displayName,
                    });
                    const belongId = uuidv7();
                    await insertBelong(conn, {
                        id: belongId,
                        userId: user.id,
                        organizationId: organization.id,
                    });
                    await insertAssign(conn, {
                        id: uuidv7(),
                        roleName: organization.role,
                        belongId,
                    });
                }

                const selectedUser = await selectLatestUserProfileByEmail(
                    conn,
                    { email: user.email },
                );

                if (selectedUser === null) {
                    throw new DataConsistencyError(
                        `failed to select inserted user: ${user.email}`,
                    );
                }

                const organizations = await selectBelongingOrganizationByUserId(
                    conn,
                    { userId: selectedUser.userId },
                );

                return intoUserMayException({
                    id: selectedUser.userId,
                    name: selectedUser.name ? selectedUser.name : null,
                    email: selectedUser.email,
                    organizations: organizations.map((org) => ({
                        id: org.organizationId,
                        name: org.organizationName,
                        role: org.roleName,
                        authorityExample: org.authorityExample,
                    })),
                });
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
