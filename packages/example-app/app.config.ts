import { url, minLength, object, optional, parse, string } from "valibot";

const schema = object({
    databaseUrl: optional(string([url()]), "postgres://dev@localhost:5432/dev"),
    sessionSecret: optional(string([minLength(6)]), "s3cr3t"),
    nodeEnv: string(),
});

export type Config = {
    databaseUrl?: string;
    sessionSecret?: string;
    nodeEnv?: string;
};

export const parseConfig = (config: Config) => parse(schema, config);
