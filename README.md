# Marco Pebble

A Pebble Alloy project for finding your Pebble and phone. The current MVP is a
Time 2 speaker test: press SELECT to toggle a repeating procedural chirp. Watch code is
written in TypeScript and compiled to embedded JavaScript by the Alloy build.

## Building & running

```sh
mise build                             # activate pinned SDK and build
mise install-emulator                  # build and install in Emery emulator
mise rebuild                           # clean, activate SDK, and rebuild
mise clean                             # clean Pebble build artifacts
```

The pinned Pebble SDK is activated automatically by the mise tasks. Use the
underlying `pebble` command directly only when you intentionally want to bypass
that task flow.

## Target platforms

Alloy targets the modern Pebble hardware: **emery** (Pebble Time 2) and
**gabbro** (Pebble Round 2). Other platforms are currently not supported.

## Project layout

```
src/c/mdbl.c                   C glue around the Moddable runtime
src/c/speaker.c                FFI bridge to the Pebble Speaker API
src/embeddedjs/main.ts         TypeScript that runs on the watch
src/embeddedjs/manifest.json   Moddable manifest
src/pkjs/index.js              PebbleKit JS (phone-side) code
package.json                   Project metadata (UUID, platforms, resources)
wscript                        Build rules — usually no need to edit
```

## Documentation

Full SDK docs and tutorials: <https://developer.repebble.com>

TypeScript example: <https://github.com/Moddable-OpenSource/pebble-examples/tree/main/hellotypescript>

PebbleKit JS source: https://github.com/coredevices/mobileapp
