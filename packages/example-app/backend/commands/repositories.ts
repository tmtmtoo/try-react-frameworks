import { Component, Result } from "../types";
import { Email } from "./values";
import { User } from "./entities";

export class IoError extends Error {
    // biome-ignore lint: <any>
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export class ResponseConversionError extends Error {
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
    Result<
        User | undefined,
        IoError | ResponseConversionError | DataConsistencyError
    >
>;

export type PersistUser<Context> = Component<
    User,
    Context,
    Result<
        User,
        IoError | ResponseConversionError | DataConsistencyError
    >
>;
