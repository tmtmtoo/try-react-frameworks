import { User } from "../commands/entities";
import { Email, UserId } from "../commands/values";
import { Component, Result } from "../types";

export class IoError extends Error {
    // biome-ignore lint: <any>
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export class DataConsistencyError extends Error {
    // biome-ignore lint: <any>
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export type FindUser<Context> = Component<
    Email,
    Context,
    Result<User | null, IoError | DataConsistencyError | Error>
>;

export type PersistUser<Context> = Component<
    User,
    Context,
    Result<UserId, IoError | Error>
>;
