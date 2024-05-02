import { Pool, PoolClient } from "pg";
import { uuidv7 } from "uuidv7";
import {
    Organization,
    UnknownUser,
    User,
    UserCreationWithDefaultOrganizationEvent,
    UserCreationWithInvitedOrganizationEvent,
    UserInvitationEvent,
} from "../../commands/entities";
import {
    DataConsistencyError,
    Find,
    IoError,
    Persist,
} from "../../commands/repositories";
import {
    Email,
    OrganizationId,
    UserId,
    parseDisplayName,
    parseEmail,
    parseOrganizationId,
    parseRole,
    parseUserId,
} from "../../commands/values";
import {
    insertAssign,
    insertBelong,
    insertOrgaization,
    insertOrganizationInvitation,
    insertOrganizationProfile,
    insertUser,
    insertUserEmailRegistration,
    insertUserProfile,
    selectBelongingOrganizationByUserId,
    selectInvitedUnknownUserByEmail,
    selectInvitingUnknownUsers,
    selectLatestOraganizationProfileById,
    selectLatestUserProfileByEmail,
    selectLatestUserProfileById,
    selectOrganizationUsers,
} from "../../pg_sql";

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
        role: string;
        authorityManageOrganization: boolean;
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
        const role = parseRole(organization.role);
        const authorityManageOrganization =
            organization.authorityManageOrganization;

        if (organizationId.error || role.error) {
            throw new DataConsistencyError(
                `invalid belongings: organization_id: ${organization.id}, role: ${organization.role}, authority_manage_organization: ${organization.authorityManageOrganization}`,
            );
        }

        organizations.push({
            id: organizationId.value,
            role: role.value,
            authorityManageOrganization,
        });
    }

    return {
        id: userId.value,
        displayName: userName?.value,
        email: userEmail.value,
        belongingOrganizations: organizations,
    };
};

