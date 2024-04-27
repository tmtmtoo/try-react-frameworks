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

export type User = {
    id: UserId;
    email: Email;
    displayName?: DisplayName;
    organizations: {
        id: OrganizationId;
        displayName: DisplayName;
        role: Role;
        authorityExample?: boolean;
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
