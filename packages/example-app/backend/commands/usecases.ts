import { Component, Result } from "../types";
import { User, createUserWithDefaultOrganization } from "./entities";
import { FindUser, PersistUser } from "./repositories";
import { DisplayName, Email, parseDisplayName, parseEmail } from "./values";

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

export type LoginOrSignupResult = Result<User, RepositoryError | UnknownError>;

export type LoginOrSignupUseCase<Context> = Component<
    LoginOrSignupCommand,
    Context,
    LoginOrSignupResult
>;

export const factoryLoginOrSignupUseCase =
    <Context>(
        findUser: FindUser<Context>,
        persistUser: PersistUser<Context>,
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
            return { value: findResult.value };
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
