# Contributing

This project uses [mise](https://mise.jdx.dev/) to manage its pinned Pebble
CLI, TypeScript, and icon-rendering dependencies. Install mise first by
following its [getting started guide](https://mise.jdx.dev/getting-started.html).

## Setup

From a fresh checkout on macOS, install the pinned tools with:

```sh
mise install
```

Build the project with:

```sh
mise build
```

Run the same checks used by the pull request workflow with:

```sh
mise check
```

This runs TypeScript in the watch build, phone build, and VS Code editor
projects, plus the pinned Biome linter. The committed
`tsconfig.pkjs.editor.json` mirrors the ECMAScript-module context VS Code uses
for `src/pkjs/`, so editor-only module diagnostics fail in CI too.

This activates the SDK version in `pebble-sdk-version`, and the Pebble CLI
installs the project’s npm dependencies as needed.

Build profiles keep development and release installs separate:

```sh
mise build dev
mise build release
```

The dev build uses a separate app UUID and appears as `Marco Pebble (Dev)`, so
it can be installed alongside the release build. `mise build` defaults to the
release profile.

To disable the speaker during local development, copy `.env.example` to `.env`
and leave `MARCO_DISABLE_SPEAKER=1` enabled.

You can also disable the speaker for one build with:

```sh
MARCO_DISABLE_SPEAKER=1 mise build
```

Generate the C/C++ IntelliSense database with:

```sh
mise compile-commands
```

This creates the local `compile_commands.json` (untracked).

Open the repository folder in VS Code. To configure C/C++ IntelliSense to use
the generated Pebble SDK compilation settings:

1. Open the Command Palette (`Cmd+Shift+P`).
2. Run `C/C++: Reset IntelliSense Database`.
3. Run `C/C++: Rescan Workspace`.

If `compile_commands.json` is missing or the SDK changes, regenerate it with:

```sh
mise compile-commands
```

`mise build` also generates the local TypeScript project configuration from
the active Pebble SDK. If the generated config is missing after a build, run:

```sh
mise typescript-config
```

`mise typecheck` can bootstrap that generated configuration from the active SDK
before a build, which keeps a fresh checkout and VS Code on the same typings.

Open `src/embeddedjs/main.ts` in VS Code first, then run `TypeScript: Restart TS
Server` from the Command Palette. The command is only available while a
TypeScript file is active. The generated `tsconfig.json` and `.pebble/` SDK
typings cache are local files and should not be committed.

## Development workflow

Build all target platforms with:

```sh
mise build
```

When build artifacts may be stale, clean and rebuild from scratch with:

```sh
mise rebuild
```

Build and install the app in the Emery emulator with:

```sh
mise install-emulator
```

Remove Pebble build artifacts with:

```sh
mise clean
```

The pinned Pebble SDK is activated automatically by these tasks. Use the
underlying `pebble` command directly only when intentionally bypassing the
repository workflow.

## Project layout

```text
src/c/mdbl.c                   C glue around the Moddable runtime
src/c/speaker.c                FFI bridge to the Pebble Speaker API
src/embeddedjs/main.ts         TypeScript that runs on the watch
src/embeddedjs/manifest.json   Moddable manifest
src/pkjs/index.ts              PebbleKit JS (phone-side) entry point
package.json                   Project metadata
wscript                        Build rules
```

For more information, see the [Pebble C SDK documentation](https://developer.repebble.com/docs/c/),
[Alloy documentation](https://developer.repebble.com/guides/alloy/), and the
[Pebble TypeScript example](https://github.com/Moddable-OpenSource/pebble-examples/tree/main/hellotypescript).
