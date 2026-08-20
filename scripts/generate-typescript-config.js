#!/usr/bin/env node

// Generate the ignored VS Code TypeScript config from the Pebble build's active
// SDK typings. Run after `mise build`, or directly with `mise typescript-config`.

const fs = require("node:fs");
const path = require("node:path");

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
if (!generatedConfigPath) {
	console.error("Could not find the generated Moddable TypeScript configuration.");
	console.error("Run `mise build` before generating the VS Code configuration.");
	process.exit(1);
}

const generatedConfig = JSON.parse(fs.readFileSync(generatedConfigPath, "utf8"));
const typingPath = Object.values(generatedConfig.compilerOptions.paths ?? {})
	.flat()
	.find((value) => value.includes("/typings/") || value.includes("\\typings\\"));

if (!typingPath) {
	console.error("Could not locate the Moddable SDK typings in the generated config.");
	process.exit(1);
}

const normalizedTypingPath = typingPath.replaceAll("\\", "/");
const typingsMarker = "/typings/";
const typingsRoot = path.resolve(
	normalizedTypingPath.slice(0, normalizedTypingPath.indexOf(typingsMarker) + "/typings".length),
);

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
