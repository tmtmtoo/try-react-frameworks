import { uuidv7 } from "uuidv7";
import {
    DisplayName,
    Email,
    OrganizationId,
    Role,
    UserId,
    parseDisplayName,
    parseOrganizationId,
    parseUserId,
} from "../commands/values";
import { Result } from "../types";

export type User = {
    id: UserId;
    email: Email;
    displayName?: DisplayName;
    organizations: {
        id: OrganizationId;
        displayName: DisplayName;
        role: Role;
        authorityManageOrganization?: boolean;
    }[];
};

export const createUserWithDefaultOrganization = (
    email: Email,
    userId?: UserId,
    organizationId?: OrganizationId,
): User => ({
    id: userId ? userId : (parseUserId(uuidv7()).value as UserId),
    email,
    organizations: [
        {
            id: organizationId
                ? organizationId
                : (parseOrganizationId(uuidv7()).value as OrganizationId),
            displayName: parseDisplayName("My First Organization")
                .value as DisplayName,
            role: "admin",
        },
    ],
});

export const canInviteToOrganization = (
    user: User,
    organizationId: OrganizationId,
) =>
    user.organizations.find(
        (organization) => organization.id === organizationId,
    )?.authorityManageOrganization ?? false;

export type UserInvitationEvent = {
    inviteeRole: Role;
    inviteeEmail: Email;
    inviterUserId: UserId;
};

export type UsersInvitationEvent = {
    inviterUserId: UserId;
    inviteeUsers: {
        role: Role;
        email: Email;
    }[];
};

export type Organization = {
    id: OrganizationId;
    displayName: DisplayName;
    users: {
        id: UserId;
        email: Email;
        displayName?: DisplayName;
        role: Role;
    }[];
};

export class AuthorizationError extends Error {
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export class DuplicationError extends Error {
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export const inviteUnkownUser = (
    organization: Organization,
    role: Role,
    inviteeEmail: Email,
    inviter: User,
): Result<Organization & UserInvitationEvent, AuthorizationError | DuplicationError> => {
    if (!canInviteToOrganization(inviter, organization.id)) {
        return {
            error: new AuthorizationError(
                `can not invite ${inviteeEmail} by ${inviter.id} on ${organization.id}`,
            ),
        };
    }

    const isExists = !!organization.users.find(
        (user) => user.email === inviteeEmail,
    );

    if (isExists) {
        return {
            error: new DuplicationError(
                `${inviteeEmail} is existing on ${organization.id}`,
            ),
        };
    }

    const value = {
        ...organization,
        inviteeRole: role,
        inviteeEmail: inviteeEmail,
        inviterUserId: inviter.id,
    };

    return { value };
};

export const inviteKnownUser = (
    organization: Organization,
    role: Role,
    invitee: User,
    inviter: User,
): Result<Organization & UserInvitationEvent, AuthorizationError | DuplicationError> => {
    if (!canInviteToOrganization(inviter, organization.id)) {
        return {
            error: new AuthorizationError(
                `can not invite ${invitee.id} by ${inviter.id} on ${organization.id}`,
            ),
        };
    }

    const isExists = !!organization.users.find(
        (user) => user.id === invitee.id,
    );

    if (isExists) {
        return {
            error: new DuplicationError(`${invitee.id} is existing on ${organization.id}`),
        };
    }

    const value = {
        ...organization,
        users: [
            ...organization.users,
            {
                id: invitee.id,
                email: invitee.email,
                displayName: invitee.displayName,
                role,
            },
        ],
        inviteeRole: role,
        inviteeEmail: invitee.email,
        inviterUserId: inviter.id,
    };

    return { value };
};
