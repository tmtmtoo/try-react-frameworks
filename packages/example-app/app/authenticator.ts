import { createCookieSessionStorage } from "@remix-run/node";
import {
    LoginOrSignupUseCase,
    parseLoginOrSignupCommand,
} from "backend/commands/usecases";
import { UserId } from "backend/commands/values";
import { Authenticator, AuthorizationError } from "remix-auth";
import { FormStrategy } from "remix-auth-form";

export const factoryAuth = (
    loginOrSignup: LoginOrSignupUseCase<null>,
    sessionSecret: string,
    secureCookie: boolean,
) => {
    const sessionStorage = createCookieSessionStorage({
        cookie: {
            name: "__session",
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secrets: [sessionSecret],
            secure: secureCookie,
        },
    });

    const authenticator = new Authenticator<UserId>(sessionStorage);

    authenticator.use(
        new FormStrategy(async ({ form }) => {
            const email = form.get("email")?.toString() || "";

            const command = parseLoginOrSignupCommand(email);

            if (command.error) {
                throw new AuthorizationError(
                    "Invalid credential",
                    command.error,
                );
            }

            const userId = await loginOrSignup(command.value, null);

            if (userId.error) {
                throw new AuthorizationError(
                    "Service unavailable",
                    userId.error,
                );
            }

            return userId.value;
        }),
    );

    return { authenticator, sessionStorage };
};
