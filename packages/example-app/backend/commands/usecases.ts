import { Component, Result } from "backend/types";
import { User, createUserWithDefaultOrganization } from "./entities";
import { DisplayName, Email, displayName, email } from "./values";
import { FindUser, PersistUser } from "./repositories";

export class RepositoryError extends Error {
    // biome-ignore lint: <any>
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export class UnknownError extends Error {
    // biome-ignore lint: <any>
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export type LoginOrSignupCommand = {
    email: Email;
    displayName?: DisplayName;
};

export const loginOrSignupCommand = (
    emailValue: string,
    displayNameValue?: string,
): Result<LoginOrSignupCommand, Error> => {
    const parsedEmail = email(emailValue);

    const parsedDisplayName = displayNameValue
        ? displayName(displayNameValue)
        : undefined;

    if (parsedEmail.error || parsedDisplayName?.error) {
        return {
            error: new Error(
                `Invalid LoginOrSignup Command: email: ${emailValue}, displayName: ${displayNameValue}`,
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

export type LoginOrSignupResult = Result<User, RepositoryError | UnknownError>;

export const createLoginOrSignupUseCase =
    <Context>(
        findUser: FindUser<Context>,
        persistUser: PersistUser<Context>
    ) =>
    async (
        command: LoginOrSignupCommand,
        ctx: Context,
    ): Promise<LoginOrSignupResult> => {
        const findResult = await findUser(command.email, ctx);

        if (findResult.value) {
            return { value: findResult.value };
        }

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

            return {
                error: new RepositoryError("failed to persist user", {
                    cause: persistResult.error,
                }),
            };
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
