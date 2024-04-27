import { describe, expect, it, vi } from "vitest";
import { DataConsistencyError, IoError } from "../commands/repositories";
import {
    LoginOrSignupCommand,
    RepositoryError,
    UnknownError,
    factoryLoginOrSignupUseCase,
    parseLoginOrSignupCommand,
} from "../commands/usecases";
import {
    DisplayName,
    Email,
    OrganizationId,
    Role,
    UserId,
} from "../commands/values";

describe("when parse loginOrSignupCommand", () => {
    it("fails if given invalid email", () => {
        const result = parseLoginOrSignupCommand("aaa", "bbb");
        expect(result.error).toBeInstanceOf(Error);
    });
    it("fails if given empty displayName", () => {
        const result = parseLoginOrSignupCommand("aaa@example.com", "");
        expect(result.error).toBeInstanceOf(Error);
    });
    it("success if given correct email and displayName", () => {
        const result = parseLoginOrSignupCommand("aaa@example.com", "aaa");
        expect(result.value).toStrictEqual({
            email: "aaa@example.com",
            displayName: "aaa",
        });
    });
    it("success if given correct email", () => {
        const result = parseLoginOrSignupCommand("aaa@example.com");
        expect(result.value).toStrictEqual({
            email: "aaa@example.com",
            displayName: undefined,
        });
    });
});

describe("when execute loginOrSignupUseCase", () => {
    it("return user id if founds by email", async () => {
        const user = {
            id: "018e8e8e-e5c2-7b45-b3eb-6570867230e5" as UserId,
            displayName: "aaa" as DisplayName,
            email: "aaa@example.com" as Email,
            organizations: [
                {
                    id: "018e8e8f-b0a2-7d42-b023-d3e38bd5529f" as OrganizationId,
                    displayName: "bbb" as DisplayName,
                    role: "admin" as Role,
                    authorityExample: true,
                },
            ],
        };
        const usecase = factoryLoginOrSignupUseCase(
            vi.fn().mockResolvedValue({ value: user }),
            vi.fn(),
        );
        const command = { email: "aaa@example.com" } as LoginOrSignupCommand;
        const result = await usecase(command, null);
        expect(result.value).toStrictEqual(user.id);
    });
    it("return user if not founds by email", async () => {
        const user = {
            id: "018e8e8e-e5c2-7b45-b3eb-6570867230e5" as UserId,
            displayName: "aaa" as DisplayName,
            email: "aaa@example.com" as Email,
            organizations: [
                {
                    id: "018e8e8f-b0a2-7d42-b023-d3e38bd5529f" as OrganizationId,
                    displayName: "bbb" as DisplayName,
                    role: "admin" as Role,
                    authorityExample: true,
                },
            ],
        };
        const usecase = factoryLoginOrSignupUseCase(
            vi.fn().mockResolvedValue({ value: null }),
            vi.fn().mockResolvedValue({ value: user }),
        );
        const command = { email: "aaa@example.com" } as LoginOrSignupCommand;
        const result = await usecase(command, null);
        expect(result.value).toStrictEqual(user);
    });
    it("return RepositoryError if findUser failed", async () => {
        const usecase = factoryLoginOrSignupUseCase(
            vi.fn().mockResolvedValue({ error: new IoError() }),
            vi.fn(),
        );
        const command = { email: "aaa@example.com" } as LoginOrSignupCommand;
        const result = await usecase(command, null);
        expect(result.error).toBeInstanceOf(RepositoryError);
    });
    it("return RepositoryError if persistUser failed", async () => {
        const usecase = factoryLoginOrSignupUseCase(
            vi.fn().mockResolvedValue({ value: null }),
            vi.fn().mockResolvedValue({ error: new DataConsistencyError() }),
        );
        const command = { email: "aaa@example.com" } as LoginOrSignupCommand;
        const result = await usecase(command, null);
        expect(result.error).toBeInstanceOf(RepositoryError);
    });
    it("return UnknownError if unexpected error occured", async () => {
        const usecase = factoryLoginOrSignupUseCase(
            vi.fn().mockResolvedValue({ error: "shit" }),
            vi.fn(),
        );
        const command = { email: "aaa@example.com" } as LoginOrSignupCommand;
        const result = await usecase(command, null);
        expect(result.error).toBeInstanceOf(UnknownError);
    });
    it("throw exception if repository throws exception", async () => {
        const usecase = factoryLoginOrSignupUseCase(
            vi.fn().mockRejectedValue(new Error()),
            vi.fn(),
        );
        const command = { email: "aaa@example.com" } as LoginOrSignupCommand;
        expect(() => usecase(command, null)).rejects.toThrow(new Error());
    });
});
