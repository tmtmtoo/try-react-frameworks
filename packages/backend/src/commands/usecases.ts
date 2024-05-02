import {
    AuthorizationError,
    DuplicationError,
    Organization,
    User,
    UserInvitationEvent,
    createUserWithDefaultOrganization,
    inviteKnownUser,
    inviteUnkownUser,
} from "../commands/entities";
import { Find, IoError, Persist } from "../commands/repositories";
import {
    DisplayName,
    Email,
    OrganizationId,
    Role,
    UserId,
    parseDisplayName,
    parseEmail,
    parseOrganizationId,
    parseRole,
    parseUserId,
} from "../commands/values";
import { Component, Result } from "../types";

export class RepositoryError extends Error {
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export class UnknownError extends Error {
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export type LoginOrSignupCommand = {
    email: Email;
    displayName?: DisplayName;
};

export const parseLoginOrSignupCommand = (
    email: string,
    displayName?: string,
): Result<LoginOrSignupCommand, Error> => {
    const parsedEmail = parseEmail(email);

    const parsedDisplayName =
        displayName !== undefined ? parseDisplayName(displayName) : undefined;

    if (parsedEmail.error || parsedDisplayName?.error) {
        return {
            error: new Error(
                `Invalid LoginOrSignup Command: email: ${email}, displayName: ${displayName}`,
            ),
        };
    }

    return {
        value: {
            email: parsedEmail.value,
            displayName: parsedDisplayName?.value,
        },
    };
};

export type LoginOrSignupResult = Result<
    UserId,
    RepositoryError | UnknownError
>;

export type LoginOrSignupUseCase<Context> = Component<
    LoginOrSignupCommand,
    Context,
    LoginOrSignupResult
>;

export const factoryLoginOrSignupUseCase =
    <Context>(
        findUser: Find<User, Email, Context>,
        persistUser: Persist<User, Context>,
    ): LoginOrSignupUseCase<Context> =>
    async (command: LoginOrSignupCommand, ctx: Context) => {
        const findResult = await findUser(command.email, ctx);

        if (findResult.value === null) {
            const userWithDefaultOrganization =
                createUserWithDefaultOrganization(command.email);
            const persistResult = await persistUser(
                userWithDefaultOrganization,
                ctx,
            );

            if (persistResult.value) {
                return { value: persistResult.value };
            }
            if (persistResult.error instanceof Error) {
                return {
                    error: new RepositoryError("failed to persist user", {
                        cause: persistResult.error,
                    }),
                };
            }
            return {
                error: new UnknownError("Unknown error has occured", {
                    cause: persistResult.error,
                }),
            };
        }

        if (findResult.value) {
            return { value: findResult.value.id };
        }
        if (findResult.error instanceof Error) {
            return {
                error: new RepositoryError("failed to find user", {
                    cause: findResult.error,
                }),
            };
        }
        return {
            error: new UnknownError("Unknown error has occured", {
                cause: findResult.error,
            }),
        };
    };

export type InviteUserCommand = {
    oranizationId: OrganizationId;
    role: Role;
    inviteeEmai: Email;
    inviterUserId: UserId;
};

export const parseInviteUserCommand = (
    oranizationId: string,
    role: string,
    inviteeEmai: string,
    inviterUserId: string,
): Result<InviteUserCommand, Error> => {
    const parsedOranizationId = parseOrganizationId(oranizationId);
    const parsedRole = parseRole(role);
    const parsedInviteeEmail = parseEmail(inviteeEmai);
    const parsedInviterUserId = parseUserId(inviterUserId);

    if (
        parsedOranizationId.error ||
        parsedRole.error ||
        parsedInviteeEmail.error ||
        parsedInviterUserId.error
    ) {
        return {
            error: new Error(
                `Invalid InviteUserCommand: oranizationId: ${oranizationId}, role: ${role}, inviteeEmail: ${inviteeEmai}, inviterUserId: ${inviterUserId}`,
            ),
        };
    }

    return {
        value: {
            oranizationId: parsedOranizationId.value,
            role: parsedRole.value,
            inviteeEmai: parsedInviteeEmail.value,
            inviterUserId: parsedInviterUserId.value,
        },
    };
};

export type InviteUserResult = Result<
    OrganizationId,
    RepositoryError | AuthorizationError | DuplicationError | UnknownError
>;

export type InviteUserUseCase<Context> = Component<
    InviteUserCommand,
    Context,
    InviteUserResult
>;

export const factoryInviteUserUseCase =
    <Context>(
        findUserByEmail: Find<User, Email, Context>,
        findUserById: Find<User, UserId, Context>,
        findOranizationById: Find<Organization, OrganizationId, Context>,
        persistOrganizationWithUserInvitation: Persist<
            Organization & UserInvitationEvent,
            Context
        >,
    ): InviteUserUseCase<Context> =>
    async (command: InviteUserCommand, ctx: Context) => {
        const [inviter, invitee, organization] = await Promise.all([
            findUserById(command.inviterUserId, ctx),
            findUserByEmail(command.inviteeEmai, ctx),
            findOranizationById(command.oranizationId, ctx),
        ]);

        if (inviter.error || invitee.error || organization.error) {
            return {
                error: new RepositoryError("failed to find resources", {
                    cause: inviter.error || invitee.error || organization.error,
                }),
            };
        }

        if (inviter.value === null || organization.value === null) {
            return { error: new UnknownError("resouces nof found") };
        }

        let oranizationWithUserIvitation;

        if (invitee.value) {
            oranizationWithUserIvitation = inviteKnownUser(
                organization.value,
                command.role,
                invitee.value,
                inviter.value,
            );
        } else {
            oranizationWithUserIvitation = inviteUnkownUser(
                organization.value,
                command.role,
                command.inviteeEmai,
                inviter.value,
            );
        }

        if (oranizationWithUserIvitation.error) {
            return { error: oranizationWithUserIvitation.error };
        }

        const result = await persistOrganizationWithUserInvitation(
            oranizationWithUserIvitation.value,
            ctx,
        );

        if (result.error instanceof IoError) {
            return {
                error: new RepositoryError(
                    "failed to persist due to io error",
                    { cause: result.error },
                ),
            };
        }

        if (result.error) {
            return {
                error: new UnknownError(
                    "failed to persist due to unknown error",
                    { cause: result.error },
                ),
            };
        }

        return { value: result.value };
    };
