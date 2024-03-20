import { Result, err, ok } from "neverthrow";
import * as v from "valibot";

type Typed<Value, Tag> = Value & { tag: Tag };

const factoryUsingValibot =
  <V, T>(schema: v.BaseSchema) =>
  (value: V): Result<Typed<V, T>, Error> => {
    try {
      const parsed = v.parse(schema, value);
      return ok(parsed as Typed<V, T>);
    } catch (e) {
      const error = new Error(`failed to parse value: ${value}`, { cause: e });
      return err(error);
    }
  };

type ReturnFactoryType<T extends (...args: any) => any> =
  ReturnType<T> extends Result<infer O, infer E> ? O : never;

export const email = factoryUsingValibot<string, "email">(
  v.string([v.email()]),
);

export type Email = ReturnFactoryType<typeof email>;

export const displayName = factoryUsingValibot<string, "displayName">(
  v.string([v.minLength(1)]),
);

export type DisplayName = ReturnFactoryType<typeof displayName>;

export const userId = factoryUsingValibot<string, "userId">(
  v.string([v.uuid()]),
);

export type UserId = ReturnFactoryType<typeof userId>;

export const organizationId = factoryUsingValibot<string, "organizationId">(
  v.string([v.uuid()]),
);

export type OrganizationId = ReturnFactoryType<typeof organizationId>;

export type Role = "admin" | "member" | "guest" | string;
