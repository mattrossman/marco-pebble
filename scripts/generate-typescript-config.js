#!/usr/bin/env node

// Generate the ignored VS Code TypeScript config from the Pebble build's active
// SDK typings. Run after `mise build`, or directly with `mise typescript-config`.

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const buildRoot = path.join(repoRoot, "build", "mods");
const localRoot = path.join(repoRoot, ".pebble");
const localTypings = path.join(localRoot, "typings");
const localConfig = path.join(repoRoot, "tsconfig.json");

function findFile(root, filename) {
	if (!fs.existsSync(root)) return undefined;

	for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
		const entryPath = path.join(root, entry.name);
		if (entry.isFile() && entry.name === filename) return entryPath;
		if (entry.isDirectory()) {
			const found = findFile(entryPath, filename);
			if (found) return found;
		}
	}
}

function collectTypingPaths(root) {
	const paths = {};

	function visit(directory) {
		for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
			const entryPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				visit(entryPath);
				continue;
			}
			if (!entry.isFile() || !entry.name.endsWith(".d.ts")) continue;

			const relativePath = path.relative(root, entryPath).replaceAll(path.sep, "/");
			const moduleName = relativePath.slice(0, -5);
			paths[moduleName] = [entryPath];
			if (moduleName.startsWith("embedded_")) {
				paths[`embedded:${moduleName.slice("embedded_".length)}`] = [entryPath];
			}
			if (moduleName.startsWith("embedded/")) {
				paths[`embedded:${moduleName.slice("embedded/".length)}`] = [entryPath];
			}
			if (moduleName.endsWith("/index")) {
				paths[moduleName.slice(0, -6)] = [entryPath];
			}
		}
	}

	visit(root);
	return paths;
}

function rewriteSdkPath(value) {
	const normalized = value.replaceAll("\\", "/");
	const normalizedRepoRoot = repoRoot.replaceAll("\\", "/");
	if (normalized.startsWith(`${normalizedRepoRoot}/`)) {
		return `./${normalized.slice(normalizedRepoRoot.length + 1)}`;
	}

	const typingsMarker = "/typings/";
	const typingsIndex = normalized.indexOf(typingsMarker);
	if (typingsIndex >= 0) {
		return `./${path
			.join(".pebble", "typings", normalized.slice(typingsIndex + typingsMarker.length))
			.split(path.sep)
			.join("/")}`;
	}

	const xsMarker = "/xs/includes/xs";
	if (normalized.endsWith(xsMarker)) return "./.pebble/xs";
	return value;
}

function rewritePaths(paths) {
	return Object.fromEntries(
		Object.entries(paths ?? {}).map(([name, values]) => [
			name,
			values.map(rewriteSdkPath),
		]),
	);
}

const generatedConfigPath = findFile(buildRoot, "tsconfig-base.json");
let generatedConfig;
let typingsRoot;

if (generatedConfigPath) {
	generatedConfig = JSON.parse(fs.readFileSync(generatedConfigPath, "utf8"));
	const typingPath = Object.values(generatedConfig.compilerOptions.paths ?? {})
		.flat()
		.find((value) => value.includes("/typings/") || value.includes("\\typings\\"));

	if (!typingPath) {
		console.error("Could not locate the Moddable SDK typings in the generated config.");
		process.exit(1);
	}

	const normalizedTypingPath = typingPath.replaceAll("\\", "/");
	const typingsMarker = "/typings/";
	typingsRoot = path.resolve(
		normalizedTypingPath.slice(0, normalizedTypingPath.indexOf(typingsMarker) + "/typings".length),
	);
} else {
	const sdkIncludePath = execFileSync(
		"pebble",
		["sdk", "include-path", "emery"],
		{ encoding: "utf8" },
	).trim();
	const sdkRoot = path.resolve(sdkIncludePath, "../../../..");
	const moddableRoot = path.join(sdkRoot, "toolchain", "moddable");
	typingsRoot = path.join(moddableRoot, "typings");
	generatedConfig = {
		compilerOptions: {
			forceConsistentCasingInFileNames: true,
			module: "preserve",
			resolveJsonModule: true,
			paths: {
				...collectTypingPaths(typingsRoot),
				"embedded:io/system": [path.join(typingsRoot, "embedded_io", "system")],
				"embedded:provider/builtin": [path.join(typingsRoot, "pebble", "device")],
				url: [path.join(typingsRoot, "web", "url")],
				headers: [path.join(typingsRoot, "web", "headers")],
				webstorage: [path.join(typingsRoot, "web", "webstorage")],
				fetch: [path.join(typingsRoot, "web", "fetch")],
				"web/websocket": [path.join(typingsRoot, "web", "websocket")],
			},
			lib: ["es2025", "esnext.disposable"],
			sourceMap: true,
			target: "es2025",
			types: [
				path.join(typingsRoot, "pebble", "global"),
				path.join(typingsRoot, "pebble", "piu"),
				path.join(typingsRoot, "pebble", "poco"),
				path.join(typingsRoot, "easing"),
				path.join(typingsRoot, "piu", "MC"),
				path.join(typingsRoot, "piu", "MC-types"),
				path.join(moddableRoot, "xs", "includes", "xs"),
				path.join(typingsRoot, "global"),
			],
		},
	};
}

fs.rmSync(localRoot, { recursive: true, force: true });
fs.mkdirSync(localRoot, { recursive: true });
fs.cpSync(typingsRoot, localTypings, {
	recursive: true,
	filter: (source) => !path.basename(source).startsWith("._"),
});

const xsTypePath = generatedConfig.compilerOptions.types?.find((value) =>
	value.replaceAll("\\", "/").endsWith("/xs/includes/xs"),
);
if (xsTypePath) {
	const source = `${xsTypePath}.d.ts`;
	fs.copyFileSync(source, path.join(localRoot, "xs.d.ts"));
}

const config = {
	compilerOptions: {
		...generatedConfig.compilerOptions,
		paths: rewritePaths(generatedConfig.compilerOptions.paths),
		types: generatedConfig.compilerOptions.types?.map(rewriteSdkPath),
	},
	include: ["src/embeddedjs/**/*.ts"],
};

fs.writeFileSync(localConfig, `${JSON.stringify(config, null, 2)}\n`);
console.log("Generated tsconfig.json with the active Pebble/Moddable typings.");
