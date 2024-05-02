import { Email } from "../commands/values";
import { Component, Result } from "../types";

export class IoError extends Error {
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export class DataConsistencyError extends Error {
    constructor(...args: any) {
        super(args);
        this.name = this.constructor.name;
    }
}

export type Find<T, K, Context> = Component<
    K,
    Context,
    Result<T | null, IoError | DataConsistencyError | Error>
>;

export type Persist<T extends { id: any }, Context> = Component<
    T,
    Context,
    Result<T["id"], IoError | Error>
>;