export const factoryFindUserById =
    <Context>(pool: Pool): Find<User, UserId, Context> =>
    async (userId) => {
        let conn;

        try {
            conn = await pool.connect();

            const user = await selectLatestUserProfileById(conn, {
                id: userId,
            });

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
                    role: org.roleName,
                    authorityManageOrganization:
                        org.authorityManageOrganization,
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

export const factoryFindUserByEmail =
    <Context>(pool: Pool): Find<User, Email, Context> =>
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
                    role: org.roleName,
                    authorityManageOrganization:
                        org.authorityManageOrganization,
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

export const factoryPersistUserWithDefaultOrganization =
    <Context>(
        pool: Pool,
    ): Persist<User & UserCreationWithDefaultOrganizationEvent, Context> =>
    async (user) => {
        try {
            await tx(pool, async (conn) => {
                await insertUser(conn, { id: user.id });
                await insertUserEmailRegistration(conn, {
                    id: uuidv7(),
                    userId: user.id,
                    email: user.email,
                });
                await insertUserProfile(conn, {
                    id: uuidv7(),
                    userId: user.id,
                    name: user.displayName ? user.displayName : null,
                });

                const organization = user.belongingOrganizations.find(
                    (organization) =>
                        organization.id === user.createdOrganizationId,
                );

                if (!organization) {
                    throw new DataConsistencyError(
                        `createdOrganization not found ${user.createdOrganizationId}`,
                    );
                }

                await insertOrgaization(conn, { id: organization.id });
                await insertOrganizationProfile(conn, {
                    id: uuidv7(),
                    organizationId: organization.id,
                    name: user.createdOrganizationName,
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
            });
            return { value: user.id };
        } catch (e) {
            return {
                error: new IoError("connection or transaction error", {
                    cause: e,
                }),
            };
        }
    };

export const factoryPersistUserWithInvitedOrganization =
    <Context>(
        pool: Pool,
    ): Persist<User & UserCreationWithInvitedOrganizationEvent, Context> =>
    async (user) => {
        try {
            await tx(pool, async (conn) => {
                await insertUser(conn, { id: user.id });
                await insertUserEmailRegistration(conn, {
                    id: uuidv7(),
                    userId: user.id,
                    email: user.email,
                });
                await insertUserProfile(conn, {
                    id: uuidv7(),
                    userId: user.id,
                    name: user.displayName ? user.displayName : null,
                });

                for (const organization of user.belongingOrganizations) {
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
            });
            return { value: user.id };
        } catch (e) {
            return {
                error: new IoError("connection or transaction error", {
                    cause: e,
                }),
            };
        }
    };

export const factoryPersistOrganizationWithUserInvitation =
    <Context>(
        pool: Pool,
    ): Persist<Organization & UserInvitationEvent, Context> =>
    async (oranization: Organization & UserInvitationEvent) => {
        try {
            await tx(pool, async (conn) => {
                const user = oranization.users.find(
                    (user) => user.email === oranization.inviteeEmail,
                );

                if (user) {
                    const belongId = uuidv7();
                    await insertBelong(conn, {
                        id: belongId,
                        userId: user.id,
                        organizationId: oranization.id,
                    });
                    await insertAssign(conn, {
                        id: uuidv7(),
                        roleName: user.role,
                        belongId,
                    });
                }

                await insertOrganizationInvitation(conn, {
                    id: uuidv7(),
                    organizationId: oranization.id,
                    roleName: oranization.inviteeRole,
                    inviteeUserEmail: oranization.inviteeEmail,
                    inviterUserId: oranization.inviterUserId,
                });
            });
            return { value: oranization.id };
        } catch (e) {
            return {
                error: new IoError("connection or transaction error", {
                    cause: e,
                }),
            };
        }
    };

export const factoryFindOrganizationById =
    <Context>(pool: Pool): Find<Organization, OrganizationId, Context> =>
    async (organizationId) => {
        let conn;

        try {
            conn = await pool.connect();

            const [
                oranizationProfile,
                organizationUsers,
                organizationInviting,
            ] = await Promise.all([
                selectLatestOraganizationProfileById(conn, {
                    id: organizationId,
                }),
                selectOrganizationUsers(conn, { organizationId }),
                selectInvitingUnknownUsers(conn, { organizationId }),
            ]);

            const oranizationName = oranizationProfile?.name
                ? parseDisplayName(oranizationProfile.name)
                : undefined;

            if (
                !oranizationName?.value ||
                oranizationName?.error ||
                organizationUsers.length === 0
            ) {
                throw new DataConsistencyError(
                    `invlid data: organizationName: ${oranizationName}, users:${organizationUsers.length}`,
                );
            }

            const users = [];
            for (const row of organizationUsers) {
                const id = parseUserId(row.userId);
                const displayName = row.userName
                    ? parseDisplayName(row.userName)
                    : undefined;
                const email = parseEmail(row.email);
                const role = parseRole(row.roleName);
                if (
                    id.error ||
                    displayName?.error ||
                    email.error ||
                    role.error
                ) {
                    throw new DataConsistencyError(
                        `invalid data ${id}, ${displayName}, ${email}, ${role}`,
                    );
                }
                users.push({
                    id: id.value,
                    displayName: displayName?.value,
                    email: email.value,
                    role: role.value,
                });
            }

            const invitingUnknownUsers = [];

            for (const user of organizationInviting) {
                const email = parseEmail(user.inviteeUserEmail);
                const role = parseRole(user.roleName);
                if (email.error || role.error) {
                    throw new DataConsistencyError(
                        `invalid data: ${email} ${role}`,
                    );
                }
                invitingUnknownUsers.push({
                    email: email.value,
                    role: role.value,
                });
            }

            return {
                value: {
                    id: organizationId,
                    displayName: oranizationName.value,
                    users,
                    invitingUnknownUsers,
                },
            };
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

export const factoryFindUnknownUserByEmail =
    <Context>(pool: Pool): Find<UnknownUser, Email, Context> =>
    async (email) => {
        let conn;

        try {
            conn = await pool.connect();

            const unknownUser = await selectInvitedUnknownUserByEmail(conn, {
                inviteeUserEmail: email,
            });

            const invitedOrganizations = [];

            for (const user of unknownUser) {
                const id = parseOrganizationId(user.organizationId);
                const role = parseRole(user.roleName);
                if (id.error || role.error) {
                    throw new DataConsistencyError(
                        `invalid resources: ${id}, ${role}`,
                    );
                }
                invitedOrganizations.push({ id: id.value, role: role.value });
            }

            return {
                value: {
                    email,
                    invitedOrganizations,
                },
            };
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
