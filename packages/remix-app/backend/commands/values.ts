import { Result } from "backend/types";
import * as v from "valibot";

type Typed<Value, Tag> = Value & { tag: Tag };

const factoryUsingValibot =
    <V, T>(schema: v.BaseSchema) =>
    (value: V): Result<Typed<V, T>, Error> => {
        try {
            const parsed = v.parse(schema, value);
            return { value: parsed as Typed<V, T> };
        } catch (e) {
            const error = new Error(`failed to parse value: ${value}`, {
                cause: e,
            });
            return { error };
        }
    };

// biome-ignore lint: <any>
type ReturnFactoryType<T extends (...args: any) => any> =
    ReturnType<T> extends Result<infer O, infer E> ? O : never;

export const parseEmail = factoryUsingValibot<string, "email">(
    v.string([v.email()]),
);

export type Email = ReturnFactoryType<typeof parseEmail>;

export const parseDisplayName = factoryUsingValibot<string, "displayName">(
    v.string([v.minLength(1)]),
);

export type DisplayName = ReturnFactoryType<typeof parseDisplayName>;

export const parseUserId = factoryUsingValibot<string, "userId">(
    v.string([v.uuid()]),
);

export type UserId = ReturnFactoryType<typeof parseUserId>;

export const parseOrganizationId = factoryUsingValibot<
    string,
    "organizationId"
>(v.string([v.uuid()]));

export type OrganizationId = ReturnFactoryType<typeof parseOrganizationId>;

export type Role = "admin" | "member" | "guest" | string;

export const parseRole = factoryUsingValibot<Role, "role">(
    v.union([
        v.literal("admin"),
        v.literal("member"),
        v.literal("guest"),
        v.string(),
    ]),
);
