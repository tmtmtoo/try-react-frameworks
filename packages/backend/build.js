import { build } from "esbuild";

build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outExtension: {
        ".js": ".mjs",
    },
    external: ["./node_modules/*"],
    logLevel: "info",
    sourcemap: true,
    write: true,
    outdir: "dist",
    banner: {
        js: 'import { createRequire } from "module"; import url from "url"; const require = createRequire(import.meta.url); const __filename = url.fileURLToPath(import.meta.url); const __dirname = url.fileURLToPath(new URL(".", import.meta.url));',
    },
});
