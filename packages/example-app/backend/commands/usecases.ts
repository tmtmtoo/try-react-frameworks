import { Component } from "backend/component";
import { Result, err, ok } from "neverthrow";
import { User, createUserWithDefaultOrganization } from "./entities";
import { DisplayName, Email, displayName, email } from "./values";

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

  if (parsedEmail.isErr()) {
    return err(
      new Error("invalid email value", {
        cause: parsedEmail._unsafeUnwrapErr(),
      }),
    );
  }

  if (parsedDisplayName && parsedDisplayName.isErr()) {
    return err(
      new Error("invalid display name", {
        cause: parsedDisplayName._unsafeUnwrapErr(),
      }),
    );
  }

  return ok({
    email: parsedEmail?._unsafeUnwrap(),
    displayName: parsedDisplayName?._unsafeUnwrap(),
  });
};

export const loginOrSignupUseCase =
  <Context>(
    findUser: Component<Email, Context, Result<User | null, Error>>,
    persistUser: Component<User, Context, Result<User, Error>>,
  ) =>
  async (
    command: LoginOrSignupCommand,
    ctx: Context,
  ): Promise<Result<User, Error>> => {
    const findResult = await findUser(command.email, ctx);

    return findResult.match(
      async (user) => {
        if (user) {
          return ok(user);
        } else {
          const userWithDefaultOrganization = createUserWithDefaultOrganization(
            command.email,
          );
          const persistResult = await persistUser(
            userWithDefaultOrganization,
            ctx,
          );

          return persistResult.mapErr(
            (e) => new Error("faield to create user", { cause: e }),
          );
        }
      },
      async (e) => {
        return err(new Error("failed to find user", { cause: e }));
      },
    );
  };
