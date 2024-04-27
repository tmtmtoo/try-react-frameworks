import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        poolMatchGlobs: [["**/pg.test.ts*", "forks"]],
    },
});
